---
layout: pages/post.pug
slug: write-a-post
title: "Write your first trip"
description: "A post is one Markdown file in pages/posts/ with a few lines of frontmatter. This one uses every key the theme reads."
lead: "A post is one Markdown file in pages/posts/ with a few lines of frontmatter. This one uses every key the theme reads."
date: 2023-05-02
updated: 2023-05-09
# A picture above the text, on the post's card and among the prints on the
# home page. Put the file in theme/assets/images/ and remove the two `#`:
# image: /images/your-photo.jpg?ratio=4:3&focus=50,33
# image_alt: "What the picture shows, for readers who cannot see it"
location: "Germany"
tags: ["Germany"]
series: "Start here"
series_part: 1
facts:
    - label: "Duration"
      value: "1 evening"
    - label: "Getting there"
      value: "Text editor"
    - label: "Files"
      value: "1"
    - label: "Spent"
      value: "€0"
is_post: true
---

## One file per trip

Every post is a Markdown file in `pages/posts/`. The file name becomes the
address: `lisbon.md` is published as `/posts/lisbon.html`. Copy this one to
start:

```markdown
---
layout: pages/post.pug
title: Three days in Lisbon
description: Trams, tiles and one very steep street.
date: 2026-10-01
location: Portugal
tags: [Portugal]
is_post: true
---

## Day one

Start the text at `##`: the title above is the page's only first-level
heading.
```

## The frontmatter

The frontmatter of this post sets every key the theme reads:

- `layout: pages/post.pug` makes the page a post: it is listed on the home
  page, in the archive, in the feed and in the search.
- `date` orders the posts: the newest one is the boarding pass on the home
  page. Always set it, since a file's own date changes whenever the file is
  copied. `updated` adds "Updated" to the author line.
- `description` is the text on a card and the summary in the feed; `lead`
  is the larger line under the title.
- `location` is the place: the chip on the post's card and in its header,
  the caption of its print on the home page. Make it one of the post's
  `tags` too, so its passport stamp leads to the same place, here
  [Germany](/tags/germany.html).
- `tags` links the post to a tag page per tag. The home page lists the
  newest four posts tagged with `blog.highlight_tag` from
  `config/theme.yaml` on the coral band.
- `series` and `series_part` join posts into a series: the line above the
  title and the list of parts under the post, ordered by `series_part`.
- `image` and `image_alt` give the post a cover above the text, a picture
  on its card and a print on the home page. Put the file in
  `theme/assets/images/`; the alt text says what the picture shows. The
  part after `?` crops the photograph around its subject: `ratio=4:3` is
  the shape, `focus=50,33` the point to keep, in per cent from the left and
  from the top. This post has no picture, so the two lines are comments.
- `facts` are the four coloured tiles under the cover, each a `label` and
  a `value`. Use at most four, and write the unit into the value:
  `9 days`, `Night train`, `€780`. The card shows the first three.
- `is_post: true` marks the post for search engines: it gets a
  `BlogPosting` in the structured data of its page.

The author line reads `author.name` in `config/theme.yaml`; a post that sets
`author` names someone else.

## Preview and build

Run `nera dev` to see the post while you write, and `nera build --check` to
build the blog into `public/` and check every page. Delete this post once
your own first trip is out.
