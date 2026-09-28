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

const lightboxItems = [...document.querySelectorAll("[data-lightbox-item]")];
const photoLightbox = document.querySelector("[data-photo-lightbox]");

if (lightboxItems.length && photoLightbox) {
  const lightboxImage = photoLightbox.querySelector("[data-lightbox-image]");
  const lightboxCaption = photoLightbox.querySelector("[data-lightbox-caption]");
  const closeButton = photoLightbox.querySelector("[data-lightbox-close]");
  const previousButton = photoLightbox.querySelector("[data-lightbox-prev]");
  const nextButton = photoLightbox.querySelector("[data-lightbox-next]");
  const lightboxControls = [closeButton, previousButton, nextButton].filter(Boolean);
  let currentPhotoIndex = 0;
  let lastFocusedElement = null;

  const photoData = lightboxItems.map((item) => {
    const image = item.querySelector("img");
    const caption = item.closest("figure")?.querySelector("figcaption");
    return {
      src: item.getAttribute("href"),
      alt: image?.alt || "Fotografie din cabinetul Sun Cris Vet",
      caption: caption?.innerText.replace(/\s+/g, " ").trim() || image?.alt || "",
    };
  });

  const showPhoto = (index) => {
    currentPhotoIndex = (index + photoData.length) % photoData.length;
    const photo = photoData[currentPhotoIndex];
    lightboxImage.src = photo.src;
    lightboxImage.alt = photo.alt;
    lightboxCaption.textContent = `${currentPhotoIndex + 1} din ${photoData.length} · ${photo.caption}`;
  };

  const openLightbox = (index, trigger) => {
    lastFocusedElement = trigger;
    showPhoto(index);
    photoLightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    closeButton?.focus();
  };

  const closeLightbox = () => {
    photoLightbox.hidden = true;
    document.body.classList.remove("lightbox-open");
    lightboxImage.removeAttribute("src");
    lastFocusedElement?.focus();
  };

  lightboxItems.forEach((item, index) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      openLightbox(index, item);
    });
  });

  closeButton?.addEventListener("click", closeLightbox);
  previousButton?.addEventListener("click", () => showPhoto(currentPhotoIndex - 1));
  nextButton?.addEventListener("click", () => showPhoto(currentPhotoIndex + 1));

  photoLightbox.addEventListener("click", (event) => {
    if (event.target === photoLightbox) closeLightbox();
  });

  document.addEventListener("keydown", (event) => {
    if (photoLightbox.hidden) return;

    if (event.key === "Escape") {
      closeLightbox();
      return;
    }

    if (event.key === "ArrowLeft") {
      showPhoto(currentPhotoIndex - 1);
      return;
    }

    if (event.key === "ArrowRight") {
      showPhoto(currentPhotoIndex + 1);
      return;
    }

    if (event.key === "Tab" && lightboxControls.length) {
      const firstControl = lightboxControls[0];
      const lastControl = lightboxControls[lightboxControls.length - 1];

      if (event.shiftKey && document.activeElement === firstControl) {
        event.preventDefault();
        lastControl.focus();
      } else if (!event.shiftKey && document.activeElement === lastControl) {
        event.preventDefault();
        firstControl.focus();
      }
    }
  });
}

const mapContainer = document.querySelector("[data-map-container]");
const mapButton = document.querySelector("[data-load-map]");
const mapConsent = document.querySelector("[data-map-consent]");
const mapFrame = mapContainer?.querySelector("iframe[data-src]");

if (mapButton && mapConsent && mapFrame) {
  mapButton.addEventListener("click", () => {
    mapFrame.src = mapFrame.dataset.src;
    mapFrame.hidden = false;
    mapConsent.hidden = true;
    trackConversion("map_click", {
      link_location: "embedded_map",
      action: "load",
    });
  }, { once: true });
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
