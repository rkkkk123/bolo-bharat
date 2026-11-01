const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation for PNG chunks
function makeCRCTable() {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  return table;
}

const crcTable = makeCRCTable();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = crc32(typeAndData);
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function createPng(width, height) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // deflate compression
  ihdr[11] = 0; // standard filter
  ihdr[12] = 0; // no interlace

  const ihdrChunk = writeChunk('IHDR', ihdr);

  // Raw Scanlines: height rows, each: 1 byte filter (0) + width * 4 bytes RGBA
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.44;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // filter byte = None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        // Antialiased edge
        const edgeAlpha = Math.min(1, Math.max(0, radius - dist + 0.5));
        
        // Tricolor bands
        const normY = (y - (cy - radius)) / (radius * 2); // 0 (top) to 1 (bottom)

        let r = 255, g = 255, b = 255;
        if (normY < 0.36) {
          // Deep Saffron (#FF671F)
          r = 255;
          g = 103;
          b = 31;
        } else if (normY < 0.64) {
          // Luminous White (#FAF9F6) with subtle Navy center
          const centerDist = Math.sqrt(dx * dx + dy * dy) / radius;
          if (centerDist < 0.25) {
            // Navy center (#000080)
            r = 0;
            g = 0;
            b = 128;
          } else {
            r = 250;
            g = 249;
            b = 246;
          }
        } else {
          // India Green (#046A38)
          r = 4;
          g = 106;
          b = 56;
        }

        // Specular 3D highlight (top-left)
        const highlightDist = Math.sqrt((x - (cx - radius * 0.3)) ** 2 + (y - (cy - radius * 0.3)) ** 2);
        if (highlightDist < radius * 0.5) {
          const spec = (1 - highlightDist / (radius * 0.5)) * 0.5;
          r = Math.min(255, r + 255 * spec);
          g = Math.min(255, g + 255 * spec);
          b = Math.min(255, b + 255 * spec);
        }

        rawData[pixelOffset] = Math.round(r);
        rawData[pixelOffset + 1] = Math.round(g);
        rawData[pixelOffset + 2] = Math.round(b);
        rawData[pixelOffset + 3] = Math.round(255 * edgeAlpha);
      } else if (dist <= radius * 1.15) {
        // Soft outer glowing rim
        const glowFactor = (1 - (dist - radius) / (radius * 0.15)) * 0.35;
        rawData[pixelOffset] = 255;
        rawData[pixelOffset + 1] = 120;
        rawData[pixelOffset + 2] = 50;
        rawData[pixelOffset + 3] = Math.round(255 * glowFactor);
      } else {
        // Fully transparent background
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = writeChunk('IDAT', compressedData);
  const iendChunk = writeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate 192x192 icon
const icon192 = createPng(192, 192);
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), icon192);
console.log('Created public/icons/icon-192.png');

// Generate 512x512 icon
const icon512 = createPng(512, 512);
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), icon512);
console.log('Created public/icons/icon-512.png');

// Generate apple-touch-icon.png
fs.writeFileSync(path.join(__dirname, '..', 'public', 'apple-touch-icon.png'), icon192);
console.log('Created public/apple-touch-icon.png');
