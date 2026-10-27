// Page 0 – Welcome: auto carousel, swipe, pause/play, JA/EN toggle, GO! transition.
(function () {
  'use strict';

  const DELAY = 5000; // ms per photo

  const T = {
    ja: {
      t1: '3億年の大地を、', t2: '体験しよう。', bubble: '体験しましょう！',
      go: 'GO! 体験をはじめる', stop: '停止', play: '再生',
    },
    en: {
      t1: '300 million years', t2: 'under your feet.', bubble: "Let's explore!",
      go: 'GO! Start exploring', stop: 'Pause', play: 'Play',
    },
  };

  const ICON_PAUSE = '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>';
  const ICON_PLAY = '<path d="M7 4l13 8-13 8z"/>';

  const $ = (id) => document.getElementById(id);
  const stage = $('stage');
  const slides = Array.from(document.querySelectorAll('.slide'));
  const pauseTxt = $('pause-txt');
  const pauseIco = $('pause-ico');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let lang = 'ja';
  let idx = 0;
  let playing = !reduce; // reduced motion → start paused
  let timer = null;

  function show(i) {
    idx = (i + slides.length) % slides.length;
    slides.forEach((s, k) => {
      const on = k === idx;
      s.classList.toggle('is-on', on);
      s.setAttribute('aria-hidden', on ? 'false' : 'true');
      if (on) { // restart Ken Burns zoom
        const img = s.querySelector('img');
        img.loading = 'eager';
        img.style.animation = 'none';
        void img.offsetWidth;
        img.style.animation = '';
      }
    });
    slides[(idx + 1) % slides.length].querySelector('img').loading = 'eager'; // preload next
  }

  function restart() {
    clearInterval(timer);
    if (playing) timer = setInterval(() => show(idx + 1), DELAY);
  }

  function setPlaying(p) {
    playing = p;
    pauseTxt.textContent = p ? T[lang].stop : T[lang].play;
    pauseIco.innerHTML = p ? ICON_PAUSE : ICON_PLAY;
    restart();
  }

  function setLang(l) {
    lang = l;
    try { localStorage.setItem('lang', l); } catch (e) {} // shared with explore.html
    stage.setAttribute('lang', l);
    $('lang-ja').setAttribute('aria-pressed', String(l === 'ja'));
    $('lang-en').setAttribute('aria-pressed', String(l === 'en'));
    document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = T[l][el.dataset.t]; });
    $('go').setAttribute('aria-label', T[l].go);
    slides.forEach((s) => {
      const img = s.querySelector('img');
      if (!img.dataset.jaAlt) img.dataset.jaAlt = img.alt;
      img.alt = l === 'ja' ? img.dataset.jaAlt : img.dataset.enAlt;
    });
    setPlaying(playing);
  }

  // pause / play
  $('pause').addEventListener('click', () => setPlaying(!playing));

  // swipe
  let sx = null, sy = null;
  stage.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    sx = e.clientX; sy = e.clientY;
  });
  stage.addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    sx = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { show(idx + (dx < 0 ? 1 : -1)); restart(); }
  });

  // keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { show(idx + 1); restart(); }
    if (e.key === 'ArrowLeft') { show(idx - 1); restart(); }
  });

  // language
  $('lang-ja').addEventListener('click', () => setLang('ja'));
  $('lang-en').addEventListener('click', () => setLang('en'));

  // GO! → hills rise → Explore
  $('go').addEventListener('click', () => {
    stage.classList.add('is-leaving');
    clearInterval(timer);
    setTimeout(() => { location.href = 'explore.html'; }, reduce ? 0 : 600);
  });
  // back from Explore restores the page from bfcache with the hills still up
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) { stage.classList.remove('is-leaving'); restart(); }
  });

  show(0);
  // kiosk: the start screen is a new visitor → reset language and text size
  try { localStorage.removeItem('fs'); } catch (e) {}
  setLang('ja');
})();
