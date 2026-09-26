/**
 * Community Comments system for Narinig Mo Ba?
 */
(function () {
  'use strict';

  const LOCAL_COMMENTS_KEY = 'nmb_user_comments';
  const LIKED_COMMENTS_KEY = 'nmb_liked_comments';

  const AVATAR_COLORS = [
    'bg-red-500/20 text-red-400',
    'bg-amber-500/20 text-amber-300',
    'bg-purple-500/20 text-purple-300',
    'bg-emerald-500/20 text-emerald-300',
    'bg-cyan-500/20 text-cyan-300',
    'bg-rose-500/20 text-rose-300',
  ];

  function avatarColorFor(name) {
    let h = 0;
    const s = String(name || '?');
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
  }

  function initials(name) {
    const s = String(name || '?').trim();
    if (!s) return '?';
    return s.replace(/^@/, '').charAt(0).toUpperCase();
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  function formatDate(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return `${MONTHS_EN[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  }

  function getLocalComments() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_COMMENTS_KEY) || '[]');
    } catch (_) { return []; }
  }

  function saveLocalComments(comments) {
    try {
      localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(comments));
    } catch (_) { }
  }

  function getLikedComments() {
    try {
      return JSON.parse(localStorage.getItem(LIKED_COMMENTS_KEY) || '{}');
    } catch (_) { return {}; }
  }

  function saveLikedComments(likes) {
    try {
      localStorage.setItem(LIKED_COMMENTS_KEY, JSON.stringify(likes));
    } catch (_) { }
  }

  function createCommentCard(c, isLiked) {
    const card = document.createElement('div');
    card.className = 'rounded-2xl p-5 bg-white/5 border border-white/10 transition hover:border-white/20';
    card.dataset.id = c.id;

    const name = escapeHtml(c.name || 'Anonymous');
    const colorClass = avatarColorFor(c.name);
    const init = escapeHtml(initials(c.name));
    const dateStr = escapeHtml(formatDate(c.timestamp));
    const text = escapeHtml(c.comment);
    const likes = Number(c.likes) || 0;

    card.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-display font-bold ${colorClass}">${init}</div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-semibold text-cream truncate">${name}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-red-500/15 text-red-400">player</span>
          </div>
          <span class="text-xs text-mute">${dateStr}</span>
        </div>
      </div>
      <p class="mt-3 text-cream/85 text-sm leading-relaxed whitespace-pre-wrap">${text}</p>
      <div class="mt-3 flex items-center justify-between">
        <button type="button" class="like-btn inline-flex items-center gap-1.5 text-xs text-mute hover:text-red-400 transition" aria-label="Like comment">
          <span class="like-icon">${isLiked ? '♥' : '♡'}</span>
          <span class="like-count">${likes}</span>
        </button>
      </div>
    `;

    const likeBtn = card.querySelector('.like-btn');
    likeBtn.addEventListener('click', () => {
      handleLike(c.id, card, likeBtn);
    });

    return card;
  }

  function handleLike(id, card, btn) {
    const liked = getLikedComments();
    const countEl = btn.querySelector('.like-count');
    const iconEl = btn.querySelector('.like-icon');
    let currentCount = parseInt(countEl.textContent, 10) || 0;

    if (liked[id]) {
      delete liked[id];
      currentCount = Math.max(0, currentCount - 1);
      iconEl.textContent = '♡';
      btn.classList.remove('text-red-400');
    } else {
      liked[id] = true;
      currentCount += 1;
      iconEl.textContent = '♥';
      btn.classList.add('text-red-400');
    }

    countEl.textContent = currentCount;
    saveLikedComments(liked);
  }

  function init() {
    const wall = document.getElementById('comment-wall');
    const form = document.getElementById('comment-form');
    if (!wall) return;

    const baseComments = window.NMB_COMMENTS || [];
    const localComments = getLocalComments();
    const allComments = [...localComments, ...baseComments];
    const likedMap = getLikedComments();

    // Clear placeholder/baked if present in dynamic JS mode to avoid duplicate
    wall.innerHTML = '';

    allComments.forEach(c => {
      wall.appendChild(createCommentCard(c, !!likedMap[c.id]));
    });

    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyGp43jMVqCGkeC_M76USR3TJqJ_IxHV8o5c-4eciUtlTi1AuFnSbraCbNiMSUHyXmGFQ/exec';

    // Silently fetch fresh approved comments from Google Sheets
    async function syncRemoteComments() {
      try {
        const res = await fetch(APPS_SCRIPT_URL + '?domain=narinigmoba.github.io');
        const data = await res.json();
        if (data && data.ok && Array.isArray(data.comments)) {
          const existingIds = new Set(allComments.map(c => c.id));
          const fresh = data.comments.filter(c => !existingIds.has(c.id));
          fresh.forEach(c => {
            allComments.push(c);
            existingIds.add(c.id);
            wall.appendChild(createCommentCard(c, !!likedMap[c.id]));
          });
        }
      } catch (_) {
        // Fallback silently if offline or blocked
      }
    }
    syncRemoteComments();

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = form.querySelector('[name="name"]');
        const commentInput = form.querySelector('[name="comment"]');
        const submitBtn = form.querySelector('button[type="submit"]');

        const name = (nameInput.value || '').trim() || 'Night Visitor';
        const text = (commentInput.value || '').trim();

        if (!text) return;

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Posting...';
        }

        const newComment = {
          id: 'user_' + Date.now(),
          name: name,
          comment: text,
          likes: 1,
          timestamp: new Date().toISOString()
        };

        const currentLocal = getLocalComments();
        currentLocal.unshift(newComment);
        saveLocalComments(currentLocal);

        const card = createCommentCard(newComment, false);
        wall.insertBefore(card, wall.firstChild);

        // Async sync to Google Sheets (silent background)
        fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            type: 'comment',
            name: name,
            comment: text,
            domain: 'narinigmoba.github.io'
          })
        }).finally(() => {
          commentInput.value = '';
          if (submitBtn) {
            submitBtn.textContent = 'Posted! ✓';
            setTimeout(() => {
              submitBtn.textContent = 'Post Comment';
              submitBtn.disabled = false;
            }, 1800);
          }
        });
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
