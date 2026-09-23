document.querySelectorAll("[data-current-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

const analyticsEvents = window.sunCrisVetAnalyticsEvents || [];
window.sunCrisVetAnalyticsEvents = analyticsEvents;

const trackConversion = (eventName, parameters = {}) => {
  const payload = {
    event: eventName,
    page_path: window.location.pathname,
    ...parameters,
  };

  analyticsEvents.push(payload);

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, parameters);
  } else {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  }
};

const getLinkLocation = (link) => {
  if (link.closest(".mobile-actions")) return "mobile_actions";
  if (link.closest(".site-header")) return "header";
  if (link.closest(".hero")) return "hero";
  if (link.closest("#recenzii")) return "reviews";
  if (link.closest("#contact")) return "contact";
  if (link.closest(".site-footer")) return "footer";
  return "content";
};

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;

  const link = event.target.closest("a");
  if (!link) return;

  const href = link.getAttribute("href") || "";
  const linkLocation = getLinkLocation(link);

  if (href.startsWith("tel:")) {
    trackConversion("phone_click", { link_location: linkLocation });
    return;
  }

  if (link.closest("#recenzii") && href.includes("share.google/")) {
    trackConversion("google_profile_click", { link_location: linkLocation });
    return;
  }

  if (href.includes("share.google/") || href.includes("google.com/maps")) {
    trackConversion("map_click", { link_location: linkLocation });
    return;
  }

  const destination = new URL(href, window.location.href);
  const serviceMatch = destination.pathname.match(/^\/servicii\/([^/]+)\/?/);
  if (serviceMatch) {
    trackConversion("service_click", {
      link_location: linkLocation,
      service: serviceMatch[1],
    });
  }
});

const navToggle = document.querySelector(".nav-toggle");
const mainNav = document.querySelector("#main-nav");

if (navToggle && mainNav) {
  const navToggleLabel = navToggle.querySelector(".sr-only");

  const setMenuState = (isOpen) => {
    navToggle.setAttribute("aria-expanded", String(isOpen));
    mainNav.dataset.open = String(isOpen);
    if (navToggleLabel) {
      navToggleLabel.textContent = isOpen ? "Închide meniul" : "Deschide meniul";
    }
  };

  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    setMenuState(!isOpen);
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      setMenuState(false);
    });
  });

  document.addEventListener("click", (event) => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    if (isOpen && !navToggle.contains(event.target) && !mainNav.contains(event.target)) {
      setMenuState(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
      setMenuState(false);
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
      trackConversion("appointment_request_success", { form_name: "callback_request" });
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
