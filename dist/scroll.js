const menu = document.querySelector('#menu');
const scroller = document.querySelector('#link-window');
const indicator = document.querySelector('#scroll-date');
const entries = [...scroller.querySelectorAll('li')];
const titles = [...menu.querySelectorAll('li')];
const formatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
let hideTimer, navigating, topIndex = 0, rowStep = 16, residue = 0;
// Reserve the widest title (including its selected weight) across the whole archive.
// The date's right edge stays a fixed distance from that shared title column.
function alignDate() {
  if (!titles.length) return;
  const context = document.createElement('canvas').getContext('2d');
  const style = getComputedStyle(titles[0].querySelector('a'));
  context.font = `700 ${style.fontSize} ${style.fontFamily}`;
  const widest = Math.ceil(Math.max(...titles.map(entry => context.measureText(entry.textContent).width)));
  document.documentElement.style.setProperty('--title-width', `${Math.min(widest, Math.max(150, innerWidth - 180))}px`);
  indicator.style.setProperty('--date-top', `${scroller.getBoundingClientRect().top}px`);
  const positions = offsets();
  rowStep = positions[1] - positions[0] || 16;
}
alignDate();
document.fonts.ready.then(alignDate);
window.addEventListener('resize', () => { alignDate(); setRow(topIndex, false); });

// Every input advances an integer row; there are no in-between visual states.
function offsets() {
  const top = scroller.getBoundingClientRect().top;
  return entries.map(entry => entry.getBoundingClientRect().top - top + scroller.scrollTop);
}
function setRow(index, showDate = true) {
  if (!entries.length) return;
  const positions = offsets();
  const maximum = scroller.scrollHeight - scroller.clientHeight;
  const last = positions.findLastIndex(position => position <= maximum + 0.75);
  const next = Math.max(0, Math.min(index, last));
  const changed = next !== topIndex;
  topIndex = next;
  scroller.scrollTo({top: positions[next], behavior: 'instant'});
  scroller.style.setProperty('--fade-top', next > 0 ? 'var(--fade)' : '0px');
  scroller.style.setProperty('--fade-bottom', next < last ? 'var(--fade)' : '0px');
  indicator.firstElementChild.textContent = formatter.format(new Date(entries[next].dataset.date + 'T12:00:00Z'));
  if (showDate && changed) {
    indicator.classList.add('visible');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => indicator.classList.remove('visible'), 600);
  }
  try { sessionStorage.setItem('post-window', String(positions[next])); } catch {}
}
try {
  const saved = Number(sessionStorage.getItem('post-window')) || 0;
  const positions = offsets();
  topIndex = positions.reduce((best, position, index) => Math.abs(position - saved) < Math.abs(positions[best] - saved) ? index : best, 0);
} catch {}
function revealSelected() {
  const index = entries.findIndex(entry => entry.querySelector('[aria-current="page"]'));
  if (index < 0) return;
  const positions = offsets();
  if (index < topIndex) setRow(index, false);
  else if (positions[index] + entries[index].getBoundingClientRect().height > positions[topIndex] + scroller.clientHeight + 0.75) {
    const first = positions.findIndex(position => position >= positions[index] + entries[index].getBoundingClientRect().height - scroller.clientHeight - 0.75);
    setRow(first, false);
  }
}
setRow(topIndex, false);
revealSelected();
// Pointer travel maps one-to-one onto the list: each row height of movement steps exactly one row.
// Sub-row travel is banked rather than dropped, so slow and fast gestures cover the same distance.
function advance(distance) {
  residue += distance;
  const steps = Math.trunc(residue / rowStep);
  if (!steps) return;
  residue -= steps * rowStep;
  const target = topIndex + steps;
  setRow(target);
  if (topIndex !== target) residue = 0;
}
window.addEventListener('wheel', event => {
  if (event.ctrlKey || !event.deltaY || (document.body.classList.contains('article') && !menu.contains(event.target))) return;
  event.preventDefault();
  advance(event.deltaMode === 1 ? event.deltaY * rowStep : event.deltaMode === 2 ? event.deltaY * scroller.clientHeight : event.deltaY);
}, {passive:false});
scroller.addEventListener('keydown', event => {
  const steps = {ArrowDown:1, ArrowUp:-1, PageDown:15, PageUp:-15, ' ':event.shiftKey ? -15 : 15};
  if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault(); setRow(event.key === 'Home' ? 0 : entries.length - 1);
  } else if (event.key in steps) {
    event.preventDefault(); setRow(topIndex + steps[event.key]);
  }
});
let touchY;
scroller.addEventListener('touchstart', event => { touchY = event.touches[0].clientY; residue = 0; }, {passive:true});
scroller.addEventListener('touchmove', event => {
  if (event.touches.length !== 1 || touchY === undefined) return;
  event.preventDefault();
  advance(touchY - event.touches[0].clientY);
  touchY = event.touches[0].clientY;
}, {passive:false});
scroller.addEventListener('touchend', () => { touchY = undefined; });
// Keyboard tabbing can reveal an offscreen link; immediately align that view too.
scroller.addEventListener('focusin', event => {
  const index = entries.findIndex(entry => entry.contains(event.target));
  if (index < 0) return;
  if (index < topIndex) setRow(index);
  else if (index >= topIndex + 15) setRow(index - 14);
});
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
