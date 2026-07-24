// Applies the user's Appearance settings (accent color + font size) to the
// document at runtime, by writing CSS custom properties that tailwind.config.js
// and index.css read from. This is what makes the Settings page actually work —
// previously the picked values were only ever saved to the backend and never
// applied to the UI.

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number) {
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function shadeFromLightness(hex: string, deltaL: number) {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const nl = Math.min(0.95, Math.max(0.12, l + deltaL));
  const out = hslToRgb(h, s, nl);
  return `${out.r} ${out.g} ${out.b}`;
}

export const FONT_SCALES: Record<string, string> = { sm: '14px', md: '16px', lg: '18px' };

export function applyAppearance(settings?: { accentColor?: string; fontSize?: string }) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  const accent = settings?.accentColor || '#8b5cf6';
  root.style.setProperty('--accent-300', shadeFromLightness(accent, 0.2));
  root.style.setProperty('--accent-400', shadeFromLightness(accent, 0.1));
  root.style.setProperty('--accent-500', shadeFromLightness(accent, 0));
  root.style.setProperty('--accent-600', shadeFromLightness(accent, -0.1));

  const fontScale = FONT_SCALES[settings?.fontSize || 'md'] || FONT_SCALES.md;
  root.style.setProperty('--font-scale', fontScale);
}
