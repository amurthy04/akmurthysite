import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const posts = JSON.parse(readFileSync(new URL('./posts.json', import.meta.url))).sort((a,b) => b.date.localeCompare(a.date));
const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const icon = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="white"/><text x="16" y="25" text-anchor="middle" font-family="Helvetica,Arial" font-size="28" fill="#0864c7">A</text></svg>');
const shell = (title, body, extra = '') => `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)} · Akshay Murthy</title><meta name="description" content="Notes and essays by Akshay Murthy."><link rel="icon" type="image/svg+xml" href="${icon}"><link rel="stylesheet" href="/style.css"></head><body${extra}>${body}</body></html>\n`;
mkdirSync('dist', { recursive: true });
writeFileSync('dist/index.html', shell('Home', `<main id="menu"><h1>Akshay Murthy</h1><ul>${posts.map(post => `<li data-date="${escape(post.date)}"><a href="/posts/${escape(post.slug)}/">${escape(post.title)}</a></li>`).join('\n')}</ul></main><p id="scroll-date" aria-hidden="true"><span></span></p><script src="/scroll.js" defer></script>`));
for (const post of posts) {
  if (!/^[a-z0-9-]+$/.test(post.slug)) throw new Error('Invalid post slug');
  mkdirSync(`dist/posts/${post.slug}`, { recursive: true });
  const date = new Intl.DateTimeFormat('en-US', {month:'long', day:'numeric', year:'numeric', timeZone:'UTC'}).format(new Date(post.date+'T12:00:00Z'));
  writeFileSync(`dist/posts/${post.slug}/index.html`, shell(post.title, `<nav id="menu" aria-label="Home"><a href="/">Akshay Murthy</a></nav><main id="content"><h1>${escape(post.title)}</h1><time datetime="${escape(post.date)}">${date}</time>${post.sample ? '<p class="note">Sample post</p>' : ''}${post.paragraphs.map(paragraph => `<p>${escape(paragraph)}</p>`).join('')}</main>`, ' class="article"'));
}
