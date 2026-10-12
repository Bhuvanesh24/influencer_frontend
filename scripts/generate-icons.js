/**
 * Regenerates the app's icon/splash PNG assets from the SVG marks below. Re-run with
 * `node scripts/generate-icons.js` whenever the brand mark changes — there's no watch mode,
 * this is a one-shot asset build step, not part of the app runtime (sharp is devDependency-only).
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, '..', 'assets', 'images');
const BRAND = '#5B4FE8';
const BRAND_LIGHT = '#8A7FFF';

// Symbol: a magnifying glass (Find) with two overlapping dots in its lens (Collab — two parties
// connecting). White, drawn on a transparent canvas so it can be composited onto any background.
function symbolSvg({ stroke = '#FFFFFF', dotA = '#FFFFFF', dotB = BRAND_LIGHT, size = 1024 }) {
  return `
<svg width="${size}" height="${size}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <circle cx="440" cy="440" r="230" fill="none" stroke="${stroke}" stroke-width="56"/>
  <line x1="610" y1="610" x2="820" y2="820" stroke="${stroke}" stroke-width="64" stroke-linecap="round"/>
  <circle cx="390" cy="440" r="70" fill="${dotA}"/>
  <circle cx="500" cy="440" r="70" fill="${dotB}"/>
</svg>`;
}

// Flat badge: brand-purple rounded square + the white symbol — self-contained, reads well on
// both light and dark backgrounds without needing per-theme variants (used for the splash image).
function badgeSvg(size = 1024) {
  return `
<svg width="${size}" height="${size}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" rx="224" fill="${BRAND}"/>
  ${symbolInner()}
</svg>`;
}

function symbolInner() {
  return `
  <circle cx="440" cy="440" r="230" fill="none" stroke="#FFFFFF" stroke-width="56"/>
  <line x1="610" y1="610" x2="820" y2="820" stroke="#FFFFFF" stroke-width="64" stroke-linecap="round"/>
  <circle cx="390" cy="440" r="70" fill="#FFFFFF"/>
  <circle cx="500" cy="440" r="70" fill="${BRAND_LIGHT}"/>`;
}

async function png(svg, size, outFile) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(OUT, outFile));
  console.log('wrote', outFile, `${size}x${size}`);
}

async function main() {
  // Primary flat icon (iOS fallback, Play Store, generic) — full-bleed badge, OS applies its own mask.
  await png(badgeSvg(), 1024, 'icon.png');

  // Splash image — self-contained badge so it looks right on both light/dark splash backgrounds.
  await png(badgeSvg(), 300, 'splash-icon.png');

  // Web favicon (low priority — web isn't a target platform, see CLAUDE.md).
  await png(badgeSvg(), 48, 'favicon.png');

  // Android adaptive icon: foreground = symbol only on transparent, scaled into the ~66% safe
  // zone the OS mask respects; background = solid brand fill; monochrome = single-color (white)
  // silhouette for Android 13+ themed icons.
  const fg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(130,130) scale(0.745)">${symbolInner()}</g>
</svg>`;
  await png(fg, 1024, 'android-icon-foreground.png');

  const bg = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg"><rect width="1024" height="1024" fill="${BRAND}"/></svg>`;
  await png(bg, 1024, 'android-icon-background.png');

  const mono = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(130,130) scale(0.745)">${symbolSvg({ stroke: '#FFFFFF', dotA: '#FFFFFF', dotB: '#FFFFFF' })
    .replace(/<svg[^>]*>/, '')
    .replace('</svg>', '')}</g>
</svg>`;
  await png(mono, 1024, 'android-icon-monochrome.png');

  // iOS 18+ Icon Composer bundle — swap the symbol layer, keep the composer's own
  // shadow/translucency/gradient-fill handling (it recolors automatically per iOS appearance).
  const iconComposerDir = path.join(__dirname, '..', 'assets', 'expo.icon', 'Assets');
  fs.writeFileSync(path.join(iconComposerDir, 'expo-symbol 2.svg'), symbolSvg({ stroke: '#FFFFFF', dotA: '#FFFFFF', dotB: BRAND_LIGHT, size: 1024 }).trim());
  console.log('wrote expo.icon symbol layer');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
