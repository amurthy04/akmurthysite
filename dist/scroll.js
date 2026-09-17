const menu = document.querySelector('#menu');
const scroller = document.querySelector('#link-window');
const indicator = document.querySelector('#scroll-date');
const entries = [...scroller.querySelectorAll('li')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const formatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
let hideTimer, frame, previousDate, navigating, settleTimer, touching = false;
function updateEdges() {
  scroller.style.setProperty('--fade-top', scroller.scrollTop > 1 ? '12px' : '0px');
  scroller.style.setProperty('--fade-bottom', scroller.scrollTop < scroller.scrollHeight - scroller.clientHeight - 1 ? '12px' : '0px');
}
// Let native momentum finish before gently aligning the window to a whole row.
function scheduleSettle() {
  clearTimeout(settleTimer);
  settleTimer = setTimeout(() => {
    if (touching) return;
    const top = scroller.getBoundingClientRect().top;
    const offsets = entries.map(entry => entry.getBoundingClientRect().top - top + scroller.scrollTop);
    const target = offsets.reduce((nearest, offset) => Math.abs(offset - scroller.scrollTop) < Math.abs(nearest - scroller.scrollTop) ? offset : nearest, 0);
    const bounded = Math.min(target, scroller.scrollHeight - scroller.clientHeight);
    if (Math.abs(bounded - scroller.scrollTop) > 0.75) scroller.scrollTo({top: bounded, behavior: reducedMotion.matches ? 'instant' : 'smooth'});
  }, 180);
}
// Preserve the window on reload and make deep-linked posts visible without flashing a date.
try { scroller.scrollTop = Number(sessionStorage.getItem('post-window')) || 0; } catch {}
function revealSelected() {
  const selected = scroller.querySelector('[aria-current="page"]');
  if (!selected) return;
  const box = selected.getBoundingClientRect(), viewport = scroller.getBoundingClientRect();
  if (box.top < viewport.top) scroller.scrollTop += box.top - viewport.top;
  else if (box.bottom > viewport.bottom) scroller.scrollTop += box.bottom - viewport.bottom;
}
revealSelected();
updateEdges();
let previousY = scroller.scrollTop;
function update() {
  frame = null;
  const y = scroller.scrollTop;
  if (y === previousY) return;
  const direction = y > previousY ? 1 : -1;
  previousY = y;
  updateEdges();
  scheduleSettle();
  const top = scroller.getBoundingClientRect().top;
  const active = entries.find(entry => entry.getBoundingClientRect().bottom > top + 1) || entries.at(-1);
  const date = formatter.format(new Date(active.dataset.date + 'T12:00:00Z'));
  if (date !== previousDate) {
    indicator.firstElementChild.textContent = date;
    if (previousDate && !reducedMotion.matches) {
      indicator.firstElementChild.getAnimations().forEach(animation => animation.cancel());
      indicator.firstElementChild.animate([{opacity:0, transform:`translateY(${direction * 6}px)`},{opacity:1, transform:'translateY(0)'}], {duration:180, easing:'ease-out'});
    }
    previousDate = date;
  }
  indicator.classList.add('visible');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => indicator.classList.remove('visible'), 600);
  try { sessionStorage.setItem('post-window', String(y)); } catch {}
}
scroller.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(update); }, {passive:true});
scroller.addEventListener('touchstart', () => { touching = true; clearTimeout(settleTimer); }, {passive:true});
scroller.addEventListener('touchend', () => { touching = false; scheduleSettle(); }, {passive:true});
scroller.addEventListener('touchcancel', () => { touching = false; scheduleSettle(); }, {passive:true});
scroller.addEventListener('wheel', scheduleSettle, {passive:true});
// On the empty homepage, scrolling anywhere moves the small link window.
window.addEventListener('wheel', event => {
  if (document.body.classList.contains('article') || menu.contains(event.target) || event.ctrlKey || !event.deltaY) return;
  event.preventDefault();
  const amount = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scroller.clientHeight : 1);
  scroller.scrollBy({top:amount, behavior:'instant'});
}, {passive:false});
async function navigate(url, push) {
  navigating?.abort();
  const controller = new AbortController();
  navigating = controller;
  try {
    const response = await fetch(url, {signal:controller.signal});
    if (!response.ok) throw new Error('Navigation failed');
    const page = new DOMParser().parseFromString(await response.text(), 'text/html');
    const content = page.querySelector('#content');
    if (!content) throw new Error('Missing post');
    document.querySelector('#content').replaceWith(content);
    document.title = page.title;
    document.body.className = page.body.className;
    if (push) history.pushState(null, '', url);
    menu.querySelectorAll('a').forEach(link => {
      if (link.pathname === location.pathname && link.closest('li')) link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    });
    revealSelected();
    window.scrollTo(0,0);
    indicator.classList.remove('visible');
  } catch (error) { if (error.name !== 'AbortError') location.assign(url); }
}
menu.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate(link.href, true);
});
window.addEventListener('popstate', () => navigate(location.href, false));
