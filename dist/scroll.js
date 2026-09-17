const indicator = document.querySelector('#scroll-date');
const entries = [...document.querySelectorAll('#menu li[data-date]')];
const formatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
let hideTimer, frame, previousDate;
let previousY = window.scrollY;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function update() {
  frame = null;
  const currentY = window.scrollY;
  if (currentY === previousY || !entries.length) return;
  const direction = currentY > previousY ? 1 : -1;
  previousY = currentY;
  const active = entries.find(entry => entry.getBoundingClientRect().bottom > 40) || entries.at(-1);
  const date = active.dataset.date;
  if (date !== previousDate) {
    indicator.firstElementChild.textContent = formatter.format(new Date(date + 'T12:00:00Z'));
    if (previousDate && !reducedMotion.matches) {
      indicator.firstElementChild.getAnimations().forEach(animation => animation.cancel());
      indicator.firstElementChild.animate([{ opacity: 0, transform: `translateY(${direction * 7}px)` }, { opacity: 1, transform: 'translateY(0)' }], { duration: 180, easing: 'ease-out' });
    }
    previousDate = date;
  }
  indicator.classList.add('visible');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => indicator.classList.remove('visible'), 600);
}
window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
window.addEventListener('pagehide', () => { clearTimeout(hideTimer); indicator.classList.remove('visible'); });
