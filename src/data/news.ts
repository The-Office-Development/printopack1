// News posts, sourced from the content store (db/seed.json baseline, or the live published
// snapshot on a Cloudflare build). The page shape is preserved so news.astro needs no change.
import { collection, displayDate } from '../lib/content';

export type Bi = { en: string; ar: string };
export type Post = { date: string; img: string; fit?: string; focus?: string; cat: Bi; title: Bi; link?: string };

export const category: Bi = { en: "General Information", ar: "معلومات عامة" };

// Draft posts stay off the public site. The admin offers a Draft/Published switch on every
// post and it has to mean something: careers already filtered on the same field, news did not,
// so a half-written post went live at the next publish.
export const posts: Post[] = collection('news')
  .filter((r) => (r.status || 'published') === 'published')
  .map((r) => ({
  date: displayDate(r.date),
  img: r.image,
  fit: r.imageFit,
  focus: r.imageFocus,
  cat: { en: r.category || category.en, ar: r.categoryAr || category.ar },
  title: { en: r.title, ar: r.titleAr },
  link: r.link || undefined,
}));
