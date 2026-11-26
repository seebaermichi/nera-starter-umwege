# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-26

### Added

-   First release: the `umwege` starter for `nera new --starter umwege`, a travel blog on `@nera-static/theme-umwege`, built from the theme's English sample blog "Umwege". Requires `@nera-static/nera` 1.11.0 or later. A scaffolded site passes `nera build --check` and `nera validate` with no findings, with every rule at `error` except `a11y-target-blank`.
-   Dependencies merged into the site: `@nera-static/theme-umwege` ^1.1.0 and the plugins `plugin-tags` ^3.4.1, `plugin-page-pagination` ^2.4.0, `plugin-feed` ^1.0.3, `plugin-sitemap` ^1.1.1, `plugin-search` ^2.4.0, `plugin-structured-data` ^1.1.2, `plugin-canonical-links` ^2.2.4, `plugin-link-attributes` ^2.1.1, `plugin-navigation` ^3.1.1, `plugin-images` ^1.0.3 and `plugin-social-media-links` ^2.3.1.
-   `config/app.yaml`: `lang`, `name`, `robots`, `theme: umwege`, `origin: https://example.com` with a comment to replace it before deploying, a header comment on the photographs' Unsplash License, and `translations.en` with `language_name` and every theme, footer-link and plugin text, so `--lang` copies them into a new entry to translate.
-   `config/theme.yaml` (`footer_links` to the imprint and privacy pages, `blog.home_posts`, `blog.highlight_tag: Road notes`, `author`), `tags.yaml`, `navigation.yaml` (Trips, Road notes, About, Search, Feed), `images.yaml` (widths up to 2400 px), `link-attributes.yaml`, `social-media-links.yaml` (external links in a new tab, placeholder profiles), `search.yaml` (one index per language, the script loaded by the theme's `scripts-extra` seam), `plugin-order.yaml` (canonical links, structured data and search last) and `validate.yaml` (every rule at `error` except `a11y-target-blank: off`).
-   `config/structured-data.yaml`: the site entity as a `Person` named like `author.name`, and `articles.key: is_post`, so every post with `is_post: true` gets a `BlogPosting` whatever the site's language.
-   `config/cms.yaml`, the editing schema Nera Pro reads: one entry per page type, keyed by its layout, including a post's `facts` (a list of `label` and `value`), `location`, `series` and `series_part` (number). Nera ignores the file.
-   `theme/views/partials/`: the theme's seams filled with the plugins' output, `head-extra` with the canonical links and the structured data, `scripts-extra` with the search script on the search page only; `theme/views/pages/search.pug`; `theme/views/vendor/`: the published templates of the plugins, plugin-search's from 2.4.0 unedited.
-   `pages/`: home, archive, about, search, imprint and privacy placeholders citing § 5 DDG and the TDDDG, and fifteen sample posts with trip facts and places and the series "Alps without a car", among them `posts/write-a-post.md`, which shows every frontmatter key the theme reads.
-   `theme/assets/js/search.js` (plugin-search 2.4.0's script) and ten photographs in `theme/assets/images/`, the Unsplash originals of the theme's test site downscaled to a long edge of 2400 px with their metadata removed. They are under the Unsplash License, not MIT: `LICENSE` excludes them, and `CREDITS.md` (shipped in the package) and the README credit each one.
-   README: what a site gets, the picture credits, the German texts for `--lang de`, and the First steps `nera new` prints.
