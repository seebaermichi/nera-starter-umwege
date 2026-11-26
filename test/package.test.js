import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf-8')
const readJson = (file) => JSON.parse(read(file))
const pkg = readJson('package.json')

// What `nera new --starter` copies into a site (nera-cli/src/starter.js).
const STARTER_ENTRIES = ['pages', 'config', 'theme', 'assets', 'plugins', '.neraignore']

// Files the package ships beyond the starter folders: the photo credits (D8) and the changelog.
const EXTRA_FILES = ['CREDITS.md', 'CHANGELOG.md']

// The theme and the plugins a scaffolded site gets (ROADMAP-themes.md §S14 item 4).
// No plugin-code-blocks: a travel blog shows no code.
const DEPENDENCIES = [
    '@nera-static/plugin-canonical-links',
    '@nera-static/plugin-feed',
    '@nera-static/plugin-images',
    '@nera-static/plugin-link-attributes',
    '@nera-static/plugin-navigation',
    '@nera-static/plugin-page-pagination',
    '@nera-static/plugin-search',
    '@nera-static/plugin-sitemap',
    '@nera-static/plugin-social-media-links',
    '@nera-static/plugin-structured-data',
    '@nera-static/plugin-tags',
    '@nera-static/theme-umwege',
]

const version = (range) => range.slice(1).split('.').map(Number)
const atLeast = ([a, b, c], [x, y, z]) => a === x && (b > y || (b === y && c >= z))
const floor = (name) => version(pkg.dependencies[`@nera-static/${name}`])

describe('package.json starter contract', () => {
    it('names the starter with a label and a description', () => {
        expect(pkg.name).toBe('@nera-static/starter-umwege')
        expect(pkg.nera.starter.label).toBe('Travel blog')
        expect(pkg.nera.starter.description.trim()).not.toBe('')
        // The `nera new` picker shows the npm description, so both say the same.
        expect(pkg.description).toBe(pkg.nera.starter.description)
    })

    it('is found by the starter search', () => {
        expect(pkg.keywords).toContain('nera-starter')
    })

    it('runs on the Node floor of theme-umwege and the CLI', () => {
        expect(pkg.engines).toEqual({ node: '>=22.12.0' })
    })

    it('depends on theme-umwege and its eleven plugins, with caret ranges', () => {
        expect(Object.keys(pkg.dependencies).sort()).toEqual(DEPENDENCIES)
        for (const range of Object.values(pkg.dependencies)) expect(range).toMatch(/^\^\d+\.\d+\.\d+$/)
        expect(pkg.peerDependencies).toBeUndefined()
        expect(pkg.optionalDependencies).toBeUndefined()
        // A site keeps its own CLI entry; the starter must not bring one.
        expect(pkg.dependencies['@nera-static/nera']).toBeUndefined()
    })

    it('uses theme-umwege 1.1 (search) and every plugin at least at the theme\'s peer floor', () => {
        expect(atLeast(floor('theme-umwege'), [1, 1, 0])).toBe(true)
        const theme = readJson('node_modules/@nera-static/theme-umwege/package.json')
        for (const [name, peer] of Object.entries(theme.peerDependencies)) {
            expect(pkg.dependencies[name], name).toBeDefined()
            expect(atLeast(version(pkg.dependencies[name]), version(peer)), `${name} ${peer}`).toBe(true)
        }
    })

    it('uses plugin-search 2.4.0 (its search.js) and plugin-page-pagination 2.4.0 (its labelled <nav>)', () => {
        expect(atLeast(floor('plugin-search'), [2, 4, 0])).toBe(true)
        expect(atLeast(floor('plugin-page-pagination'), [2, 4, 0])).toBe(true)
    })

    it('has no lifecycle scripts besides prepare', () => {
        const lifecycle = [
            'preinstall', 'install', 'postinstall', 'prepublish',
            'preprepare', 'postprepare', 'prepublishOnly', 'prepack', 'postpack',
            'publish', 'postpublish',
        ]
        expect(Object.keys(pkg.scripts).filter((s) => lifecycle.includes(s))).toEqual([])
        expect(Object.keys(pkg.scripts).sort()).toEqual(['lint', 'prepare', 'test'])
        expect(pkg.scripts.prepare).toBe('husky')
    })

    it('ships only starter folders plus the credits and the changelog, and every starter folder it has', () => {
        for (const file of EXTRA_FILES) expect(pkg.files).toContain(file)
        const folders = pkg.files.filter((entry) => !EXTRA_FILES.includes(entry) && !entry.startsWith('!'))
        for (const entry of folders) expect(STARTER_ENTRIES, entry).toContain(entry)
        for (const entry of STARTER_ENTRIES.filter((e) => fs.existsSync(path.join(root, e)))) {
            expect(pkg.files, entry).toContain(entry)
        }
    })

    it('leaves out only the search index plugin-search writes into theme/assets/ on a local build', () => {
        expect(pkg.files.filter((entry) => entry.startsWith('!'))).toEqual(['!theme/assets/search-index*.json'])
    })

    it('is published publicly from its own repo', () => {
        expect(pkg.publishConfig).toEqual({ access: 'public' })
        expect(pkg.repository.url).toBe('git+https://github.com/seebaermichi/nera-starter-umwege.git')
    })

    it('does not claim the Unsplash photographs as MIT', () => {
        // A bare "MIT" would cover the whole package, photographs included.
        expect(pkg.license).toBe('SEE LICENSE IN LICENSE')
        const license = read('LICENSE')
        expect(license).toMatch(/^MIT License/)
        expect(license).toContain('does not cover the ten photographs')
        expect(license).toContain('https://unsplash.com/license')
        expect(license).toContain('CREDITS.md')
    })
})
