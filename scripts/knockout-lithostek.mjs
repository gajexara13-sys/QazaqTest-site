/**
 * Makes edge-connected near-white pixels transparent (removes white matte).
 * Interior white (e.g. "LT" inside the dark square) stays if enclosed by non-white.
 */
import sharp from 'sharp'
import { writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const inputPath = join(root, 'public', 'brands', 'lithostek-in.png')
const outputPath = join(root, 'public', 'brands', 'lithostek.png')

const WHITE = 248

function isWhiteish(r, g, b) {
  return r >= WHITE && g >= WHITE && b >= WHITE
}

const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width: w, height: h, channels } = info
if (channels !== 4) {
  throw new Error(`Expected RGBA, got ${channels} channels`)
}

const buf = Buffer.from(data)
const stride = 4
const visited = new Uint8Array(w * h)
const queue = []

function idx(x, y) {
  return (y * w + x) * stride
}

function tryEnqueue(x, y) {
  if (x < 0 || x >= w || y < 0 || y >= h) return
  const flat = y * w + x
  if (visited[flat]) return
  const p = idx(x, y)
  const r = buf[p]
  const g = buf[p + 1]
  const b = buf[p + 2]
  if (!isWhiteish(r, g, b)) return
  visited[flat] = 1
  buf[p + 3] = 0
  queue.push(x, y)
}

for (let x = 0; x < w; x++) {
  tryEnqueue(x, 0)
  tryEnqueue(x, h - 1)
}
for (let y = 0; y < h; y++) {
  tryEnqueue(0, y)
  tryEnqueue(w - 1, y)
}

let head = 0
while (head < queue.length) {
  const x = queue[head++]
  const y = queue[head++]
  tryEnqueue(x + 1, y)
  tryEnqueue(x - 1, y)
  tryEnqueue(x, y + 1)
  tryEnqueue(x, y - 1)
}

const out = await sharp(buf, { raw: { width: w, height: h, channels: 4 } })
  .png({ compressionLevel: 9, effort: 10 })
  .toBuffer()

writeFileSync(outputPath, out)
console.log('Wrote', outputPath)
