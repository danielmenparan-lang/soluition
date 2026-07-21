/**
 * Marketing Solution — Storefront Tracking Script
 * Tracks visitors, sessions, page views, and e-commerce events.
 */
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) return;

  var trackingId = script.getAttribute("data-tracking-id");
  var endpoint =
    script.getAttribute("data-endpoint") ||
    script.src.replace("/tracker.js", "/api/track");

  if (!trackingId) {
    console.warn("[Marketing Solution] Missing data-tracking-id");
    return;
  }

  var VISITOR_KEY = "ms_visitor_id";
  var SESSION_KEY = "ms_session_id";
  var SESSION_START_KEY = "ms_session_start";
  var SESSION_TIMEOUT = 30 * 60 * 1000;

  function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function getVisitorId() {
    var id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = uuid();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  }

  function getSessionId() {
    var sessionId = sessionStorage.getItem(SESSION_KEY);
    var sessionStart = parseInt(sessionStorage.getItem(SESSION_START_KEY) || "0", 10);
    var now = Date.now();

    if (!sessionId || now - sessionStart > SESSION_TIMEOUT) {
      sessionId = uuid();
      sessionStorage.setItem(SESSION_KEY, sessionId);
      sessionStorage.setItem(SESSION_START_KEY, String(now));
    }
    return sessionId;
  }

  function getUtmParams() {
    var params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get("utm_source") || undefined,
      utmMedium: params.get("utm_medium") || undefined,
      utmCampaign: params.get("utm_campaign") || undefined,
      utmTerm: params.get("utm_term") || undefined,
      utmContent: params.get("utm_content") || undefined,
    };
  }

  function getDeviceType() {
    var ua = navigator.userAgent;
    if (/tablet|ipad/i.test(ua)) return "tablet";
    if (/mobile|iphone|android/i.test(ua)) return "mobile";
    return "desktop";
  }

  function getBrowser() {
    var ua = navigator.userAgent;
    if (ua.indexOf("Chrome") > -1) return "Chrome";
    if (ua.indexOf("Safari") > -1) return "Safari";
    if (ua.indexOf("Firefox") > -1) return "Firefox";
    if (ua.indexOf("Edge") > -1) return "Edge";
    return "Other";
  }

  var pageEnterTime = Date.now();
  var lastUrl = window.location.href;

  function track(eventType, extra) {
    var utm = getUtmParams();
    var payload = Object.assign(
      {
        trackingId: trackingId,
        visitorId: getVisitorId(),
        sessionId: getSessionId(),
        eventType: eventType,
        url: window.location.href,
        pageTitle: document.title,
        referrer: document.referrer || undefined,
        deviceType: getDeviceType(),
        browser: getBrowser(),
        os: navigator.platform,
      },
      utm,
      extra || {},
    );

    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, JSON.stringify(payload));
    } else {
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(function () {});
    }
  }

  // Session start
  track("session_start");

  // Page view
  track("page_view");

  // Page exit / time on page
  function trackPageExit() {
    var timeOnPage = Math.round((Date.now() - pageEnterTime) / 1000);
    track("session_end", { timeOnPage: timeOnPage });
  }

  window.addEventListener("beforeunload", trackPageExit);

  // SPA navigation detection
  var origPushState = history.pushState;
  history.pushState = function () {
    trackPageExit();
    origPushState.apply(history, arguments);
    pageEnterTime = Date.now();
    lastUrl = window.location.href;
    track("page_view");
  };

  // Product page detection (Shopify)
  if (window.location.pathname.indexOf("/products/") > -1) {
    var productMatch = window.location.pathname.match(/\/products\/([^/?]+)/);
    var productTitle =
      document.querySelector("h1")?.textContent ||
      document.querySelector("[data-product-title]")?.textContent;
    track("product_view", {
      productId: productMatch ? productMatch[1] : undefined,
      productTitle: productTitle || undefined,
    });
  }

  // Collection page
  if (window.location.pathname.indexOf("/collections/") > -1) {
    var collMatch = window.location.pathname.match(/\/collections\/([^/?]+)/);
    track("collection_view", {
      collectionId: collMatch ? collMatch[1] : undefined,
    });
  }

  // Add to cart (Shopify AJAX)
  var origFetch = window.fetch;
  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : input.url;
    if (url && url.indexOf("/cart/add") > -1) {
      track("add_to_cart", {
        productId: window.location.pathname.match(/\/products\/([^/?]+)/)?.[1],
      });
    }
    return origFetch.apply(window, arguments);
  };

  // Checkout start
  if (
    window.location.pathname.indexOf("/checkout") > -1 ||
    window.location.pathname.indexOf("/cart") > -1
  ) {
    track("checkout_start");
  }

  // Search
  var searchForm = document.querySelector('form[action="/search"]');
  if (searchForm) {
    searchForm.addEventListener("submit", function (e) {
      var input = searchForm.querySelector('input[name="q"]');
      if (input && input.value) {
        track("search", { searchQuery: input.value });
      }
    });
  }

  // Button clicks (CTA tracking)
  document.addEventListener("click", function (e) {
    var target = e.target;
    if (!target) return;
    var btn =
      target.closest("button") ||
      target.closest("a.btn") ||
      target.closest("[data-track-click]");
    if (btn) {
      track("button_click", {
        buttonLabel: btn.textContent?.trim().slice(0, 100) || undefined,
      });
    }
  });

  // Shopify purchase (thank you page)
  if (window.Shopify && window.Shopify.checkout) {
    track("purchase", {
      orderValue: window.Shopify.checkout.total_price / 100,
    });
  }

  // Expose for manual tracking
  window.MarketingSolution = { track: track };
})();
