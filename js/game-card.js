/**
 * Game card interactive toolbar for Narinig Mo Ba?
 * Handles Like, Share, and Fullscreen toggling.
 */
(function () {
  'use strict';

  const LIKE_STORAGE_KEY = 'nmb_game_liked';
  const LIKE_COUNT_STORAGE_KEY = 'nmb_game_like_count';

  function trackEvent(name, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params || {});
    }
  }

  /* ---------- Like Functionality ---------- */
  function initLike() {
    const btn = document.querySelector('[data-action="like"]');
    if (!btn) return;

    const countEl = btn.querySelector('[data-role="like-count"]');
    const iconEl = btn.querySelector('[data-role="like-icon"]');
    const seed = parseInt(btn.getAttribute('data-like-seed') || '642', 10);

    let savedCount = parseInt(localStorage.getItem(LIKE_COUNT_STORAGE_KEY) || '', 10);
    if (isNaN(savedCount) || savedCount < seed) {
      savedCount = seed;
    }

    let isLiked = localStorage.getItem(LIKE_STORAGE_KEY) === 'true';

    function updateUI() {
      if (countEl) countEl.textContent = savedCount;
      if (iconEl) {
        iconEl.textContent = isLiked ? '♥' : '♡';
        iconEl.style.color = isLiked ? '#ff4d5a' : '';
      }
      btn.classList.toggle('text-red-400', isLiked);
    }

    updateUI();

    btn.addEventListener('click', () => {
      isLiked = !isLiked;
      savedCount += isLiked ? 1 : -1;
      localStorage.setItem(LIKE_STORAGE_KEY, String(isLiked));
      localStorage.setItem(LIKE_COUNT_STORAGE_KEY, String(savedCount));
      updateUI();
      trackEvent('like_game', { liked: isLiked, count: savedCount });
    });
  }

  /* ---------- Share Functionality ---------- */
  function initShare() {
    const btn = document.querySelector('[data-action="share"]');
    if (!btn) return;

    const labelEl = btn.querySelector('[data-role="share-label"]');
    const defaultLabel = labelEl ? labelEl.textContent : 'Share';

    btn.addEventListener('click', async () => {
      const shareData = {
        title: 'Narinig Mo Ba? — Play Free Online Psychological Horror Game',
        text: 'Did you hear that? Step into a Philippine sari-sari store and uncover neighborhood secrets...',
        url: window.location.href,
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
          trackEvent('share_game', { method: 'web_share' });
          return;
        } catch (e) {
          if (e.name === 'AbortError') return;
        }
      }

      // Fallback: clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        if (labelEl) {
          labelEl.textContent = 'Copied! ✓';
          setTimeout(() => { labelEl.textContent = defaultLabel; }, 2000);
        }
        trackEvent('share_game', { method: 'clipboard' });
      } catch (_) {
        alert('Share URL: ' + window.location.href);
      }
    });
  }

  /* ---------- Dynamic Game Loader ---------- */
  let gameLoaded = false;

  function loadGame(onReady) {
    if (gameLoaded) {
      if (typeof onReady === 'function') onReady();
      return;
    }

    const cover = document.getElementById('game-cover');
    const loader = document.getElementById('game-loader');
    const wrapper = document.getElementById('game-iframe-wrapper');

    if (!wrapper) return;

    gameLoaded = true;
    trackEvent('start_game', { source: 'play_button' });

    // Show loading state
    if (loader) {
      loader.classList.remove('hidden');
      loader.classList.add('flex');
    }

    // Dynamically instantiate and mount iframe
    const iframe = document.createElement('iframe');
    iframe.src = '/game/narinig-mo-ba/';
    iframe.title = 'Narinig Mo Ba? — Play Game';
    iframe.className = 'block w-full h-full border-0';
    iframe.setAttribute('allow', 'autoplay; fullscreen; gamepad');

    let loadedHandled = false;
    function handleIframeReady() {
      if (loadedHandled) return;
      loadedHandled = true;

      // Smooth fadeout cover and loader
      if (cover) {
        cover.style.opacity = '0';
        setTimeout(() => { cover.classList.add('hidden'); }, 500);
      }
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
          loader.classList.remove('flex');
          loader.classList.add('hidden');
        }, 300);
      }
      wrapper.classList.remove('hidden');

      if (typeof onReady === 'function') onReady();
    }

    iframe.addEventListener('load', handleIframeReady);
    // Fallback: in case load event fires early or late
    setTimeout(handleIframeReady, 4000);

    wrapper.appendChild(iframe);
  }

  function initGameLoader() {
    const startBtn = document.getElementById('start-game-btn');
    if (!startBtn) return;

    startBtn.addEventListener('click', () => {
      loadGame();
    });
  }

  /* ---------- Fullscreen Functionality ---------- */
  function initFullscreen() {
    const btn = document.querySelector('[data-action="fullscreen"]');
    const stage = document.getElementById('game-stage');
    if (!btn || !stage) return;

    const iconEl = btn.querySelector('[data-role="fs-icon"]');

    function isFs() {
      return !!(document.fullscreenElement || document.webkitFullscreenElement);
    }

    function updateFsIcon() {
      if (iconEl) {
        iconEl.textContent = isFs() ? '✕' : '⛶';
      }
    }

    btn.addEventListener('click', () => {
      if (!gameLoaded) {
        loadGame(() => {
          triggerFullscreen();
        });
      } else {
        triggerFullscreen();
      }
    });

    function triggerFullscreen() {
      if (!isFs()) {
        const req = stage.requestFullscreen || stage.webkitRequestFullscreen;
        if (req) {
          req.call(stage).catch(err => console.warn('Fullscreen denied:', err));
          trackEvent('fullscreen_toggle', { action: 'enter' });
        }
      } else {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) {
          exit.call(document);
          trackEvent('fullscreen_toggle', { action: 'exit' });
        }
      }
    }

    document.addEventListener('fullscreenchange', updateFsIcon);
    document.addEventListener('webkitfullscreenchange', updateFsIcon);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initGameLoader();
    initLike();
    initShare();
    initFullscreen();
  });
})();
