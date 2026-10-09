import fs from 'node:fs';
import zlib from 'node:zlib';

function createPng(width, height, getPixel) {
  // RGBA buffer with filter byte per row
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const chunkType = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.concat([chunkType, data]);
    const crc = crc32(crcBuf);
    const crcOut = Buffer.alloc(4);
    crcOut.writeUInt32BE(crc, 0);
    return Buffer.concat([len, chunkType, data, crcOut]);
  }

  // CRC32 table
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0);
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', deflated);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw a cool cyberpunk assassin icon
function renderPixel(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = (x - cx) / (w * 0.45);
  const dy = (y - cy) / (w * 0.45);
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background rounded rect / circular dark cyberpunk gradient
  if (Math.abs(dx) > 1.05 || Math.abs(dy) > 1.05) {
    return [0, 0, 0, 0];
  }

  // Base background: dark metallic cyan / slate
  let r = 11, g = 17, b = 28, a = 255;

  // Outer border glow
  const borderDist = Math.max(Math.abs(dx), Math.abs(dy));
  if (borderDist > 0.95 && borderDist <= 1.02) {
    return [0, 245, 212, 255]; // Neon cyan border
  }

  // Assassin hood triangle-like shape
  const hoodY = dy + 0.15;
  const hoodX = Math.abs(dx);
  if (hoodY > -0.7 && hoodY < 0.7 && hoodX < (0.65 - hoodY * 0.35)) {
    // Hood fill
    r = 18; g = 24; b = 38;
    
    // Visor neon red slit
    if (hoodY >= -0.05 && hoodY <= 0.12 && hoodX < 0.45) {
      // Glow
      r = 255; g = 10; b = 84;
      if (hoodY >= 0.0 && hoodY <= 0.08 && hoodX < 0.35) {
        r = 255; g = 255; b = 255; // White core laser slit
      }
    } else if (hoodY > 0.15 && hoodY < 0.45 && hoodX < 0.25) {
      // Mouth rebreather / cyber mask
      r = 30; g = 41; b = 59;
      if (Math.floor(y / 4) % 2 === 0) {
        r = 0; g = 245; b = 212; // Cyan vents
      }
    }
  }

  // Crossed blades or cyber accents
  if (Math.abs(dx - dy) < 0.05 && dist > 0.3 && dist < 0.85) {
    r = 0; g = 245; b = 212;
  }
  if (Math.abs(dx + dy) < 0.05 && dist > 0.3 && dist < 0.85) {
    r = 0; g = 245; b = 212;
  }

  return [r, g, b, a];
}

fs.mkdirSync('./public', { recursive: true });

fs.writeFileSync('./public/pwa-192x192.png', createPng(192, 192, renderPixel));
fs.writeFileSync('./public/pwa-512x512.png', createPng(512, 512, renderPixel));
fs.writeFileSync('./public/pwa-maskable-512x512.png', createPng(512, 512, renderPixel));
fs.writeFileSync('./public/apple-touch-icon.png', createPng(180, 180, renderPixel));
fs.writeFileSync('./public/favicon.ico', createPng(32, 32, renderPixel));

console.log('PNG icons created successfully!');
