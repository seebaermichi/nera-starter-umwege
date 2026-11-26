#!/usr/bin/env node
// Writes the starter's sample photographs: the ten Unsplash originals of the
// theme-umwege fixture, downscaled to a long edge of 2400 px (the largest width
// in config/images.yaml), metadata stripped, same file names.
//
//   node scripts/downscale-photos.js [<source dir>]
//
// The source defaults to the sibling checkout ../nera-theme-umwege. The script
// is not in the package's `files`, so no site receives it; rerunning it
// reproduces theme/assets/images/. The credits are in CREDITS.md.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const LONG_EDGE = 2400
const QUALITY = 82

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const defaultSource = path.resolve(root, '../nera-theme-umwege/test/site/theme/assets/images')
const target = path.join(root, 'theme/assets/images')

const source = path.resolve(process.argv[2] || defaultSource)
const files = fs.readdirSync(source).filter((file) => file.endsWith('-unsplash.jpg')).sort()

if (files.length !== 10) {
    console.error(`Expected the ten Unsplash originals in ${source}, found ${files.length}.`)
    process.exit(1)
}

fs.mkdirSync(target, { recursive: true })

let total = 0
for (const file of files) {
    // mozjpeg: about a fifth smaller than libjpeg at the same quality setting.
    // sharp writes no EXIF, XMP or ICC data unless asked to (withMetadata/keepExif).
    // fit 'inside' with both edges at 2400 scales the longer edge to 2400; a portrait
    // original therefore ends up 1600 px wide (decision D10).
    const info = await sharp(path.join(source, file))
        .rotate()
        .resize(LONG_EDGE, LONG_EDGE, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toFile(path.join(target, file))
    total += info.size
    console.log(`${file}  ${info.width}×${info.height}  ${(info.size / 1024).toFixed(0)} kB`)
}

console.log(`${files.length} files, ${(total / 1024 / 1024).toFixed(2)} MB in ${path.relative(root, target)}/`)
