const MAX_W = 480;
const MAX_H = 270;
const JPEG_QUALITY = 0.72;

/**
 * Take a JPEG snapshot of the R3F canvas, resized to fit within MAX_W × MAX_H,
 * and return it as a data URL. Returns null if no canvas is mounted or the
 * browser refuses to read pixels.
 *
 * The Canvas must be initialised with `gl={{ preserveDrawingBuffer: true }}`
 * so the framebuffer survives long enough to be sampled.
 */
export function captureViewport(): string | null {
  const canvas = document.querySelector<HTMLCanvasElement>("canvas");
  if (!canvas || canvas.width === 0 || canvas.height === 0) return null;

  const ratio = canvas.width / canvas.height;
  let w = MAX_W;
  let h = MAX_W / ratio;
  if (h > MAX_H) {
    h = MAX_H;
    w = MAX_H * ratio;
  }

  const off = document.createElement("canvas");
  off.width = Math.round(w);
  off.height = Math.round(h);
  const ctx = off.getContext("2d");
  if (!ctx) return null;
  // Solid background so transparent canvases don't become 0-byte JPEGs.
  ctx.fillStyle = "#0b1120";
  ctx.fillRect(0, 0, off.width, off.height);
  try {
    ctx.drawImage(canvas, 0, 0, off.width, off.height);
    return off.toDataURL("image/jpeg", JPEG_QUALITY);
  } catch {
    return null;
  }
}
