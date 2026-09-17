# Akshay Murthy

A deliberately minimal static blog. The homepage mirrors the reference website's Helvetica typography, right-aligned 150px column, blue links, and 30px/20px menu margins.

Sample posts are in `posts.json`. Replace their titles, ISO dates, and paragraph arrays, then run `node generate.mjs` to regenerate the static pages in `dist`. Posts are sorted newest first. Each post has its own shareable URL. Dates appear only during homepage scrolling and fade after 600ms of inactivity. Reduced-motion preferences disable movement.

Serve `dist` with any static HTTP server. No packages are required.
