import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const posts = JSON.parse(readFileSync(new URL('./posts.json', import.meta.url))).sort((a,b) => b.date.localeCompare(a.date));
const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const icon = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="white"/><text x="16" y="25" text-anchor="middle" font-family="Helvetica,Arial" font-size="28" fill="#0864c7">A</text></svg>');
const shell = (title, body, extra = '') => `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)} · Akshay Murthy</title><meta name="description" content="Notes and essays by Akshay Murthy."><link rel="icon" type="image/svg+xml" href="${icon}"><link rel="stylesheet" href="/style.css"></head><body${extra}>${body}</body></html>\n`;
const navigation = selected => `<nav id="menu" aria-label="Posts"><a class="name" href="/">Akshay Murthy</a><div id="link-window" tabindex="0" aria-label="Scroll through posts"><ul>${posts.map(post => `<li data-date="${escape(post.date)}"><a href="/posts/${escape(post.slug)}/"${post.slug === selected ? ' aria-current="page"' : ''}>${escape(post.title)}</a></li>`).join('\n')}</ul></div></nav><p id="scroll-date" aria-hidden="true"><span></span></p>`;
const script = '<script src="/scroll.js" defer></script>';
mkdirSync('dist', { recursive: true });
writeFileSync('dist/index.html', shell('Home', `${navigation()}<main id="content"></main>${script}`));
for (const post of posts) {
  if (!/^[a-z0-9-]+$/.test(post.slug)) throw new Error('Invalid post slug');
  mkdirSync(`dist/posts/${post.slug}`, { recursive: true });
  writeFileSync(`dist/posts/${post.slug}/index.html`, shell(post.title, `${navigation(post.slug)}<main id="content" aria-label="${escape(post.title)}">${post.paragraphs.map(paragraph => `<p>${escape(paragraph)}</p>`).join('')}</main>${script}`, ' class="article"'));
}
