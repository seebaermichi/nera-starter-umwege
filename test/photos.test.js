import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const imagesDir = path.join(root, 'theme/assets/images')
const credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf-8')

// The ten Unsplash originals of the theme-umwege fixture
// (nera-theme-umwege/test/site/theme/assets/images/). No other picture may ship.
const FIXTURE_PHOTOS = [
    'aleksandr-sali-uXJnf0DsCvk-unsplash.jpg',
    'athina-vrikki-qp_Rfa_mPS0-unsplash.jpg',
    'charly-nguyen-jm2XnB8hh5A-unsplash.jpg',
    'dubravko-palic-U5mct6wSxnc-unsplash.jpg',
    'hardial-aujla-0IZdJRSKvGI-unsplash.jpg',
    'jay-wennington-Y_aNcALhqZw-unsplash.jpg',
    'meric-dagli-uADXI1v10us-unsplash.jpg',
    'rowan-simpson-fmHjwMOVSGI-unsplash.jpg',
    'sam-power-1MIfdlsqcso-unsplash.jpg',
    'stefano-bazzoli-6bav58U0kIU-unsplash.jpg',
]

// The largest width in config/images.yaml; every picture's long edge (D5, D10).
const LONG_EDGE = 2400

// The originals, when the sibling theme repo is checked out (locally, not in CI).
const fixtureDir = path.resolve(root, '../nera-theme-umwege/test/site/theme/assets/images')
const hasFixture = fs.existsSync(fixtureDir)

const photos = fs.readdirSync(imagesDir).sort()
const metadata = Object.fromEntries(
    await Promise.all(photos.map(async (file) => [file, await sharp(path.join(imagesDir, file)).metadata()])),
)

describe('sample photographs', () => {
    it('are exactly the fixture\'s ten originals, under the same names', () => {
        expect(photos).toEqual(FIXTURE_PHOTOS)
    })

    it.each(FIXTURE_PHOTOS)('%s is a JPEG with a long edge of 2400 px', (file) => {
        const { format, width, height } = metadata[file]
        expect(format).toBe('jpeg')
        expect(Math.max(width, height)).toBe(LONG_EDGE)
    })

    it.each(FIXTURE_PHOTOS)('%s carries no EXIF, XMP, IPTC or ICC metadata', (file) => {
        const { exif, xmp, iptc, icc } = metadata[file]
        expect({ exif, xmp, iptc, icc }).toEqual({ exif: undefined, xmp: undefined, iptc: undefined, icc: undefined })
    })

    it.skipIf(!hasFixture).each(FIXTURE_PHOTOS)('%s keeps the aspect ratio of its original (uncropped)', async (file) => {
        const original = await sharp(path.join(fixtureDir, file)).metadata()
        const { width, height } = metadata[file]
        const scale = Math.max(width, height) / Math.max(original.width, original.height)
        expect(Math.abs(width - original.width * scale)).toBeLessThanOrEqual(1)
        expect(Math.abs(height - original.height * scale)).toBeLessThanOrEqual(1)
    })
})

describe('CREDITS.md', () => {
    const creditedFiles = [...credits.matchAll(/`theme\/assets\/images\/([^`]+)`/g)].map((match) => match[1]).sort()

    it('credits every photograph once, and nothing else', () => {
        expect(creditedFiles).toEqual(FIXTURE_PHOTOS)
    })

    it('links each photograph\'s Unsplash page by the id in its file name', () => {
        for (const file of FIXTURE_PHOTOS) {
            const id = file.replace(/-unsplash\.jpg$/, '').slice(-11)
            const row = credits.split('\n').find((line) => line.includes(`\`theme/assets/images/${file}\``))
            expect(row).toContain(`https://unsplash.com/photos/${id}`)
        }
    })

    it('names the Unsplash License and says the pictures are downscaled, not unmodified', () => {
        expect(credits).toContain('[Unsplash License](https://unsplash.com/license)')
        expect(credits).toContain('downscaled to a long edge of 2400 px')
        expect(credits).not.toMatch(/unmodified/i)
    })
})

// `nera new` copies no CREDITS.md into a site, so the README carries the credits too (D8).
describe('README.md', () => {
    const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf-8')

    it('links each photograph\'s Unsplash page and names the Unsplash License', () => {
        for (const file of FIXTURE_PHOTOS) {
            const id = file.replace(/-unsplash\.jpg$/, '').slice(-11)
            expect(readme, file).toContain(`https://unsplash.com/photos/${id}`)
        }
        expect(readme).toContain('[Unsplash License](https://unsplash.com/license)')
        expect(readme).toContain('`CREDITS.md`')
    })
})
