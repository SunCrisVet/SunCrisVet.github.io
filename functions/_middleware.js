// Bucharest is UTC+02:00 on 3 December. Use the server clock so visitors in
// other time zones, and search crawlers, receive the same reopening date.
export const CLOSURE_END = Date.parse("2026-12-03T00:00:00+02:00");

export function expireClosure(html, now = Date.now()) {
  if (now < CLOSURE_END || !html.includes("<!-- temporary-closure:start -->")) return html;

  const restoreUrgentStrip = html.includes('<span class="meta-label">Program obișnuit</span>');
  html = html
    .replace(/\s*<!-- temporary-closure:start -->[\s\S]*?<!-- temporary-closure:end -->\s*/, "\n\n  ")
    .replace('<span class="meta-label">Program obișnuit</span>', '<span class="meta-label">Program</span>')
    .replace(/\s*<p class="closure-form-note"[^>]*>[\s\S]*?<\/p>/, "")
    .replace(
      "Trimite o cerere scurtă și te contactăm telefonic începând cu 3 decembrie, după reluarea activității.",
      "Trimite o cerere scurtă și te contactăm telefonic în timpul programului."
    )
    .replace(
      /<strong>Pentru situații urgente în perioada închiderii<\/strong>\s*<span>Consultațiile și tratamentele nu sunt disponibile în perioada 23 noiembrie–2 decembrie\. Pentru urgențe, contactează un centru veterinar deschis\.<\/span>/,
      '<strong>Pentru situații urgente</strong>\n          <span>Sună direct la <a href="tel:+40723603355">0723 603 355</a>. Formularul nu este monitorizat permanent.</span>'
    );

  if (restoreUrgentStrip) {
    html = html.replace(
      '<header class="site-header">',
      '<div class="notice" role="note"><span>Pentru situații urgente în timpul programului</span><a href="tel:+40723603355">Sună înainte de deplasare: 0723 603 355</a></div>\n\n  <header class="site-header">'
    );
  }
  return html;
}

export async function onRequest(context) {
  const response = await context.next();
  const headers = new Headers(response.headers);
  const hostname = new URL(context.request.url).hostname.toLowerCase();

  if (hostname.endsWith(".pages.dev")) {
    headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  let body = response.body;
  if (context.request.method === "GET" && headers.get("Content-Type")?.includes("text/html")) {
    const originalHtml = await response.text();
    body = expireClosure(originalHtml);
    headers.delete("Content-Length");
    headers.delete("Content-Encoding");
    if (originalHtml.includes("<!-- temporary-closure:start -->")) {
      // Do not let a browser reuse a pre-reopening page after the deadline.
      headers.set("Cache-Control", "no-cache, must-revalidate");
      headers.delete("ETag");
      headers.delete("Last-Modified");
    }
  }

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
