import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parse } from 'yaml'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pagesDir = path.join(root, 'pages')
const source = fs.readFileSync(path.join(root, 'config', 'cms.yaml'), 'utf-8')
const cms = parse(source)

// The six cases of nera-pro's FieldType enum (app/Enums/FieldType.php).
const FIELD_TYPES = ['string', 'boolean', 'date', 'number', 'list', 'list_of_objects']

// Where a layout key resolves: the starter's own views win over the theme's.
const VIEW_ROOTS = [
    path.join(root, 'theme', 'views'),
    path.join(root, 'node_modules', '@nera-static', 'theme-umwege', 'views'),
]

// A folder key is `folder:` plus the repo-relative directory, as nera-pro's
// groupKeyOf writes it (`folder:pages/posts`).
const FOLDER_PREFIX = 'folder:'
const folderOfKey = (key) => path.join(root, key.slice(FOLDER_PREFIX.length))

// The keys format v1 gives a field; anything else is a typo or a flow-mapping
// value cut at an unquoted comma (`help: a, b` makes `b` a key).
const FIELD_KEYS = ['label', 'help', 'type', 'entries']

// `layout` picks the page type, so it is never a field of one.
const NOT_A_FIELD = ['layout']

// A frontmatter date as the yaml core schema reads it: a plain string.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const isDirectory = (dir) => fs.existsSync(dir) && fs.statSync(dir).isDirectory()
const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

function markdownFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const file = path.join(dir, entry.name)
        if (entry.isDirectory()) return markdownFiles(file)
        return entry.name.endsWith('.md') ? [file] : []
    })
}

// A sample page's frontmatter, parsed as Nera Pro reads it ({} without one).
function frontmatterOf(file) {
    const match = fs.readFileSync(file, 'utf-8').match(/^---\r?\n([\s\S]*?)\r?\n---/)
    return match ? parse(match[1]) : {}
}

const samples = markdownFiles(pagesDir).map((file) => ({
    name: path.relative(root, file),
    front: frontmatterOf(file),
}))
const posts = samples.filter(({ front }) => front.layout === 'pages/post.pug')

const pageTypes = Object.entries(cms.page_types)
const fieldsOf = ([, pageType]) => Object.entries(pageType.fields)
const postFields = cms.page_types['pages/post.pug'].fields

// Whether a frontmatter value has the shape the field's type promises; a
// field without a type is a string.
const MATCHES_TYPE = {
    string: (value) => typeof value === 'string',
    boolean: (value) => typeof value === 'boolean',
    date: (value) => typeof value === 'string' && ISO_DATE.test(value),
    number: (value) => Number.isInteger(value),
    list: (value) => Array.isArray(value) && value.every((item) => typeof item === 'string'),
    list_of_objects: (value) => Array.isArray(value) && value.every(isPlainObject),
}

function expectLabelledField(where, field) {
    expect(isPlainObject(field), where).toBe(true)
    for (const key of Object.keys(field)) expect(FIELD_KEYS, `${where} key`).toContain(key)
    expect(typeof field.label, `${where}.label`).toBe('string')
    expect(field.label.trim(), `${where}.label`).not.toBe('')
    if (field.help !== undefined) {
        expect(typeof field.help, `${where}.help`).toBe('string')
        expect(field.help.trim(), `${where}.help`).not.toBe('')
    }
}

