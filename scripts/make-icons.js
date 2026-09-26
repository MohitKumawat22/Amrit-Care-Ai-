const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Minimal PNG encoder
function createPNG(width, height, getPixel) {
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = createChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    for (let j = 0; j < 8; j++) {
      let bit = (crc ^ byte) & 1;
      crc = (crc >>> 1) ^ (bit ? 0xedb88320 : 0);
      byte = byte >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  chunk.writeUInt32BE(crc32(typeAndData), 8 + len);
  return chunk;
}

// Draw teal rounded icon with white cross & cardiogram pulse
function getIconPixel(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;
  const cx = 0.5;
  const cy = 0.5;

  // Corner radius
  const r = 0.22;
  const dx = Math.max(0, Math.abs(nx - cx) - (0.5 - r));
  const dy = Math.max(0, Math.abs(ny - cy) - (0.5 - r));
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > r) {
    return [0, 0, 0, 0]; // Transparent outside
  }

  // Teal gradient background (#14b8a6 -> #0f766e)
  const gradT = (nx + ny) / 2;
  let bgR = Math.round(20 * (1 - gradT) + 15 * gradT);
  let bgG = Math.round(184 * (1 - gradT) + 118 * gradT);
  let bgB = Math.round(166 * (1 - gradT) + 110 * gradT);

  // Cardiogram line points:
  // (0.18, 0.5) -> (0.33, 0.5) -> (0.39, 0.36) -> (0.47, 0.64) -> (0.54, 0.44) -> (0.59, 0.53) -> (0.63, 0.5) -> (0.82, 0.5)
  const segments = [
    [[0.18, 0.5], [0.33, 0.5]],
    [[0.33, 0.5], [0.39, 0.36]],
    [[0.39, 0.36], [0.47, 0.64]],
    [[0.47, 0.64], [0.54, 0.44]],
    [[0.54, 0.44], [0.59, 0.53]],
    [[0.59, 0.53], [0.63, 0.5]],
    [[0.63, 0.5], [0.82, 0.5]],
  ];

  function distToSegment(px, py, [x1, y1], [x2, y2]) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
  }

  let minDist = 1.0;
  for (const seg of segments) {
    const d = distToSegment(nx, ny, seg[0], seg[1]);
    if (d < minDist) minDist = d;
  }

  const lineWidth = 0.026;
  if (minDist <= lineWidth) {
    const alpha = Math.min(1, (lineWidth - minDist) / (lineWidth * 0.25) + 0.5);
    return [
      Math.round(255 * alpha + bgR * (1 - alpha)),
      Math.round(255 * alpha + bgG * (1 - alpha)),
      Math.round(255 * alpha + bgB * (1 - alpha)),
      255,
    ];
  }

  // Accent circles at peak and valley
  const dPeak = Math.sqrt((nx - 0.47) ** 2 + (ny - 0.64) ** 2);
  const dValley = Math.sqrt((nx - 0.39) ** 2 + (ny - 0.36) ** 2);
  if (dPeak <= 0.028 || dValley <= 0.024) {
    return [45, 212, 191, 255]; // #2dd4bf accent
  }

  return [bgR, bgG, bgB, 255];
}

const publicDir = path.join(__dirname, '..', 'my-app', 'public');

const icon192 = createPNG(192, 192, getIconPixel);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192);

const icon512 = createPNG(512, 512, getIconPixel);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), icon512);

const appleIcon = createPNG(180, 180, getIconPixel);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);

console.log('✅ Generated icon-192.png, icon-512.png, and apple-touch-icon.png in public/');
