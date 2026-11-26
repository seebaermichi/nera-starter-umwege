# @nera-static/starter-umwege

[![Test](https://github.com/seebaermichi/nera-starter-umwege/actions/workflows/test.yml/badge.svg)](https://github.com/seebaermichi/nera-starter-umwege/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/@nera-static/starter-umwege)](https://www.npmjs.com/package/@nera-static/starter-umwege)

📖 **Documentation:** [nera.js.org](https://nera.js.org)

A ready-to-edit travel blog for the
[Nera](https://github.com/seebaermichi/nera) static site generator, on
[`@nera-static/theme-umwege`](https://www.npmjs.com/package/@nera-static/theme-umwege):
the sample blog "Umwege" of the theme, in English. Fifteen sample posts with
trip facts and places, the series "Alps without a car" and "Start here"
(which `write-a-post.md` opens), ten photographs, tags shown as passport
stamps with a page per tag, an archive by year, prev/next between posts,
search, an Atom feed, a sitemap, structured data (a `BlogPosting` per post),
canonical links, a menu, responsive images, social links and imprint and
privacy placeholders. The only JavaScript is the search script, on the search
page; no third-party requests. A fresh site passes `nera build --check` and
`nera validate` without a single finding, with every rule of `nera check` at
`error` except `a11y-target-blank`.

The ten photographs are **not MIT**: they are used under the
[Unsplash License](https://unsplash.com/license), see
[Picture credits](#picture-credits) and `CREDITS.md`.

## Usage

```bash
npx @nera-static/nera new my-trips --starter umwege
npx @nera-static/nera new my-trips --starter umwege --name "My Trips" --lang de
```

`--name` and `--lang` set `name` and `lang` in `config/app.yaml`; a new
language gets a copy of the English `translations:` entry to translate. The
sample pages stay in English.

The first build encodes the ten photographs into their AVIF and WebP sizes
and takes a minute or two; plugin-images keeps them in `.nera-cache/`, so
every later build takes seconds.

## What you get

- `pages/index.md` (home), `archive.md`, `about.md`, `search.md`, and fifteen
  posts in `pages/posts/`, among them `write-a-post.md`, which uses every
  frontmatter key the theme reads (`lead`, `updated`, `location`, `series`,
  `series_part`, `facts`, and `image`, `image_alt` as comments to fill in)
  plus `is_post`
- `pages/imprint.md`, `pages/privacy.md`: **placeholders, not legal texts**
- `config/app.yaml`: name, language, `theme: umwege`, `origin`, the theme and
  plugin texts, and a comment on the photographs' licence
- `config/theme.yaml`: the footer links, `blog.home_posts` (the cards after
  the boarding pass), `blog.highlight_tag` (the tag whose newest posts the
  home lists on the coral band, here "Road notes") and `author.name`,
  `author.bio`, `author.href` (the about block, and the byline of every post
  without its own `author`)
- `config/structured-data.yaml`: the site entity, a `Person` named like
  `author.name`, and `articles.key: is_post`, so every post with
  `is_post: true` gets a `BlogPosting`, in any language
- `config/images.yaml`: the widths the theme's frames are made for, up to
  2400 px
- `config/search.yaml`, `plugin-order.yaml` (canonical links, structured data
  and search run last, so the tag pages get them too), `tags.yaml`,
  `navigation.yaml` (Trips, Road notes, About, Search, Feed),
  `link-attributes.yaml`, `social-media-links.yaml`
- `config/validate.yaml`: every rule of `nera check` at `error` (the checks of
  `nera validate` have fixed severities), except `a11y-target-blank`
  (external links open in a new tab and the theme marks them with ↗)
- `config/cms.yaml`: the editing schema for Nera Pro (labels, help texts and
  field types per page type, including a post's `facts`, `location`, `series`
  and `series_part`); Nera ignores it
- `theme/views/partials/`: the theme's seams, filled with the plugins' output
  (`head-extra` carries the canonical links and the structured data,
  `scripts-extra` loads `/js/search.js` on the search page only)
- `theme/views/pages/search.pug` and `theme/views/vendor/`: the search page
  and the plugins' published templates
- `theme/assets/js/search.js` (plugin-search's script) and the ten
  photographs in `theme/assets/images/`
- plugins: tags, page-pagination, feed, sitemap, search, structured-data,
  canonical-links, link-attributes, navigation, images, social-media-links

## Picture credits

The photographs in `theme/assets/images/` come from the test site of
`@nera-static/theme-umwege`. They are used under the
[Unsplash License](https://unsplash.com/license) and are **not** covered by
the MIT licence of this package (see `LICENSE`). They are the originals
downscaled to a long edge of 2400 px, with their metadata removed. Keep them
under the Unsplash License, or replace them with pictures of your own. Each
file name ends in the photo's id; `CREDITS.md` in this package lists them
too. Names marked with * were derived from the download file name and not
checked against the photo page.

| Picture | Photographer | Photo |
|---|---|---|
| Morocco trip, dunes | Rowan Simpson* | https://unsplash.com/photos/fmHjwMOVSGI |
| Norway trip, ferry | Charly Nguyen* | https://unsplash.com/photos/jm2XnB8hh5A |
| Dolomites trip, village | Dubravko Palic* | https://unsplash.com/photos/U5mct6wSxnc |
| Rajasthan trip, Amber Fort | Meriç Dağlı | https://unsplash.com/photos/uADXI1v10us |
| Djerba trip, beach | Aleksandr Sali* | https://unsplash.com/photos/uXJnf0DsCvk |
| Cyprus trip, chapel | Athina Vrikki* | https://unsplash.com/photos/qp_Rfa_mPS0 |
| Namibia trip, acacia | Sam Power* | https://unsplash.com/photos/1MIfdlsqcso |
| Berlin trip, U-Bahn | Jay Wennington* | https://unsplash.com/photos/Y_aNcALhqZw |
| Dolomites post and South Tyrol trip, hut | Hardial Aujla* | https://unsplash.com/photos/0IZdJRSKvGI |
| Dolomites post and Val Gardena trip, peaks | Stefano Bazzoli* | https://unsplash.com/photos/6bav58U0kIU |

## German texts for `--lang de`

Replace the copied `de:` entry in `config/app.yaml` with:

```yaml
    de:
        language_name: Deutsch
        Skip to content: Zum Inhalt springen
        Main navigation: Hauptnavigation
        Language: Sprache
        Legal: Rechtliches
        Latest post: Neueste Reise
        Recent posts: Neueste Reisen
        All posts: Alle Reisen
        Published: Veröffentlicht
        Updated: Aktualisiert
        Series: Serie
        Part: Teil
        About the author: Über die Autorin
        Read more: Weiterlesen
        Tags: Orte und Themen
        posts: Reisen
        Imprint: Impressum
        Privacy: Datenschutz
        Pagination: Blätternavigation
        search_label: Suche
        search_placeholder: Reisen durchsuchen …
        search_no_results: Keine Treffer
```

The menu entries in `config/navigation.yaml` are plain text: `Reisen`,
`Road notes` (the name of the tag, which stays as it is), `Über mich`,
`Suche`, `Feed`. Set the social links' label in
`config/social-media-links.yaml`:

```yaml
aria_label: Anderswo
```

## Requirements

- `@nera-static/nera` 1.11.0 or later, with `@nera-static/core` 4.15.0 or
  later (the theme's floor; a fresh install brings the newest)
- Node.js `>=22.12.0` (its bundled npm 10.9 or later)

## License

MIT, except the ten photographs in `theme/assets/images/`, which are under
the [Unsplash License](https://unsplash.com/license) (see `LICENSE` and
`CREDITS.md`).

## First steps

After `nera new` the files are yours: a starter has no update path.

1. Replace `origin: https://example.com` in `config/app.yaml` with your
   site's real address. The feed, the sitemap, the canonical links and the
   structured data are built from it.
2. Replace `pages/imprint.md` and `pages/privacy.md` with your own legal texts.
3. Put your name and a sentence about yourself under `author:` in
   `config/theme.yaml`, the same name under `entity:` in
   `config/structured-data.yaml`, and your profiles in
   `config/social-media-links.yaml` and under `same_as:`; then rewrite the
   about page.
4. Add `theme/assets/search-index*.json` to `.gitignore`: plugin-search
   writes the index there on every build.
5. Replace the photographs in `theme/assets/images/` with your own, or keep
   them under the Unsplash License and its credits (see the comment at the
   top of `config/app.yaml`).
6. A new post is a Markdown file in `pages/posts/` with `date` and
   `is_post: true`; `write-a-post.md` shows the rest. Give it a `location`
   that is also one of its `tags`, so its stamp leads to the same place. When
   you delete the sample posts, set `blog.highlight_tag` in
   `config/theme.yaml` to a tag of your own, or to `''` to leave the coral
   band out.
