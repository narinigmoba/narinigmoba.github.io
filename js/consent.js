/*
 * Google Consent Mode v2 banner for Narinig Mo Ba?
 */
(function () {
  'use strict';

  var KEY = 'nmb_consent';
  var VERSION = 'v1';

  function readChoice() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!raw || raw.version !== VERSION) return null;
      return raw.accepted ? 'accepted' : 'declined';
    } catch (_) { return null; }
  }

  function apply(accepted) {
    if (typeof window.gtag !== 'function') return;
    var s = accepted ? 'granted' : 'denied';
    window.gtag('consent', 'update', {
      'ad_storage': s,
      'ad_user_data': s,
      'ad_personalization': s,
      'analytics_storage': s
    });
  }

  function save(accepted) {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        accepted: !!accepted, version: VERSION, ts: Date.now()
      }));
    } catch (_) { }
    apply(accepted);
  }

  function injectStyle() {
    var css =
      '#consent-bar{position:fixed;left:0;right:0;bottom:0;z-index:100;' +
        'background:rgba(18,12,16,0.98);border-top:1px solid rgba(230,57,70,0.5);' +
        'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);' +
        'font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;' +
        'color:#f7f2ea;box-shadow:0 -8px 30px rgba(0,0,0,0.6)}' +
      '.consent-inner{max-width:960px;margin:0 auto;padding:14px 16px;' +
        'display:flex;flex-wrap:wrap;align-items:center;gap:12px}' +
      '.consent-text{margin:0;flex:1 1 320px;font-size:14px;line-height:1.5;' +
        'color:rgba(247,242,234,0.85)}' +
      '.consent-text a{color:#ff4d5a;text-decoration:underline}' +
      '.consent-actions{display:flex;gap:8px;flex-shrink:0}' +
      '.consent-actions button{font:inherit;font-weight:700;font-size:14px;' +
        'padding:8px 18px;border-radius:9999px;cursor:pointer;' +
        'border:1px solid rgba(255,255,255,0.15)}' +
      '.consent-actions [data-consent="accept"]{background:#e63946;color:#ffffff;border-color:#e63946}' +
      '.consent-actions [data-consent="decline"]{background:rgba(255,255,255,0.06);color:#f7f2ea}' +
      '@media(max-width:520px){.consent-inner{flex-direction:column;align-items:stretch}' +
        '.consent-actions{justify-content:stretch}.consent-actions button{flex:1}}';
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function render() {
    injectStyle();
    var bar = document.createElement('div');
    bar.id = 'consent-bar';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Cookie consent');
    bar.innerHTML =
      '<div class="consent-inner">' +
        '<p class="consent-text">' +
          'We use cookies to analyze traffic and provide essential functionality while you explore Narinig Mo Ba? ' +
          '<a href="/privacy">Learn more</a>' +
        '</p>' +
        '<div class="consent-actions">' +
          '<button type="button" data-consent="accept">Accept</button>' +
          '<button type="button" data-consent="decline">Decline</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(bar);

    bar.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-consent]') : null;
      if (!t) return;
      save(t.getAttribute('data-consent') === 'accept');
      bar.remove();
    });
  }

  var existing = readChoice();
  if (existing) {
    apply(existing === 'accepted');
  } else {
    render();
  }
})();
