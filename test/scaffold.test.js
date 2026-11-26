import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execFileSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import { parse } from 'yaml'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const cli = path.join(root, 'node_modules', '@nera-static', 'nera', 'bin', 'nera.js')
const searchPlugin = path.join(root, 'node_modules', '@nera-static', 'plugin-search')

// A warm build takes seconds; checks and validations run on built sites.
const TIMEOUT = 180_000
// A cold build encodes the ten photographs first (≈ 90 s locally, minutes in CI).
const BUILD_TIMEOUT = 900_000

// plugin-images' cache of encoded variants: kept in the repo between runs
// (git-ignored, cached in CI), copied into each temp site before its build.
const CACHE = '.nera-cache'
const repoCache = path.join(root, CACHE)

// What `nera new --starter` copies into a site (nera-cli/src/starter.js).
const STARTER_ENTRIES = ['pages', 'config', 'theme', 'assets', 'plugins', '.neraignore']

// The English posts of the theme's fixture "Umwege" (nera-theme-umwege test/site).
const FIXTURE_POSTS = [
    'booking-ferries', 'djerba-in-february', 'dolomites-without-a-car',
    'erg-chebbi-before-the-sun', 'four-hundred-kilometres', 'hut-to-hut-val-gardena',
    'jaipur-before-the-buses', 'kreuzberg-as-a-tourist', 'more-churches-than-cafes',
    'night-trains-worth-the-bunk', 'norwegian-coast-by-ferry', 'packing-list',
    'south-tyrol-wrong-season', 'what-a-trip-costs',
]
const PAGES = ['index.html', 'archive.html', 'about.html', 'search.html', 'imprint.html', 'privacy.html']
const TAGS = [
    'cyprus', 'first-snow', 'germany', 'india', 'italy', 'morocco', 'mountains',
    'namibia', 'night-trains', 'norway', 'road-notes', 'tunisia', 'without-a-car',
]

// Every rule of `nera check`, the opt-in ones included.
const RULES = [
    'a11y-html-lang', 'a11y-title', 'a11y-h1', 'a11y-heading-skip', 'a11y-img-alt',
    'a11y-form-label', 'a11y-link-name', 'a11y-main', 'a11y-skip-link', 'a11y-nav-name',
    'a11y-duplicate-id', 'a11y-viewport-zoom', 'a11y-link-lang', 'a11y-target-blank',
    'a11y-reduced-motion', 'privacy-third-party', 'privacy-consent-leak', 'privacy-insecure',
    'privacy-storage', 'legal-imprint-link', 'legal-privacy-link', 'legal-outdated-law',
    'seo-jsonld',
]

let tmp

beforeAll(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nera-starter-umwege-'))
})

afterAll(() => {
    fs.rmSync(tmp, { recursive: true, force: true })
})

const nera = (args, cwd) =>
    execFileSync(process.execPath, [cli, ...args], {
        cwd,
        encoding: 'utf-8',
        stdio: 'pipe',
    })

// Scaffold `name` from this repo with the devDependency CLI, offline: a
// local starter path is read in place and --no-install skips npm. The site
// then resolves the CLI, the theme and the plugins from this repo's
// node_modules (they are this package's dependencies).
function scaffold(name, extra = []) {
    nera(['new', name, '--starter', root, '--yes', '--no-install', ...extra], tmp)
    const site = path.join(tmp, name)
    fs.symlinkSync(path.join(root, 'node_modules'), path.join(site, 'node_modules'), 'dir')
    return site
}

// The first build of a site: warm from the repo's image cache when there is
// one, which then takes the site's cache back for the next site and run.
function build(site) {
    if (fs.existsSync(repoCache)) fs.cpSync(repoCache, path.join(site, CACHE), { recursive: true })
    nera(['build'], site)
    fs.rmSync(repoCache, { recursive: true, force: true })
    fs.cpSync(path.join(site, CACHE), repoCache, { recursive: true })
}

const read = (dir, file) => fs.readFileSync(path.join(dir, file), 'utf-8')
const readYaml = (dir, file) => parse(read(dir, file))

// Every file below `dir`, as paths relative to it.
function walk(dir, base = dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name)
        return entry.isDirectory() ? walk(full, base) : [path.relative(base, full)]
    })
}

