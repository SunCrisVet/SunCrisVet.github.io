const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

const ALLOWED_HOSTS = new Set([
  "sun-cris-vet.pages.dev",
  "veterinar-nonstop.ro",
  "www.veterinar-nonstop.ro",
  "127.0.0.1",
  "localhost",
]);

const ANIMAL_LABELS = {
  caine: "Câine",
  pisica: "Pisică",
  altul: "Altul",
};

const INTERVAL_LABELS = {
  dimineata: "Luni–Vineri, 09:00–12:00",
  "dupa-amiaza": "Luni–Vineri, 12:00–18:00",
  sambata: "Sâmbătă, 09:00–13:00",
  oricand: "Oricând în timpul programului",
};

function json(message, status = 200) {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: JSON_HEADERS,
  });
}

function clean(value, maxLength) {
  return String(value || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function requestHostIsAllowed(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return false;

  try {
    return ALLOWED_HOSTS.has(new URL(origin).hostname);
  } catch {
    return false;
  }
}

async function validateTurnstile(token, request, secret) {
  const payload = new URLSearchParams({
    secret,
    response: token,
  });
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) payload.set("remoteip", remoteIp);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: payload,
  });
  const result = await response.json();
  return result.success === true && (!result.action || result.action === "appointment_request");
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!requestHostIsAllowed(request)) {
    return json("Cererea nu a putut fi verificată.", 403);
  }

  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > 12_000) {
    return json("Cererea este prea mare.", 413);
  }

  if (
    !env.GOOGLE_SCRIPT_URL ||
    !env.FORM_RECIPIENT ||
    !env.FORM_WEBHOOK_SECRET ||
    !env.TURNSTILE_SECRET_KEY
  ) {
    return json("Formularul nu este încă disponibil. Te rugăm să ne suni.", 503);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json("Datele formularului nu au putut fi citite.", 400);
  }

  if (clean(form.get("website"), 120)) {
    return json("Cererea a fost trimisă.");
  }

  const name = clean(form.get("name"), 80);
  const phone = clean(form.get("phone"), 24);
  const phoneDigits = phone.replace(/\D/g, "");
  const animal = clean(form.get("animal"), 20);
  const preferred = clean(form.get("preferred"), 30);
  const privacyAccepted = form.get("privacy") === "accepted";
  const turnstileToken = clean(form.get("cf-turnstile-response"), 2048);

  if (name.length < 2 || phoneDigits.length < 9 || phoneDigits.length > 15) {
    return json("Verifică numele și numărul de telefon.", 400);
  }
  if (!ANIMAL_LABELS[animal] || !INTERVAL_LABELS[preferred] || !privacyAccepted) {
    return json("Completează toate câmpurile obligatorii.", 400);
  }
  if (!turnstileToken) {
    return json("Confirmă verificarea anti-spam.", 400);
  }

  let turnstileIsValid = false;
  try {
    turnstileIsValid = await validateTurnstile(turnstileToken, request, env.TURNSTILE_SECRET_KEY);
  } catch {
    return json("Verificarea anti-spam nu este disponibilă momentan.", 503);
  }
  if (!turnstileIsValid) {
    return json("Verificarea anti-spam a expirat. Încearcă din nou.", 400);
  }

  const submittedAt = new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Bucharest",
  }).format(new Date());

  try {
    const emailResponse = await fetch(env.GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain; charset=UTF-8" },
      body: JSON.stringify({
        secret: env.FORM_WEBHOOK_SECRET,
        recipient: env.FORM_RECIPIENT,
        name,
        phone,
        animal: ANIMAL_LABELS[animal],
        preferred: INTERVAL_LABELS[preferred],
        submittedAt,
      }),
    });

    if (!emailResponse.ok) throw new Error("Email gateway unavailable");
    const result = await emailResponse.json();
    if (result?.ok !== true) throw new Error("Email gateway rejected request");
  } catch {
    return json("Cererea nu a putut fi trimisă momentan.", 502);
  }

  return json("Cererea a fost trimisă.");
}

export function onRequestGet() {
  return json("Metodă neacceptată.", 405);
}
