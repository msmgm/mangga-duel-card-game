import { cpSync, existsSync, mkdirSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
console.log(`[Build] Starting Mangga Duel build to output dir: ${outputDir}`);

// Ensure output directory exists
mkdirSync(outputDir, { recursive: true });

// Copy game/ directory
const srcGame = join(here, 'game');
const destGame = join(outputDir, 'game');
if (!existsSync(srcGame)) {
  console.error(`[Build Error] game/ directory not found at ${srcGame}`);
  process.exit(1);
}
console.log(`[Build] Copying game/ to ${destGame}`);
cpSync(srcGame, destGame, { recursive: true });

// Revision Edit 1: Collect and log file stats for game files
const countGameFiles = (dir) => {
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) count += countGameFiles(full);
    else count++;
  }
  return count;
};
const totalGameFiles = countGameFiles(destGame);
console.log(`[Build Stats] Total game files copied: ${totalGameFiles}`);

// Validate screenshots exist and fail loudly
const srcScreenshots = join(here, 'screenshots');
const destScreenshots = join(outputDir, 'screenshots');
if (!existsSync(srcScreenshots)) {
  console.error(`[Build Error] screenshots/ directory not found at ${srcScreenshots}. Screenshots must be captured before final build dossier generation.`);
  process.exit(1);
}

const screenshotFiles = readdirSync(srcScreenshots).filter(f => /\.(png|jpg|jpeg)$/i.test(f));
if (screenshotFiles.length === 0) {
  console.error(`[Build Error] No screenshot images found in ${srcScreenshots}. Fail loudly.`);
  process.exit(1);
}

console.log(`[Build] Copying ${screenshotFiles.length} screenshots from ${srcScreenshots} to ${destScreenshots}`);
mkdirSync(destScreenshots, { recursive: true });
cpSync(srcScreenshots, destScreenshots, { recursive: true });

// Guard the dossier write and build dossier
console.log('[Build] Building dossier...');
try {
  // Revision Edit 2: Verify Node major version and output integrity
  const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);
  if (nodeMajor < 22) {
    console.warn(`[Build Warning] Recommended Node version is 22+, running on Node ${process.versions.node}`);
  }

  const dossierBytes = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000
  });

  if (!dossierBytes || dossierBytes.length === 0) {
    throw new Error('Generated dossier is empty.');
  }

  const dossierPath = join(outputDir, 'dossier.json');
  writeFileSync(dossierPath, dossierBytes);
  console.log(`[Build] Successfully wrote dossier.json (${dossierBytes.length} bytes) to ${dossierPath}`);
} catch (err) {
  console.error('[Build Error] Failed to build dossier:', err);
  process.exit(1);
}
