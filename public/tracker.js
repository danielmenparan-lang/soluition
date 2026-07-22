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

  function getProductMeta() {
    var handle = null;
    var id = null;
    var title = null;
    var match = window.location.pathname.match(/\/products\/([^/?]+)/);
    if (match) handle = match[1];

    var productJson = document.querySelector(
      'script[type="application/json"][data-product-json]',
    );
    if (productJson && productJson.textContent) {
      try {
        var product = JSON.parse(productJson.textContent);
        if (product.id) id = String(product.id);
        if (product.title) title = product.title;
        if (product.handle) handle = product.handle;
      } catch (e) {}
    }

    if (!id && window.meta && window.meta.product && window.meta.product.id) {
      id = String(window.meta.product.id);
    }

    if (!title) {
      title =
        document.querySelector("h1")?.textContent ||
        document.querySelector("[data-product-title]")?.textContent ||
        undefined;
    }

    return { handle: handle || undefined, id: id || undefined, title: title || undefined };
  }

  var pageEnterTime = Date.now();

  function sendPayload(payload) {
    var body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        endpoint,
        new Blob([body], { type: "application/json" }),
      );
      return;
    }

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
      keepalive: true,
    }).catch(function () {});
  }

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

    sendPayload(payload);
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
    track("page_view");
    trackProductIfNeeded();
  };

  function trackProductIfNeeded() {
    if (window.location.pathname.indexOf("/products/") === -1) return;
    var meta = getProductMeta();
    track("product_view", {
      productId: meta.id || meta.handle,
      productHandle: meta.handle,
      productTitle: meta.title,
    });
  }

  trackProductIfNeeded();

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
      var meta = getProductMeta();
      track("add_to_cart", {
        productId: meta.id || meta.handle,
        productHandle: meta.handle,
        productTitle: meta.title,
      });
    }
    return origFetch.apply(window, arguments);
  };

  // Checkout start — cart page + checkout buttons
  if (
    window.location.pathname.indexOf("/checkout") > -1 ||
    window.location.pathname.indexOf("/cart") > -1
  ) {
    track("checkout_start");
  }

  document.addEventListener("click", function (e) {
    var target = e.target;
    if (!target) return;

    var checkoutTarget = target.closest(
      '[name="checkout"], a[href*="/checkout"], button[type="submit"][name="checkout"]',
    );
    if (checkoutTarget) {
      track("checkout_start");
    }

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

  // Search
  var searchForm = document.querySelector('form[action="/search"]');
  if (searchForm) {
    searchForm.addEventListener("submit", function () {
      var input = searchForm.querySelector('input[name="q"]');
      if (input && input.value) {
        track("search", { searchQuery: input.value });
      }
    });
  }

  // Shopify purchase (thank you page — legacy checkout)
  if (window.Shopify && window.Shopify.checkout) {
    track("purchase", {
      orderValue: window.Shopify.checkout.total_price / 100,
    });
  }

  // Expose for manual tracking
  window.MarketingSolution = { track: track };
})();