describe('config/cms.yaml', () => {
    it('says that only Nera Pro reads it', () => {
        expect(source.split('\n')[0]).toBe('# Read by Nera Pro only; Nera ignores this file.')
    })

    it('lives in config/, which Nera never copies into public/', () => {
        // Only the assets folder reaches public/; the site keeps core's
        // default, theme/assets/, and no copy of the file sits there.
        const app = parse(fs.readFileSync(path.join(root, 'config', 'app.yaml'), 'utf-8'))
        expect(app.folders?.assets).toBeUndefined()
        const assets = fs.readdirSync(path.join(root, 'theme', 'assets'), { recursive: true })
        expect(assets.some((file) => path.basename(file) === 'cms.yaml')).toBe(false)
    })

    it('parses into a page_types map with fields for every page type', () => {
        expect(Object.keys(cms)).toEqual(['page_types'])
        expect(pageTypes.length).toBeGreaterThan(0)
        for (const [key, pageType] of pageTypes) {
            expect(typeof pageType.label, `${key}.label`).toBe('string')
            expect(pageType.label.trim(), `${key}.label`).not.toBe('')
            expect(isPlainObject(pageType.fields), `${key}.fields`).toBe(true)
            expect(Object.keys(pageType.fields).length, `${key}.fields`).toBeGreaterThan(0)
        }
    })

    it('keys every page type by a layout or a folder that exists', () => {
        for (const [key] of pageTypes) {
            if (key.startsWith(FOLDER_PREFIX)) {
                expect(isDirectory(folderOfKey(key)), key).toBe(true)
            } else {
                expect(VIEW_ROOTS.some((dir) => fs.existsSync(path.join(dir, key))), key).toBe(true)
            }
        }
    })

    it('has a page type for every layout a sample page uses', () => {
        const layouts = new Set(samples.map(({ front }) => front.layout))
        expect([...layouts].every(Boolean)).toBe(true)
        expect([...layouts].sort()).toEqual(pageTypes.map(([key]) => key).sort())
    })

    it('puts new pages only into folders under pages/', () => {
        for (const [key, pageType] of pageTypes) {
            if (pageType.folder === undefined) continue
            expect(typeof pageType.folder, `${key}.folder`).toBe('string')
            expect(isDirectory(path.join(pagesDir, pageType.folder)), `${key}.folder`).toBe(true)
        }
        expect(cms.page_types['pages/post.pug'].folder).toBe('posts')
    })

    it('labels every field and uses only the six field types', () => {
        for (const pageType of pageTypes) {
            for (const [name, field] of fieldsOf(pageType)) {
                const where = `${pageType[0]}.${name}`
                expectLabelledField(where, field)
                if (field.type !== undefined) expect(FIELD_TYPES, `${where}.type`).toContain(field.type)
            }
        }
    })

    it('gives every list_of_objects field its entries, and only those', () => {
        for (const pageType of pageTypes) {
            for (const [name, field] of fieldsOf(pageType)) {
                const where = `${pageType[0]}.${name}`
                if (field.type !== 'list_of_objects') {
                    expect(field.entries, `${where}.entries`).toBeUndefined()
                    continue
                }
                expect(isPlainObject(field.entries), `${where}.entries`).toBe(true)
                expect(Object.keys(field.entries).length, `${where}.entries`).toBeGreaterThan(0)
                for (const [entry, entryField] of Object.entries(field.entries)) {
                    expectLabelledField(`${where}.entries.${entry}`, entryField)
                }
            }
        }
    })

    it('has a field of the right type for every key a sample page writes', () => {
        for (const { name, front } of samples) {
            const { fields } = cms.page_types[front.layout]
            for (const [key, value] of Object.entries(front)) {
                if (NOT_A_FIELD.includes(key)) continue
                const where = `${name}: ${key}`
                expect(fields[key], where).toBeDefined()
                expect(MATCHES_TYPE[fields[key].type || 'string'](value), where).toBe(true)
            }
        }
    })

    it('types the post fields the way the sample posts write them', () => {
        expect(postFields.date.type).toBe('date')
        expect(postFields.updated.type).toBe('date')
        expect(postFields.tags.type).toBe('list')
        expect(postFields.series_part.type).toBe('number')
        expect(postFields.facts.type).toBe('list_of_objects')
        expect(postFields.is_post.type).toBe('boolean')
    })

    it('offers the shared blog contract fields, and no image_note: Umwege shows none', () => {
        for (const name of ['series', 'series_part', 'facts', 'location']) {
            expect(postFields[name], name).toBeDefined()
        }
        for (const name of ['series', 'location', 'image', 'image_alt']) {
            expect(postFields[name].type, name).toBeUndefined()
        }
        expect(postFields.image_note).toBeUndefined()
    })

    it('finds every sample post\'s location among its tags, so the stamps lead there too', () => {
        const withLocation = posts.filter(({ front }) => front.location !== undefined)
        expect(withLocation.length).toBeGreaterThan(0)
        for (const { name, front } of withLocation) expect(front.tags, name).toContain(front.location)
    })

    it('asks for image_alt wherever a post sets image', () => {
        expect(postFields.image_alt.help).toMatch(/^Required when the post has a cover image/)
        const withImage = posts.filter(({ front }) => front.image !== undefined)
        expect(withImage.length).toBeGreaterThan(0)
        for (const { name, front } of withImage) {
            expect(typeof front.image_alt, name).toBe('string')
            expect(front.image_alt.trim(), name).not.toBe('')
        }
        // A post without a picture sets neither key: an image_alt alone would
        // describe nothing.
        for (const { name, front } of posts.filter(({ front }) => front.image === undefined)) {
            expect(front.image_alt, name).toBeUndefined()
        }
    })

    it('points every sample image at a photograph the starter ships', () => {
        for (const { name, front } of posts.filter(({ front }) => front.image !== undefined)) {
            const file = front.image.split('?')[0]
            expect(file.startsWith('/images/'), name).toBe(true)
            expect(fs.existsSync(path.join(root, 'theme', 'assets', file)), name).toBe(true)
        }
    })

    it('gives the write-a-post sample every post field but author, its picture as comments', () => {
        const file = path.join('pages', 'posts', 'write-a-post.md')
        const sample = posts.find(({ name }) => name === file)
        expect(sample).toBeDefined()
        const missing = Object.keys(postFields).filter((key) => !(key in sample.front))
        expect(missing).toEqual(['author', 'image', 'image_alt'])
        // The sample ships no picture, so it shows the two keys commented out.
        const text = fs.readFileSync(path.join(root, file), 'utf-8')
        expect(text).toMatch(/^# image: \/images\//m)
        expect(text).toMatch(/^# image_alt: /m)
    })

    it('matches the facts entries to every sample post that writes facts', () => {
        const entries = Object.keys(postFields.facts.entries).sort()
        const withFacts = posts.filter(({ front }) => front.facts !== undefined)
        expect(withFacts.length).toBeGreaterThan(0)
        for (const { name, front } of withFacts) {
            expect(front.facts.length, name).toBeLessThanOrEqual(4)
            for (const fact of front.facts) expect(Object.keys(fact).sort(), name).toEqual(entries)
        }
    })

    it('finds is_post: true in every sample post, the key structured data reads', () => {
        expect(posts.length).toBeGreaterThan(0)
        for (const { name, front } of posts) expect(front.is_post, name).toBe(true)
    })
})
