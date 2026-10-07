import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
const posts = JSON.parse(readFileSync(new URL('./posts.json', import.meta.url))).filter(post => !post.draft).sort((a,b) => b.date.localeCompare(a.date));
const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const icon = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="white"/><text x="16" y="25" text-anchor="middle" font-family="Helvetica,Arial" font-size="28" fill="#0864c7">A</text></svg>');
const prose = text => escape(text).replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
const shell = (title, body, extra = '') => `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)} · Akshay Murthy</title><meta name="description" content="Notes and essays by Akshay Murthy."><link rel="icon" type="image/svg+xml" href="${icon}"><link rel="stylesheet" href="/style.css"></head><body${extra}>${body}</body></html>\n`;
// Entries marked `fixed` sit above the window and never scroll; everything else scrolls.
const item = (post, selected) => `<li data-date="${escape(post.date)}"><a href="/posts/${escape(post.slug)}/"${post.slug === selected ? ' aria-current="page"' : ''}>${escape(post.title)}</a></li>`;
const pinned = posts.filter(post => post.fixed);
const scrolling = posts.filter(post => !post.fixed);
const navigation = selected => `<nav id="menu" aria-label="Posts"><a class="name" href="/">Akshay Murthy</a>${pinned.length ? `<ul id="pinned">${pinned.map(post => item(post, selected)).join('\n')}</ul>` : ''}<div id="link-window" tabindex="0" aria-label="Scroll through posts"><ul>${scrolling.map(post => item(post, selected)).join('\n')}</ul></div></nav><p id="scroll-date" aria-hidden="true"><span></span></p>`;
const figure = post => post.image ? `<img class="portrait" src="${escape(post.image.src)}" alt="${escape(post.image.alt || post.title)}" width="${escape(post.image.width)}" height="${escape(post.image.height)}">` : '';
const script = '<script src="/scroll.js" defer></script>';
mkdirSync('dist', { recursive: true });
// Rebuild post pages from scratch so drafts and removed posts leave nothing behind.
rmSync('dist/posts', { recursive: true, force: true });
writeFileSync('dist/index.html', shell('Home', `${navigation()}<main id="content"></main>${script}`));
for (const post of posts) {
  if (!/^[a-z0-9-]+$/.test(post.slug)) throw new Error('Invalid post slug');
  mkdirSync(`dist/posts/${post.slug}`, { recursive: true });
  writeFileSync(`dist/posts/${post.slug}/index.html`, shell(post.title, `${navigation(post.slug)}<main id="content" aria-label="${escape(post.title)}">${figure(post)}${post.paragraphs.map(paragraph => `<p>${prose(paragraph)}</p>`).join('')}</main>${script}`, ' class="article"'));
}
