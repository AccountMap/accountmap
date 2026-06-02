const circleTextureCache = new Map();

/**
 * Flat circle backing for 3D billboards (always faces camera via Sprite).
 */
export function getCircleTexture(THREE, { fill = '#ffffff', stroke = null } = {}) {
  const key = `${fill}|${stroke ?? ''}`;
  if (circleTextureCache.has(key)) return circleTextureCache.get(key);

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const r = size / 2 - 2;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 6;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  circleTextureCache.set(key, texture);
  return texture;
}

/**
 * Rasterize to canvas for WebGL (SVG-safe). Image must be same-origin or CORS-clean.
 */
export function createIconTexture(img, THREE) {
  const size = Math.max(
    img.naturalWidth || img.width || 64,
    img.naturalHeight || img.height || 64,
    64
  );
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const texture = new THREE.Texture(img);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(img, 0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