// The files of this repo a site receives (`.neraignore` is a file, the rest folders).
const starterFiles = () => STARTER_ENTRIES
    .filter((e) => fs.existsSync(path.join(root, e)))
    .flatMap((e) => fs.statSync(path.join(root, e)).isDirectory()
        ? walk(path.join(root, e)).map((f) => path.join(e, f))
        : [e])

const postFiles = () => fs.readdirSync(path.join(root, 'pages', 'posts')).filter((f) => f.endsWith('.md'))

// The values of a post's fact tiles.
const facts = (page) => [...page.matchAll(/<dd class="post-facts__value">([^<]*)<\/dd>/g)].map(([, value]) => value)

// Build, check and validate: no finding, and no warning from core or a
// plugin anywhere in the build's text output.
function expectCleanBuild(site) {
    const out = nera(['build', '--check'], site)
    expect(out).toContain('No problems found')
    expect(out).not.toMatch(/\d+ error\(s\), \d+ warning\(s\)/)
    expect(out).not.toMatch(/warn|⚠|❌|deprecat|Views folder not found/i)

    const json = JSON.parse(nera(['build', '--check', '--json'], site))
    expect(json).toEqual({ ok: true, results: [] })

    expect(nera(['validate'], site)).toContain('No problems found')
    expect(JSON.parse(nera(['validate', '--json'], site))).toEqual({ ok: true, results: [] })
}

