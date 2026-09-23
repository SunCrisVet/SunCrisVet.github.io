document.querySelectorAll("[data-current-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

const navToggle = document.querySelector(".nav-toggle");
const mainNav = document.querySelector("#main-nav");

if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isOpen));
    mainNav.dataset.open = String(!isOpen);
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.setAttribute("aria-expanded", "false");
      mainNav.dataset.open = "false";
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      navToggle.setAttribute("aria-expanded", "false");
      mainNav.dataset.open = "false";
      navToggle.focus();
    }
  });
}

const callbackForm = document.querySelector("#callback-form");
const callbackStatus = document.querySelector("#callback-status");

if (callbackForm && callbackStatus) {
  callbackForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!callbackForm.reportValidity()) {
      return;
    }

    const submitButton = callbackForm.querySelector('button[type="submit"]');
    const originalLabel = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Se trimite…";
    callbackStatus.dataset.state = "";
    callbackStatus.textContent = "";

    try {
      const response = await fetch(callbackForm.action, {
        method: "POST",
        body: new FormData(callbackForm),
        headers: { Accept: "application/json" },
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Cererea nu a putut fi trimisă.");
      }

      callbackForm.reset();
      if (window.turnstile) {
        window.turnstile.reset();
      }
      callbackStatus.dataset.state = "success";
      callbackStatus.textContent = "Cererea a fost trimisă. Te vom contacta în timpul programului.";
    } catch (error) {
      callbackStatus.dataset.state = "error";
      callbackStatus.textContent = `${error.message} Te rugăm să suni la 0723 603 355.`;
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalLabel;
    }
  });
}
