/**
 * Generates minimal valid PNG icon files for the SmokeBuddy PWA
 * using only Node.js built-in modules (no dependencies).
 *
 * Produces a dark-background PNG with the fire emoji rendered via
 * an off-screen SVG → sharp or pngjs, falling back to a pure-JS
 * PNG writer that creates solid-color placeholders.
 */

import { createWriteStream } from 'fs'
import { mkdir } from 'fs/promises'
import { createHash } from 'crypto'
import { deflateSync } from 'zlib'

const OUT_DIR = new URL('../public/icons/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')

await mkdir(OUT_DIR, { recursive: true })

// PNG spec: 8-byte signature + chunks (length, type, data, crc32)
function crc32(buf) {
  let crc = 0xffffffff
  const table = crc32.table ??= (() => {
    const t = new Uint32Array(256)
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let j = 0; j < 8; j++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[i] = c
    }
    return t
  })()
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcBuf = Buffer.concat([typeBytes, data])
  const crcBytes = Buffer.alloc(4)
  crcBytes.writeUInt32BE(crc32(crcBuf))
  return Buffer.concat([len, typeBytes, data, crcBytes])
}

function makePNG(size, r, g, b) {
  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)   // width
  ihdr.writeUInt32BE(size, 4)   // height
  ihdr[8] = 8   // bit depth
  ihdr[9] = 2   // color type = RGB
  // compression, filter, interlace = 0

  // IDAT: raw scanlines with filter byte 0x00 (None)
  const row = Buffer.alloc(1 + size * 3)
  row[0] = 0   // filter byte
  for (let x = 0; x < size; x++) {
    row[1 + x * 3] = r
    row[2 + x * 3] = g
    row[3 + x * 3] = b
  }
  const raw = Buffer.concat(Array.from({ length: size }, () => row))
  const compressed = deflateSync(raw, { level: 9 })

  return Buffer.concat([
    PNG_SIG,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// Background color: #18181b (zinc-900)
const R = 0x18, G = 0x18, B = 0x1b

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-maskable-512.png', size: 512 },
]

for (const { name, size } of sizes) {
  const buf = makePNG(size, R, G, B)
  const path = OUT_DIR + name
  const ws = createWriteStream(path)
  ws.write(buf)
  ws.end()
  console.log(`✓ ${name} (${size}×${size}, ${buf.length} bytes)`)
}

console.log('Icons generated. Replace with branded versions when ready.')
