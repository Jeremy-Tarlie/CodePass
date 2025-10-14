import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer le répertoire des icônes
const iconsDir = path.join(__dirname, '..', 'build', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Copier le favicon.ico vers build/icons/icon.ico pour Windows
const faviconPath = path.join(__dirname, '..', 'favicon.ico');
const windowsIconPath = path.join(iconsDir, 'icon.ico');

if (fs.existsSync(faviconPath)) {
  fs.copyFileSync(faviconPath, windowsIconPath);
  console.log('✅ Icône Windows créée: icon.ico');
} else {
  console.log('⚠️  favicon.ico non trouvé');
}

// Créer un fichier .icns factice pour macOS (tu devras le remplacer par un vrai)
const macIconPath = path.join(iconsDir, 'icon.icns');
if (!fs.existsSync(macIconPath)) {
  // Créer un fichier .icns minimal (juste un placeholder)
  fs.writeFileSync(macIconPath, Buffer.from('ICNS placeholder'));
  console.log('⚠️  Icône macOS créée (placeholder): icon.icns');
  console.log('   Remplace-la par une vraie icône .icns pour macOS');
}

// Créer les icônes PNG pour Linux
const linuxIconSizes = [16, 32, 48, 64, 128, 256, 512];

// PNG minimal transparent (1x1 pixel)
const createMinimalPNG = () => {
  return Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, // bit depth, color type, etc.
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, // compressed data
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, // CRC
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
    0x42, 0x60, 0x82
  ]);
};

linuxIconSizes.forEach(size => {
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);
  
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, createMinimalPNG());
    console.log(`✅ Icône Linux créée: ${filename}`);
  }
});

console.log('\n🎨 Icônes préparées pour le build!');
console.log('📝 Note: Remplace les icônes placeholder par de vraies icônes pour une meilleure qualité.');