describe('the starter files', () => {
    it('are English only: no German pages, menu, links, translations or index', () => {
        expect(fs.existsSync(path.join(root, 'pages', 'de'))).toBe(false)
        expect(Object.keys(readYaml(root, 'config/app.yaml').translations)).toEqual(['en'])
        expect(Array.isArray(readYaml(root, 'config/navigation.yaml').elements)).toBe(true)
        const theme = readYaml(root, 'config/theme.yaml')
        for (const link of theme.footer_links) expect(typeof link.href, link.label).toBe('string')
        expect(typeof theme.author.href).toBe('string')
        const { legal } = readYaml(root, 'config/validate.yaml')
        expect(Object.keys(legal.imprint)).toEqual(['en'])
        expect(Object.keys(legal.privacy)).toEqual(['en'])
        for (const file of starterFiles().filter((f) => /\.(?:md|ya?ml|pug|js)$/.test(f))) {
            expect(read(root, file), file).not.toMatch(/\/de\/|main_de|^\s*de:|\bde\.json/m)
        }
        // A page without `lang` follows `lang` in config/app.yaml, so
        // `nera new --lang` switches every page at once.
        for (const file of starterFiles().filter((f) => f.endsWith('.md'))) {
            expect(read(root, file), file).not.toMatch(/^lang:/m)
        }
    })

    it('use theme-umwege and carry every theme and plugin text under translations.en', () => {
        const app = readYaml(root, 'config/app.yaml')
        expect(app.theme).toBe('umwege')
        expect(app.lang).toBe('en')
        expect(app.name).toBe('Umwege')
        expect(app.origin).toMatch(/^https:\/\//)
        expect(Object.keys(app.translations.en).sort()).toEqual([
            'About the author', 'All posts', 'Imprint', 'Language', 'Latest post', 'Legal',
            'Main navigation', 'Pagination', 'Part', 'Privacy', 'Published', 'Read more',
            'Recent posts', 'Series', 'Skip to content', 'Tags', 'Updated', 'language_name',
            'posts', 'search_label', 'search_no_results', 'search_placeholder',
        ].sort())
    })

    it('carry every t() key the theme renders', () => {
        const views = path.join(root, 'node_modules', '@nera-static', 'theme-umwege', 'views')
        const keys = new Set(walk(views).filter((f) => f.endsWith('.pug'))
            .flatMap((f) => [...read(views, f).matchAll(/\bt\('([^']+)'\)/g)].map(([, key]) => key)))
        expect(keys.size).toBeGreaterThan(10)
        const { en } = readYaml(root, 'config/app.yaml').translations
        for (const key of keys) expect(en, key).toHaveProperty([key])
    })

    it('name the Unsplash License in the header of config/app.yaml, which a site receives', () => {
        const header = read(root, 'config/app.yaml').split('\nlang:')[0]
        expect(header).toContain('https://unsplash.com/license')
        expect(header).toContain('https://unsplash.com/photos/<id>')
        expect(header).toContain('CREDITS.md')
    })

    it('turn every check rule on at error, except a11y-target-blank', () => {
        const { rules } = readYaml(root, 'config/validate.yaml')
        expect(Object.keys(rules).sort()).toEqual([...RULES].sort())
        for (const rule of RULES) expect(rules[rule], rule).toBe(rule === 'a11y-target-blank' ? 'off' : 'error')
    })

    it('ship plugin-search\'s template and client unedited, and no search index or image cache', () => {
        for (const [file, source] of [
            ['theme/views/vendor/plugin-search/search.pug', 'views/search.pug'],
            ['theme/assets/js/search.js', 'views/search.js'],
        ]) {
            expect(read(root, file), file).toBe(read(searchPlugin, source))
        }
        expect(readYaml(root, 'config/search.yaml').include_script).toBe(false)
        expect(starterFiles().filter((f) => /search-index/.test(f))).toEqual([])
        expect(starterFiles().filter((f) => f.includes(CACHE))).toEqual([])
    })

    it('run plugin-search last, so the tag pages are indexed', () => {
        expect(readYaml(root, 'config/plugin-order.yaml')['plugin-order']).toEqual([
            { end: ['plugin-search'] },
        ])
    })

    it('give every page a layout and every post a date, and keep the fixture\'s two crops', () => {
        for (const file of starterFiles().filter((f) => f.endsWith('.md'))) {
            const front = parse(read(root, file).match(/^---\r?\n([\s\S]*?)\r?\n---/)[1])
            expect(front.layout, file).toBeTruthy()
            if (file.startsWith(path.join('pages', 'posts'))) expect(front.date, file).toBeTruthy()
            if (front.image) expect(front.image_alt, file).toBeTruthy()
        }
        expect(postFiles().sort()).toEqual(FIXTURE_POSTS.map((slug) => `${slug}.md`))
        expect(read(root, 'pages/posts/kreuzberg-as-a-tourist.md')).toContain('?ratio=4:3&focus=50,33')
        expect(read(root, 'pages/posts/norwegian-coast-by-ferry.md')).toContain('?ratio=2:1&focus=50,100')
        // plugin-images publishes the variants; the originals keep their full size.
        expect(read(root, '.neraignore').trim()).toBe('images')
    })
})

describe('nera new --starter <this repo>', () => {
    let site
    let pub

    beforeAll(() => {
        site = scaffold('site')
        build(site)
        pub = path.join(site, 'public')
    }, BUILD_TIMEOUT)

    it('scaffolds a site that builds, checks and validates clean', () => {
        expectCleanBuild(site)
    }, TIMEOUT)

    it('renders every page, post and tag page, the feed and the search client', () => {
        const posts = postFiles().map((f) => `posts/${f.replace(/\.md$/, '.html')}`)
        for (const file of [
            ...PAGES, ...posts, ...TAGS.map((tag) => `tags/${tag}.html`),
            'feed.xml', 'js/search.js', 'search-index.json',
        ]) {
            expect(fs.existsSync(path.join(pub, file)), file).toBe(true)
        }
        expect(fs.readdirSync(path.join(pub, 'tags')).sort()).toEqual(TAGS.map((tag) => `${tag}.html`))
        const feed = read(pub, 'feed.xml')
        expect(feed).toContain('<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en">')
        expect(feed.match(/<entry>/g)).toHaveLength(posts.length)
        for (const post of posts) {
            expect(feed).toContain(`<link rel="alternate" type="text/html" href="https://example.com/${post}"/>`)
        }
    })

    it('fills the home: three prints, the boarding pass, five cards, stamps, highlight and author', () => {
        const home = read(pub, 'index.html')
        expect(home).toContain('<h1 class="home-hero__title">Detours worth the trip.</h1>')
        const aside = home.slice(home.indexOf('class="home-hero__aside"'), home.indexOf('</section>', home.indexOf('class="home-hero__aside"')))
        expect([...aside.matchAll(/<a href="([^"]*)"/g)].map(([, href]) => href)).toEqual([
            '/posts/dolomites-without-a-car.html', '/posts/norwegian-coast-by-ferry.html',
            '/posts/erg-chebbi-before-the-sun.html',
        ])
        expect(home).toMatch(/<section class="home-pass" aria-label="Latest post">[\s\S]*?<h2><a href="\/posts\/dolomites-without-a-car\.html">Nine days in the Dolomites without a car<\/a><\/h2>/)
        expect([...home.matchAll(/<dd>([^<]*)<\/dd>/g)].map(([, value]) => value).slice(0, 4))
            .toEqual(['9 days', 'Night train', '132 km', '€780'])
        expect(home.match(/<article class="post-card[ "]/g)).toHaveLength(5)
        expect(home).toContain('<h2 class="post-list__title">Recent posts</h2><a class="post-list__more" href="/archive.html">All posts</a>')
        expect(home).toContain('<h2>Tags</h2>')
        expect(home.match(/class="tag-cloud__item"/g)).toHaveLength(TAGS.length)
        expect(home).toMatch(/<section class="home-highlight">\s*<div>\s*<h2>Road notes<\/h2>/)
        expect(home).toMatch(/<section class="home-about"><span class="home-about__mark" aria-hidden="true">LS<\/span>\s*<div>\s*<p>About the author<\/p>\s*<h2>Lena Sommer<\/h2>/)
        expect(home).toContain('<ul class="nav nav--list">')
        for (const href of ['/archive.html', '/tags/road-notes.html', '/about.html', '/search.html', '/feed.xml']) {
            expect(home, href).toContain(`class="nav__link" href="${href}"`)
        }
        expect(home).toMatch(/<link rel="alternate" type="application\/atom\+xml" href="\/feed\.xml"/)
        // One language: no language switch.
        expect(home).not.toContain('aria-label="Language"')
    })

    it('fills a post: series, location, four facts, cover, tags, prev/next, social links', () => {
        const post = read(pub, 'posts/dolomites-without-a-car.html')
        expect(post).toContain('<p class="post__series">Series: Alps without a car · Part 3</p>')
        expect(post).toMatch(/<p class="post__location"><svg[\s\S]*?<\/svg>Italy<\/p>/)
        expect(facts(post)).toEqual(['9 days', 'Night train', '132 km', '€780'])
        expect(post).toMatch(/<div class="post__media">\s*<picture>/)
        expect(post).toContain('alt="A mountain village in the snow at the end of a valley, white peaks behind"')
        expect(post).toContain('<a class="tag-links__item" href="/tags/first-snow.html">First snow</a>')
        expect(post).toContain('<nav class="post-series" aria-label="Series">')
        expect(post).toContain('<nav class="page-pagination" aria-label="Pagination">')
        expect(post).toContain('page-pagination__link--previous" href="/posts/norwegian-coast-by-ferry.html"')
        expect(post).toContain('<nav class="social-media-links" aria-label="Elsewhere">')
        expect(post).toContain('<nav class="site-footer__legal" aria-label="Legal"><a href="/imprint.html">Imprint</a><a href="/privacy.html">Privacy</a></nav>')
    })

    it('crops the two covers as the fixture does: 4:3 and 2:1', () => {
        for (const [slug, ratio] of [['kreuzberg-as-a-tourist', 4 / 3], ['norwegian-coast-by-ferry', 2]]) {
            const [, width, height] = read(pub, `posts/${slug}.html`)
                .match(/<img class="post__image"[^>]*width="(\d+)" height="(\d+)"/)
            expect(Number(width) / Number(height), slug).toBeCloseTo(ratio, 2)
        }
    })

    it('renders the archive by year, a tag page and the search page', () => {
        const archive = read(pub, 'archive.html')
        expect(archive.match(/class="post-archive__year"/g)).toHaveLength(4)

        const tag = read(pub, 'tags/road-notes.html')
        expect(tag).toContain('<h1 class="tag-overview__title">Road notes</h1>')
        expect(tag).toContain('<time class="tag-overview__item-date" datetime="2024-05-14">May 14, 2024</time>')

        const search = read(pub, 'search.html')
        expect(search.match(/<h1[\s>]/g)).toHaveLength(1)
        expect(search).toContain('placeholder="Search trips …" aria-label="Search" data-search-input data-search-index="/search-index.json"')
        expect(search).toContain('data-search-empty="No results"')
        expect(search.match(/<script src="\/js\/search\.js"><\/script>/g)).toHaveLength(1)

        const index = JSON.parse(read(pub, 'search-index.json'))
        const hrefs = index.map((entry) => entry.href)
        for (const slug of FIXTURE_POSTS) expect(hrefs, slug).toContain(`/posts/${slug}.html`)
        expect(hrefs).toContain('/tags/road-notes.html')
        expect(fs.readdirSync(pub).filter((f) => /^search-index\..+\.json$/.test(f))).toEqual([])
    })

    it('loads JavaScript on the search page only and makes no third-party request', () => {
        const html = walk(pub).filter((f) => f.endsWith('.html'))
        for (const file of html) {
            const page = read(pub, file)
            if (file !== 'search.html') expect(page, file).not.toMatch(/<script/i)
            expect(page, file).not.toMatch(/<(?:link|img|source|iframe|video|audio|script)\b[^>]*\s(?:href|src|srcset)="(?:https?:)?\/\//i)
        }
        for (const file of walk(pub).filter((f) => f.endsWith('.css'))) {
            expect(read(pub, file), file).not.toMatch(/url\(\s*['"]?(?:https?:)?\/\/|@import/i)
        }
        expect(read(pub, 'js/search.js')).not.toMatch(/https?:\/\//)
    })

    it('publishes the image variants, not the originals', () => {
        expect(fs.existsSync(path.join(pub, 'images'))).toBe(false)
    })

    it('links only to pages and files that exist', () => {
        for (const file of walk(pub).filter((f) => f.endsWith('.html'))) {
            for (const [, url] of read(pub, file).matchAll(/\s(?:href|src)="(\/[^"#?]*)/g)) {
                expect(fs.existsSync(path.join(pub, url)), `${file} → ${url}`).toBe(true)
            }
        }
    })

    it('copies only the starter folders into the site, byte for byte', () => {
        for (const file of [
            'README.md', 'CHANGELOG.md', 'CREDITS.md', 'LICENSE', 'eslint.config.js',
            'package-lock.json', 'scripts', 'test', '.github', '.husky', 'plans',
        ]) {
            expect(fs.existsSync(path.join(site, file)), file).toBe(false)
        }
        const files = starterFiles()
        expect(files.length).toBeGreaterThan(50)
        for (const file of files) {
            expect(fs.readFileSync(path.join(site, file)).equals(fs.readFileSync(path.join(root, file))), file)
                .toBe(true)
        }
    })

    it('leaves out the scaffold\'s nera:scaffold-default views', () => {
        for (const file of ['theme/views/layouts/layout.pug', 'theme/views/pages/default.pug']) {
            expect(fs.existsSync(path.join(site, file)), file).toBe(false)
        }
    })
})

describe('nera new --starter <this repo> --name "Brot & Zeit" --lang de', () => {
    let site

    beforeAll(() => {
        site = scaffold('site-de', ['--name', 'Brot & Zeit', '--lang', 'de'])
        build(site)
    }, BUILD_TIMEOUT)

    it('sets name and lang and copies the English texts into a de entry', () => {
        const app = readYaml(site, 'config/app.yaml')
        expect(app.name).toBe('Brot & Zeit')
        expect(app.lang).toBe('de')
        expect(app.theme).toBe('umwege')
        expect(app.translations.de).toEqual(app.translations.en)
    })

    it('still builds, checks and validates clean, every page in German markup', () => {
        expectCleanBuild(site)
        const pub = path.join(site, 'public')
        const home = read(pub, 'index.html')
        expect(home).toContain('<html lang="de">')
        expect(home).toContain('– Brot &amp; Zeit</title>')
        // No page sets its own `lang`, so the menu and the links stay at the root.
        expect(home).toContain('href="/archive.html"')
        expect(home).not.toContain('href="/en/')
        expect(read(pub, 'posts/dolomites-without-a-car.html')).toContain('<html lang="de">')
        expect(read(pub, 'search.html')).toContain('data-search-index="/search-index.json"')
        expect(fs.existsSync(path.join(pub, 'feed.xml'))).toBe(true)
        expect(fs.existsSync(path.join(pub, 'tags', 'road-notes.html'))).toBe(true)
    }, TIMEOUT)
})
