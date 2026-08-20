import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
])

const OUTPUTS = [
  { filename: 'pwa-192x192.png', size: 192, maskable: false },
  { filename: 'pwa-512x512.png', size: 512, maskable: false },
  { filename: 'pwa-maskable-512x512.png', size: 512, maskable: true },
  { filename: 'apple-touch-icon.png', size: 180, maskable: false },
]

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }
  return value >>> 0
})

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  const checksum = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])))
  return Buffer.concat([length, typeBuffer, data, checksum])
}

function fillRect(pixels, size, x, y, width, height) {
  const left = Math.max(0, Math.round(x))
  const top = Math.max(0, Math.round(y))
  const right = Math.min(size, Math.round(x + width))
  const bottom = Math.min(size, Math.round(y + height))

  for (let row = top; row < bottom; row += 1) {
    for (let column = left; column < right; column += 1) {
      const offset = (row * size + column) * 4
      pixels[offset] = 255
      pixels[offset + 1] = 255
      pixels[offset + 2] = 255
    }
  }
}

function drawBarbell(size, maskable) {
  const pixels = Buffer.alloc(size * size * 4)
  for (let offset = 3; offset < pixels.length; offset += 4) {
    pixels[offset] = 255
  }

  const margin = Math.round(size * (maskable ? 0.18 : 0.12))
  const center = size / 2
  const shaftHeight = Math.max(4, Math.round(size * 0.045))
  const gap = Math.max(2, Math.round(size * 0.025))
  const outerWidth = Math.max(6, Math.round(size * 0.06))
  const innerWidth = Math.max(5, Math.round(size * 0.045))
  const outerHeight = Math.round(size * 0.25)
  const innerHeight = Math.round(size * 0.36)

  const leftOuterX = margin
  const leftInnerX = leftOuterX + outerWidth + gap
  const rightOuterX = size - margin - outerWidth
  const rightInnerX = rightOuterX - gap - innerWidth

  fillRect(
    pixels,
    size,
    leftOuterX + outerWidth,
    center - shaftHeight / 2,
    rightOuterX - leftOuterX - outerWidth,
    shaftHeight,
  )
  fillRect(
    pixels,
    size,
    leftOuterX,
    center - outerHeight / 2,
    outerWidth,
    outerHeight,
  )
  fillRect(
    pixels,
    size,
    leftInnerX,
    center - innerHeight / 2,
    innerWidth,
    innerHeight,
  )
  fillRect(
    pixels,
    size,
    rightInnerX,
    center - innerHeight / 2,
    innerWidth,
    innerHeight,
  )
  fillRect(
    pixels,
    size,
    rightOuterX,
    center - outerHeight / 2,
    outerWidth,
    outerHeight,
  )

  return pixels
}

function encodePng(size, pixels) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8
  header[9] = 6
  header[10] = 0
  header[11] = 0
  header[12] = 0

  const stride = size * 4
  const scanlines = Buffer.alloc((stride + 1) * size)
  for (let row = 0; row < size; row += 1) {
    const scanlineOffset = row * (stride + 1)
    scanlines[scanlineOffset] = 0
    pixels.copy(scanlines, scanlineOffset + 1, row * stride, (row + 1) * stride)
  }

  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(scanlines, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)
const publicDirectory = path.join(repositoryRoot, 'public')
await mkdir(publicDirectory, { recursive: true })

for (const output of OUTPUTS) {
  const pixels = drawBarbell(output.size, output.maskable)
  const png = encodePng(output.size, pixels)
  await writeFile(path.join(publicDirectory, output.filename), png)
  console.log(`generated ${output.filename} (${output.size}x${output.size})`)
}
