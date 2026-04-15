/**
 * Download/generate sign images for quiz questions
 * Sources: Wikimedia Commons (ISO 7010, public domain) + generated SVGs
 */
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const OUT = join(import.meta.dirname, "..", "public", "images", "signs");
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

// ── Wikimedia Commons ISO 7010 sign mappings ──
// These are official international safety signs, public domain
const WIKIMEDIA_SIGNS = {
  no_smoking: "ISO_7010_P002.svg",
  no_open_flames: "ISO_7010_P003.svg",
  no_entry: "ISO_7010_P004.svg",
  no_photography: "ISO_7010_P029.svg",
  no_eating_drinking: "ISO_7010_P022.svg",
  no_mobile_phones: "ISO_7010_P010.svg",
  danger_electricity: "ISO_7010_W012.svg",
  general_warning: "ISO_7010_W001.svg",
  wear_helmet: "ISO_7010_M014.svg",
  face_mask: "ISO_7010_M016.svg",
  emergency_exit: "ISO_7010_E001.svg",
  first_aid: "ISO_7010_E003.svg",
};

async function downloadFromWikimedia(filename, outName) {
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json`;
  try {
    const resp = await fetch(apiUrl);
    const data = await resp.json();
    const pages = data.query.pages;
    const page = Object.values(pages)[0];
    if (page.imageinfo) {
      const url = page.imageinfo[0].url;
      console.log(`  Downloading ${outName} from ${url.substring(0, 80)}...`);
      const imgResp = await fetch(url);
      const buffer = Buffer.from(await imgResp.arrayBuffer());
      writeFileSync(join(OUT, outName), buffer);
      return true;
    }
  } catch (e) {
    console.log(`  Failed to download ${filename}: ${e.message}`);
  }
  return false;
}

// ── SVG Generator for signs not on Wikimedia ──

function generateProhibitionSVG(text, iconPath) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="2" dy="4" stdDeviation="6" flood-opacity="0.2"/>
    </filter>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f0f0f0"/>
    </linearGradient>
  </defs>
  <circle cx="200" cy="185" r="160" fill="url(#bg)" stroke="#cc0000" stroke-width="22" filter="url(#shadow)"/>
  ${iconPath}
  <line x1="87" y1="298" x2="313" y2="72" stroke="#cc0000" stroke-width="20" stroke-linecap="round"/>
  <text x="200" y="380" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="24" fill="#333">${text}</text>
</svg>`;
}

function generateWarningSVG(text, iconPath) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 420" width="400" height="420">
  <defs>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="2" dy="4" stdDeviation="6" flood-opacity="0.2"/>
    </filter>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffd700"/>
      <stop offset="100%" stop-color="#f0c000"/>
    </linearGradient>
  </defs>
  <polygon points="200,20 380,340 20,340" fill="url(#bg)" stroke="#333" stroke-width="14" stroke-linejoin="round" filter="url(#shadow)"/>
  ${iconPath}
  <text x="200" y="400" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="22" fill="#333">${text}</text>
</svg>`;
}

function generateMandatorySVG(text, iconPath) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="2" dy="4" stdDeviation="6" flood-opacity="0.2"/>
    </filter>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
  </defs>
  <circle cx="200" cy="185" r="160" fill="url(#bg)" stroke="#1e40af" stroke-width="8" filter="url(#shadow)"/>
  ${iconPath}
  <text x="200" y="380" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="22" fill="#333">${text}</text>
</svg>`;
}

function generateInfoSVG(text, iconPath, bgColor = "#059669") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 320" width="440" height="320">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="2" dy="4" stdDeviation="6" flood-opacity="0.2"/>
    </filter>
  </defs>
  <rect x="20" y="20" width="400" height="240" rx="16" fill="${bgColor}" stroke="#047857" stroke-width="4" filter="url(#shadow)"/>
  ${iconPath}
  <text x="220" y="300" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="22" fill="#333">${text}</text>
</svg>`;
}

function generateNoticeSVG(text, subtext = "", bgColor = "#ffffff") {
  const lines = text.split("\\n");
  const textY = subtext ? 110 : 130;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 300" width="440" height="300">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="2" dy="4" stdDeviation="8" flood-opacity="0.15"/>
    </filter>
  </defs>
  <rect x="20" y="20" width="400" height="220" rx="12" fill="${bgColor}" stroke="#94a3b8" stroke-width="3" filter="url(#shadow)"/>
  <rect x="20" y="20" width="400" height="50" rx="12" fill="#334155"/>
  <rect x="20" y="55" width="400" height="15" fill="#334155"/>
  ${lines.map((l, i) => `<text x="220" y="${textY + i * 36}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="30" fill="#1e293b">${l}</text>`).join("\n  ")}
  ${subtext ? `<text x="220" y="${textY + lines.length * 36 + 10}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="18" fill="#64748b">${subtext}</text>` : ""}
  <text x="220" y="280" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="20" fill="#333">${text.replace("\\n", " ")}</text>
</svg>`;
}

function generateDangerSVG(text, iconPath) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 320" width="440" height="320">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="2" dy="4" stdDeviation="6" flood-opacity="0.2"/>
    </filter>
  </defs>
  <rect x="20" y="20" width="400" height="240" rx="12" fill="#fef2f2" stroke="#dc2626" stroke-width="6" filter="url(#shadow)"/>
  <rect x="20" y="20" width="400" height="55" rx="12" fill="#dc2626"/>
  <rect x="20" y="60" width="400" height="15" fill="#dc2626"/>
  <text x="220" y="58" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="28" fill="white">⚠ DANGER</text>
  ${iconPath}
  <text x="220" y="300" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="22" fill="#333">${text}</text>
</svg>`;
}

// ── Icon paths for generated signs ──
const ICONS = {
  cigarette: `<g transform="translate(155,120) scale(1.8)" fill="none" stroke="#333" stroke-width="5" stroke-linecap="round">
    <rect x="5" y="15" width="40" height="8" rx="2" fill="#a3a3a3" stroke="none"/>
    <rect x="38" y="10" width="7" height="18" rx="1" fill="#d97706" stroke="none"/>
    <path d="M42 10 C42 0, 50 0, 50 10" stroke="#9ca3af" fill="none" stroke-width="3"/>
  </g>`,
  swimming: `<g transform="translate(130,100) scale(3)" fill="#333">
    <circle cx="22" cy="8" r="5"/>
    <path d="M5 25 C10 20 15 30 20 25 C25 20 30 30 35 25 C40 20 45 30 45 25" stroke="#333" fill="none" stroke-width="3" stroke-linecap="round"/>
    <path d="M10 22 L18 15 L28 18 L35 12" stroke="#333" fill="none" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`,
  climbing: `<g transform="translate(145,95) scale(2.8)" fill="#333">
    <circle cx="20" cy="8" r="5"/>
    <line x1="20" y1="13" x2="20" y2="32" stroke="#333" stroke-width="4" stroke-linecap="round"/>
    <line x1="20" y1="18" x2="8" y2="28" stroke="#333" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="20" y1="18" x2="33" y2="12" stroke="#333" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="20" y1="32" x2="12" y2="44" stroke="#333" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="20" y1="32" x2="30" y2="44" stroke="#333" stroke-width="3.5" stroke-linecap="round"/>
    <rect x="32" y="5" width="6" height="45" rx="2" fill="#666"/>
  </g>`,
  wifi: `<g transform="translate(140,60)">
    <path d="M80 50 C80 50, 110 20, 140 50" stroke="white" fill="none" stroke-width="12" stroke-linecap="round"/>
    <path d="M60 30 C60 30, 110 -10, 160 30" stroke="white" fill="none" stroke-width="12" stroke-linecap="round"/>
    <path d="M40 10 C40 10, 110 -45, 180 10" stroke="white" fill="none" stroke-width="12" stroke-linecap="round"/>
    <circle cx="110" cy="75" r="10" fill="white"/>
  </g>`,
  camera: `<g transform="translate(135,100) scale(2.5)">
    <rect x="5" y="12" width="40" height="28" rx="4" fill="none" stroke="#333" stroke-width="4"/>
    <circle cx="25" cy="26" r="8" fill="none" stroke="#333" stroke-width="3.5"/>
    <rect x="15" y="7" width="20" height="8" rx="2" fill="none" stroke="#333" stroke-width="3"/>
  </g>`,
  flash: `<g transform="translate(160,100) scale(3)">
    <polygon points="15,0 5,18 13,18 8,32 25,12 16,12 22,0" fill="#333"/>
  </g>`,
  food: `<g transform="translate(130,95) scale(2.5)">
    <circle cx="25" cy="25" r="18" fill="none" stroke="#333" stroke-width="3"/>
    <line x1="25" y1="3" x2="25" y2="47" stroke="#333" stroke-width="3"/>
    <path d="M15 10 L15 25 Q15 30 20 30" stroke="#333" fill="none" stroke-width="2.5"/>
    <path d="M35 10 L35 25 Q35 30 30 30" stroke="#333" fill="none" stroke-width="2.5"/>
    <rect x="23" y="25" width="4" height="22" rx="2" fill="#333"/>
  </g>`,
  animal: `<g transform="translate(140,100) scale(2.5)">
    <path d="M10 35 Q10 15 25 12 Q40 15 40 35 Z" fill="none" stroke="#333" stroke-width="3"/>
    <circle cx="19" cy="24" r="2.5" fill="#333"/>
    <circle cx="31" cy="24" r="2.5" fill="#333"/>
    <ellipse cx="25" cy="30" rx="5" ry="3" fill="none" stroke="#333" stroke-width="2"/>
    <path d="M10 18 L5 8" stroke="#333" stroke-width="3" stroke-linecap="round"/>
    <path d="M40 18 L45 8" stroke="#333" stroke-width="3" stroke-linecap="round"/>
  </g>`,
  trash: `<g transform="translate(150,100) scale(2.8)">
    <rect x="7" y="10" width="26" height="30" rx="2" fill="none" stroke="#333" stroke-width="3"/>
    <rect x="3" y="6" width="34" height="6" rx="2" fill="none" stroke="#333" stroke-width="3"/>
    <line x1="15" y1="16" x2="15" y2="34" stroke="#333" stroke-width="2.5"/>
    <line x1="25" y1="16" x2="25" y2="34" stroke="#333" stroke-width="2.5"/>
    <rect x="14" y="2" width="12" height="6" rx="2" fill="none" stroke="#333" stroke-width="2.5"/>
  </g>`,
  elderly: `<g transform="translate(150,80) scale(2.8)" fill="#333">
    <circle cx="18" cy="8" r="5.5"/>
    <path d="M18 14 L18 30 L12 42" stroke="#333" fill="none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18 30 L26 42" stroke="#333" fill="none" stroke-width="4" stroke-linecap="round"/>
    <path d="M18 20 L8 28 L4 26" stroke="#333" fill="none" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="8" y1="28" x2="8" y2="45" stroke="#333" stroke-width="3" stroke-linecap="round"/>
  </g>`,
  rocks: `<g transform="translate(130,80) scale(2.2)">
    <polygon points="35,10 15,45 55,45" fill="#666" stroke="#333" stroke-width="3" stroke-linejoin="round"/>
    <polygon points="55,25 40,55 70,55" fill="#888" stroke="#333" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="30" cy="20" r="6" fill="#555" stroke="#333" stroke-width="2"/>
    <circle cx="45" cy="15" r="4" fill="#777" stroke="#333" stroke-width="2"/>
    <path d="M28 22 L25 35" stroke="#333" stroke-width="2" stroke-dasharray="3,3"/>
    <path d="M43 17 L48 30" stroke="#333" stroke-width="2" stroke-dasharray="3,3"/>
  </g>`,
  lightbulb: `<g transform="translate(155,90) scale(3)">
    <path d="M15 0 C4 0 0 8 0 15 C0 22 8 25 8 30 L22 30 C22 25 30 22 30 15 C30 8 26 0 15 0Z" fill="white" stroke="white" stroke-width="4"/>
    <line x1="8" y1="33" x2="22" y2="33" stroke="white" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="9" y1="36" x2="21" y2="36" stroke="white" stroke-width="3" stroke-linecap="round"/>
    <line x1="15" y1="16" x2="15" y2="25" stroke="#1d4ed8" stroke-width="2.5"/>
    <line x1="10" y1="20" x2="15" y2="16" stroke="#1d4ed8" stroke-width="2.5"/>
    <line x1="20" y1="20" x2="15" y2="16" stroke="#1d4ed8" stroke-width="2.5"/>
  </g>`,
  seatbelt: `<g transform="translate(145,80) scale(2.8)">
    <circle cx="20" cy="8" r="6" fill="white"/>
    <path d="M10 16 L10 38 L30 38 L30 16" stroke="white" fill="none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="20" y1="16" x2="20" y2="38" stroke="white" stroke-width="4" stroke-linecap="round"/>
    <path d="M8 24 L20 38" stroke="#fbbf24" stroke-width="4" stroke-linecap="round"/>
    <circle cx="20" cy="34" r="3" fill="#fbbf24" stroke="white" stroke-width="1.5"/>
  </g>`,
  helmet: `<g transform="translate(148,85) scale(3)">
    <path d="M5 22 C5 8 30 -2 35 22" fill="white" stroke="white" stroke-width="3"/>
    <line x1="3" y1="23" x2="37" y2="23" stroke="white" stroke-width="4" stroke-linecap="round"/>
    <circle cx="20" cy="15" r="4" fill="#1d4ed8"/>
  </g>`,
  mask: `<g transform="translate(140,90) scale(3)">
    <path d="M2 12 C2 5 20 0 20 0 C20 0 38 5 38 12 L38 20 C38 28 20 32 20 32 C20 32 2 28 2 20 Z" fill="white" stroke="white" stroke-width="2"/>
    <line x1="8" y1="14" x2="32" y2="14" stroke="#1d4ed8" stroke-width="2"/>
    <line x1="8" y1="19" x2="32" y2="19" stroke="#1d4ed8" stroke-width="2"/>
  </g>`,
  scissors: `<g transform="translate(145,100) scale(2.8)">
    <circle cx="10" cy="32" r="6" fill="none" stroke="#333" stroke-width="3"/>
    <circle cx="30" cy="32" r="6" fill="none" stroke="#333" stroke-width="3"/>
    <line x1="14" y1="28" x2="28" y2="5" stroke="#333" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="26" y1="28" x2="12" y2="5" stroke="#333" stroke-width="3.5" stroke-linecap="round"/>
  </g>`,
  tree: `<g transform="translate(150,80) scale(2.5)">
    <polygon points="20,2 5,25 12,25 2,40 38,40 28,25 35,25" fill="#333"/>
    <rect x="16" y="40" width="8" height="10" fill="#333"/>
  </g>`,
  tent: `<g transform="translate(140,95) scale(2.8)">
    <polygon points="20,5 2,40 38,40" fill="none" stroke="#333" stroke-width="3.5" stroke-linejoin="round"/>
    <line x1="20" y1="5" x2="20" y2="40" stroke="#333" stroke-width="2.5"/>
    <path d="M14 40 L20 28 L26 40" fill="none" stroke="#333" stroke-width="2.5"/>
  </g>`,
  car: `<g transform="translate(130,110) scale(2.8)">
    <path d="M8 18 L12 8 L32 8 L36 18" fill="none" stroke="#333" stroke-width="3" stroke-linejoin="round"/>
    <rect x="4" y="18" width="36" height="14" rx="3" fill="none" stroke="#333" stroke-width="3"/>
    <circle cx="14" cy="34" r="4" fill="none" stroke="#333" stroke-width="3"/>
    <circle cx="30" cy="34" r="4" fill="none" stroke="#333" stroke-width="3"/>
  </g>`,
  uturn: `<g transform="translate(140,90) scale(3)">
    <path d="M10 35 L10 15 C10 5 25 5 25 15 L25 35" fill="none" stroke="#333" stroke-width="5" stroke-linecap="round"/>
    <polygon points="25,30 18,22 32,22" fill="#333"/>
  </g>`,
  bike: `<g transform="translate(135,100) scale(2.5)">
    <circle cx="12" cy="30" r="9" fill="none" stroke="#333" stroke-width="3"/>
    <circle cx="38" cy="30" r="9" fill="none" stroke="#333" stroke-width="3"/>
    <path d="M12 30 L22 15 L32 15 L38 30" fill="none" stroke="#333" stroke-width="3" stroke-linejoin="round"/>
    <line x1="22" y1="15" x2="28" y2="30" stroke="#333" stroke-width="3"/>
    <circle cx="25" cy="10" r="4" fill="#333"/>
  </g>`,
  flower: `<g transform="translate(155,100) scale(2.8)">
    <circle cx="20" cy="15" r="4" fill="#333"/>
    <circle cx="14" cy="9" r="4" fill="#333" opacity="0.7"/>
    <circle cx="26" cy="9" r="4" fill="#333" opacity="0.7"/>
    <circle cx="14" cy="21" r="4" fill="#333" opacity="0.7"/>
    <circle cx="26" cy="21" r="4" fill="#333" opacity="0.7"/>
    <line x1="20" y1="20" x2="20" y2="42" stroke="#333" stroke-width="3"/>
    <path d="M20 30 L14 25" stroke="#333" stroke-width="2.5"/>
    <path d="M20 35 L27 30" stroke="#333" stroke-width="2.5"/>
  </g>`,
  door: `<g transform="translate(145,75) scale(2.5)">
    <rect x="5" y="5" width="25" height="45" rx="2" fill="none" stroke="#333" stroke-width="3"/>
    <circle cx="24" cy="28" r="3" fill="#333"/>
    <path d="M30 5 L42 15 L42 50 L30 50" fill="none" stroke="#333" stroke-width="2.5" stroke-dasharray="4,3"/>
  </g>`,
  window: `<g transform="translate(135,90) scale(2.8)">
    <rect x="5" y="5" width="30" height="35" rx="2" fill="none" stroke="#333" stroke-width="3"/>
    <line x1="20" y1="5" x2="20" y2="40" stroke="#333" stroke-width="2"/>
    <line x1="5" y1="22" x2="35" y2="22" stroke="#333" stroke-width="2"/>
    <path d="M20 22 L10 10 L10 22" fill="#333" opacity="0.3"/>
  </g>`,
  battery: `<g transform="translate(145,95) scale(2.8)">
    <rect x="3" y="10" width="30" height="22" rx="3" fill="none" stroke="#333" stroke-width="3"/>
    <rect x="33" y="16" width="5" height="10" rx="1" fill="#333"/>
    <polygon points="20,14 14,22 18,22 14,28 24,20 20,20 24,14" fill="#333"/>
  </g>`,
  arrow_up: `<g transform="translate(155,85) scale(3)">
    <line x1="15" y1="40" x2="15" y2="8" stroke="#333" stroke-width="5" stroke-linecap="round"/>
    <polygon points="15,2 4,18 26,18" fill="#333"/>
  </g>`,
  bell: `<g transform="translate(145,55)">
    <path d="M80 130 C80 90 60 70 60 50 C60 25 100 25 100 50 C100 70 80 90 80 130Z" fill="white" stroke="white" stroke-width="4"/>
    <line x1="55" y1="130" x2="105" y2="130" stroke="white" stroke-width="6" stroke-linecap="round"/>
    <circle cx="80" cy="145" r="8" fill="white"/>
    <line x1="80" y1="20" x2="80" y2="35" stroke="white" stroke-width="4" stroke-linecap="round"/>
  </g>`,
  restroom: `<g transform="translate(100,50)">
    <circle cx="70" cy="35" r="14" fill="white"/>
    <path d="M70 50 L70 100 M55 65 L85 65 M70 100 L55 130 M70 100 L85 130" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="150" cy="35" r="14" fill="white"/>
    <path d="M135 50 L150 55 L165 50 L165 100 L155 100 L155 130 L145 130 L145 100 L135 100 Z" fill="white"/>
  </g>`,
  helpdesk: `<g transform="translate(130,55)">
    <circle cx="90" cy="55" r="45" fill="white" stroke="white" stroke-width="4"/>
    <text x="90" y="70" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="55" fill="#059669">?</text>
  </g>`,
  droplets: `<g transform="translate(140,55)">
    <path d="M80 20 C80 20 40 80 40 110 C40 135 65 150 80 150 C95 150 120 135 120 110 C120 80 80 20 80 20Z" fill="white" stroke="white" stroke-width="3"/>
  </g>`,
  shield: `<g transform="translate(148,80) scale(3)">
    <path d="M18 2 L2 10 L2 22 C2 32 18 40 18 40 C18 40 34 32 34 22 L34 10 Z" fill="white" stroke="white" stroke-width="2"/>
    <path d="M12 20 L16 24 L26 14" stroke="#1d4ed8" fill="none" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`,
  lock: `<g transform="translate(155,80) scale(3)">
    <rect x="3" y="15" width="24" height="20" rx="3" fill="white" stroke="white" stroke-width="2"/>
    <path d="M8 15 L8 10 C8 3 22 3 22 10 L22 15" fill="none" stroke="white" stroke-width="3.5"/>
    <circle cx="15" cy="26" r="3" fill="#1d4ed8"/>
  </g>`,
  cctv: `<g transform="translate(120,85) scale(2.5)" fill="#333">
    <rect x="10" y="15" width="25" height="16" rx="3" fill="none" stroke="#333" stroke-width="3"/>
    <polygon points="35,18 45,13 45,35 35,30" fill="none" stroke="#333" stroke-width="3"/>
    <line x1="22" y1="31" x2="22" y2="40" stroke="#333" stroke-width="3"/>
    <line x1="14" y1="40" x2="30" y2="40" stroke="#333" stroke-width="3" stroke-linecap="round"/>
  </g>`,
  money: `<g transform="translate(110,70)">
    <rect x="10" y="15" width="200" height="120" rx="12" fill="#f0fdf4" stroke="#333" stroke-width="4"/>
    <text x="110" y="95" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="50" fill="#16a34a">$</text>
    <circle cx="40" cy="75" r="20" fill="none" stroke="#333" stroke-width="2" stroke-dasharray="4,3"/>
    <circle cx="180" cy="75" r="20" fill="none" stroke="#333" stroke-width="2" stroke-dasharray="4,3"/>
  </g>`,
  parking: `<g transform="translate(120,55)">
    <rect x="10" y="10" width="120" height="120" rx="15" fill="#2563eb" stroke="#1e40af" stroke-width="6"/>
    <text x="70" y="100" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="85" fill="white">P</text>
  </g>`,
  wheelchair: `<g transform="translate(135,50)">
    <circle cx="80" cy="30" r="12" fill="white"/>
    <path d="M80 42 L80 75 L60 75" stroke="white" fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="65" cy="95" r="25" fill="none" stroke="white" stroke-width="7"/>
    <path d="M80 65 L100 65 L110 95" stroke="white" fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`,
  hospital: `<g transform="translate(135,50)">
    <rect x="10" y="30" width="100" height="80" rx="8" fill="white"/>
    <rect x="48" y="45" width="24" height="50" rx="2" fill="#dc2626"/>
    <rect x="35" y="58" width="50" height="24" rx="2" fill="#dc2626"/>
  </g>`,
};

// ── Complete sign definitions ──

const ALL_SIGNS = [
  // --- grade10_reading.json Exercise 1 ---
  { id: "no_smoking", type: "prohibition", icon: "cigarette", label: "NO SMOKING" },
  { id: "free_wifi", type: "info", icon: "wifi", label: "FREE WI-FI" },
  { id: "no_swimming", type: "prohibition", icon: "swimming", label: "NO SWIMMING" },
  { id: "no_climbing", type: "prohibition", icon: "climbing", label: "NO CLIMBING" },
  { id: "turn_off_light", type: "mandatory", icon: "lightbulb", label: "TURN OFF LIGHT" },
  { id: "high_noise", type: "warning", icon: `<text x="200" y="220" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="50" fill="#333">🔊</text>`, label: "CAUTION: HIGH NOISE" },
  { id: "restrooms", type: "info", icon: "restroom", label: "RESTROOMS" },
  { id: "art_workshop", type: "notice", label: "ART WORKSHOP\\nSATURDAYS", subtext: "All welcome — Beginners too!" },
  { id: "face_mask", type: "mandatory", icon: "mask", label: "FACE MASK REQUIRED" },
  { id: "wet_paint", type: "warning", icon: `<text x="200" y="225" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="42" fill="#333">WET PAINT</text>`, label: "WET PAINT" },
  { id: "cctv_24_7", type: "notice", icon: "cctv", label: "CAMERAS RECORDING\\n24/7" },
  { id: "no_open_flames", type: "prohibition", icon: `<g transform="translate(145,90) scale(3)"><polygon points="15,2 8,25 12,22 5,38 18,25 14,28 22,10" fill="#333"/></g>`, label: "NO OPEN FLAMES" },
  { id: "no_photography", type: "prohibition", icon: "camera", label: "NO PHOTOGRAPHY" },
  { id: "stop_bullying", type: "mandatory", icon: "shield", label: "STOP BULLYING" },
  { id: "ice_cream_promo", type: "notice", label: "DAN'S ICE CREAMS\\nBuy 1 Get 1 Free!", subtext: "12:00 — 2:00 p.m." },
  { id: "dine_in_only", type: "notice", label: "OPEN\\nDINE IN ONLY" },
  { id: "no_phone_gas", type: "prohibition", icon: `<g transform="translate(145,80) scale(2.8)"><rect x="8" y="5" width="20" height="35" rx="4" fill="none" stroke="#333" stroke-width="3"/><rect x="12" y="10" width="12" height="18" rx="1" fill="none" stroke="#333" stroke-width="2"/><circle cx="18" cy="34" r="2.5" fill="#333"/></g>`, label: "NO CELL PHONE" },
  { id: "elevator_out_of_order", type: "notice", label: "ELEVATOR\\nOUT OF ORDER", subtext: "Please use the stairs" },
  { id: "bring_id", type: "mandatory", icon: `<g transform="translate(140,80) scale(2.8)"><rect x="2" y="8" width="32" height="22" rx="3" fill="white" stroke="white" stroke-width="2"/><circle cx="13" cy="18" r="5" fill="#1d4ed8"/><line x1="22" y1="15" x2="32" y2="15" stroke="#1d4ed8" stroke-width="2.5"/><line x1="22" y1="22" x2="32" y2="22" stroke="#1d4ed8" stroke-width="2.5"/></g>`, label: "BRING YOUR ID CARD" },
  { id: "help_desk", type: "info", icon: "helpdesk", label: "HELP DESK" },

  // --- grade10_reading.json Exercise 2 ---
  { id: "no_eating_drinking", type: "prohibition", icon: "food", label: "NO EATING OR DRINKING" },
  { id: "no_feed_animals", type: "prohibition", icon: "animal", label: "DO NOT FEED ANIMALS" },
  { id: "no_littering", type: "prohibition", icon: "trash", label: "NO LITTERING" },
  { id: "elderly_crossing", type: "warning", icon: `${ICONS.elderly}`, label: "ELDERLY CROSSING", rawIcon: true },
  { id: "no_flash", type: "prohibition", icon: "flash", label: "NO FLASH PHOTOGRAPHY" },
  { id: "falling_rocks", type: "warning", icon: `${ICONS.rocks}`, label: "FALLING ROCKS", rawIcon: true },
  { id: "waterfall_5km", type: "info", icon: "droplets", label: "WATERFALL 5 KM →" },
  { id: "put_waste_bin", type: "mandatory", icon: `<g transform="translate(148,80) scale(3)"><rect x="5" y="12" width="20" height="22" rx="2" fill="white" stroke="white" stroke-width="2.5"/><rect x="2" y="8" width="26" height="5" rx="2" fill="white"/><path d="M1 35 L15 25 L29 35" fill="none" stroke="white" stroke-width="2.5" stroke-linejoin="round"/></g>`, label: "PUT WASTE IN BIN" },
  { id: "children_helmets", type: "mandatory", icon: "helmet", label: "CHILDREN: WEAR HELMETS" },
  { id: "danger_electricity", type: "danger", icon: `<text x="220" y="165" text-anchor="middle" font-size="80">⚡</text>`, label: "DANGER: ELECTRICITY" },
  { id: "beware_door", type: "warning", icon: `${ICONS.door}`, label: "BEWARE OF DOOR", rawIcon: true },
  { id: "fire_alarm", type: "info", icon: "bell", label: "FIRE ALARM BUTTON" },
  { id: "cash_only", type: "notice", label: "CASH ONLY\\n💵", subtext: "No cards accepted" },
  { id: "no_lean_window", type: "prohibition", icon: "window", label: "DO NOT LEAN OUT" },
  { id: "no_phone_charging", type: "prohibition", icon: "battery", label: "NO PHONE CHARGING" },
  { id: "no_straight_ahead", type: "prohibition", icon: "arrow_up", label: "NO STRAIGHT AHEAD" },
  { id: "fasten_seatbelt", type: "mandatory", icon: "seatbelt", label: "FASTEN SEAT BELT" },
  { id: "no_sharp_objects", type: "prohibition", icon: "scissors", label: "NO SHARP OBJECTS" },
  { id: "no_cutting_trees", type: "prohibition", icon: "tree", label: "NO CUTTING TREES" },
  { id: "no_camping", type: "prohibition", icon: "tent", label: "NO CAMPING" },

  // --- grade10_tests.json signs ---
  { id: "silence_please", type: "notice", label: "SILENCE PLEASE\\nExam in Progress", subtext: "🤫" },
  { id: "no_u_turn", type: "prohibition", icon: "uturn", label: "NO U-TURN" },
  { id: "save_water", type: "mandatory", icon: "droplets", label: "SAVE WATER" },
  { id: "authorized_only", type: "mandatory", icon: "lock", label: "AUTHORIZED PERSONNEL ONLY" },
  { id: "no_parking", type: "prohibition", icon: "car", label: "NO PARKING" },
  { id: "high_voltage", type: "danger", icon: `<text x="220" y="165" text-anchor="middle" font-size="80">⚡</text>`, label: "DANGER: HIGH VOLTAGE" },
  { id: "sale_10_off", type: "notice", label: "SALE\\n10% OFF", subtext: "Limited time offer" },
  { id: "wet_floor", type: "warning", icon: `<text x="200" y="225" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="36" fill="#333">⚠️ WET</text>`, label: "CAUTION: WET FLOOR" },
  { id: "reserved_parking", type: "info", icon: "wheelchair", label: "RESERVED PARKING" },
  { id: "no_food_drinks", type: "prohibition", icon: "food", label: "NO FOOD OR DRINKS" },
  { id: "emergency_exit", type: "info", icon: `<g transform="translate(105,40)"><rect x="10" y="20" width="50" height="100" rx="5" fill="white"/><path d="M35 40 L35 100 L55 100 M20 60 L50 60 M35 100 L25 120 M35 100 L45 120" stroke="white" fill="none" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><polygon points="130,70 100,50 100,62 60,62 60,78 100,78 100,90" fill="white"/></g>`, label: "EMERGENCY EXIT" },
  { id: "school_zone", type: "warning", icon: `<text x="200" y="230" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="32" fill="#333">SCHOOL</text>`, label: "SCHOOL ZONE" },
  { id: "mind_the_gap", type: "warning", icon: `<text x="200" y="225" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="30" fill="#333">MIND THE GAP</text>`, label: "PLEASE MIND THE GAP" },
  { id: "no_pick_flowers", type: "prohibition", icon: "flower", label: "DO NOT PICK FLOWERS" },
  { id: "no_motorbikes", type: "prohibition", icon: "bike", label: "NO MOTORBIKES" },
  { id: "tree_cutting_prohibited", type: "prohibition", icon: "tree", label: "NO TREE CUTTING" },
  { id: "permit_required", type: "mandatory", icon: "lock", label: "PERMIT REQUIRED" },
  { id: "no_loose_clothing", type: "danger", icon: `<text x="220" y="165" text-anchor="middle" font-size="60">⚙️👔</text>`, label: "No Loose Clothing Near Machine" },
  { id: "quiet_study", type: "info", icon: `<g transform="translate(125,45)"><rect x="10" y="20" width="80" height="100" rx="5" fill="white"/><line x1="25" y1="45" x2="75" y2="45" stroke="#059669" stroke-width="4"/><line x1="25" y1="60" x2="75" y2="60" stroke="#059669" stroke-width="4"/><line x1="25" y1="75" x2="65" y2="75" stroke="#059669" stroke-width="4"/><line x1="25" y1="90" x2="55" y2="90" stroke="#059669" stroke-width="4"/></g>`, label: "QUIET STUDY AREA" },
  { id: "silent_mode", type: "mandatory", icon: `<g transform="translate(145,80) scale(2.8)"><rect x="8" y="5" width="20" height="35" rx="4" fill="white" stroke="white" stroke-width="2"/><rect x="12" y="10" width="12" height="18" rx="1" fill="#1d4ed8" opacity="0.3"/><circle cx="18" cy="34" r="2.5" fill="white"/><line x1="30" y1="10" x2="5" y2="35" stroke="#fbbf24" stroke-width="3"/></g>`, label: "SWITCH TO SILENT MODE" },
  { id: "tour_booking", type: "notice", label: "TOUR BOOKING\\nDaily 8-10 AM", subtext: "Guided tours, museums, tickets" },
  { id: "no_u_turn_stop", type: "prohibition", icon: "uturn", label: "NO U-TURN / STOP" },
  { id: "hospital_nearby", type: "info", icon: "hospital", label: "HOSPITAL NEARBY" },
  { id: "general_waste", type: "notice", label: "GENERAL WASTE ONLY\\n♻️🚫", subtext: "No recyclables" },
];

// ── Generate all signs ──

function getIconPath(sign) {
  if (sign.rawIcon && typeof sign.icon === "string") return sign.icon;
  if (typeof sign.icon === "string" && ICONS[sign.icon]) return ICONS[sign.icon];
  if (typeof sign.icon === "string" && sign.icon.startsWith("<")) return sign.icon;
  return `<text x="200" y="200" text-anchor="middle" font-size="60" fill="#333">⚠</text>`;
}

async function main() {
  console.log(`Generating ${ALL_SIGNS.length} sign images...\n`);

  // Try to download ISO 7010 signs from Wikimedia first
  console.log("=== Downloading ISO 7010 signs from Wikimedia Commons ===");
  for (const [key, filename] of Object.entries(WIKIMEDIA_SIGNS)) {
    const outPath = join(OUT, `${key}_iso.svg`);
    if (existsSync(outPath)) {
      console.log(`  ✓ ${key} already exists`);
      continue;
    }
    await downloadFromWikimedia(filename, `${key}_iso.svg`);
    // Small delay to be nice to Wikimedia
    await new Promise(r => setTimeout(r, 500));
  }

  console.log("\n=== Generating sign SVGs ===");
  for (const sign of ALL_SIGNS) {
    const outPath = join(OUT, `${sign.id}.svg`);
    if (existsSync(outPath)) {
      console.log(`  ✓ ${sign.id} already exists`);
      continue;
    }

    let svg;
    const iconPath = getIconPath(sign);

    switch (sign.type) {
      case "prohibition":
        svg = generateProhibitionSVG(sign.label, iconPath);
        break;
      case "warning":
        svg = generateWarningSVG(sign.label, iconPath);
        break;
      case "mandatory":
        svg = generateMandatorySVG(sign.label, iconPath);
        break;
      case "info":
        svg = generateInfoSVG(sign.label, iconPath);
        break;
      case "danger":
        svg = generateDangerSVG(sign.label, iconPath);
        break;
      case "notice":
        svg = generateNoticeSVG(sign.label, sign.subtext || "");
        break;
      default:
        svg = generateNoticeSVG(sign.label, "");
    }

    writeFileSync(outPath, svg, "utf-8");
    console.log(`  ✓ Generated ${sign.id}.svg (${sign.type})`);
  }

  console.log(`\nDone! ${ALL_SIGNS.length} signs generated in ${OUT}`);

  // Output the sign mapping for use in SignVisual
  const mapping = {};
  for (const sign of ALL_SIGNS) {
    mapping[sign.id] = `/images/signs/${sign.id}.svg`;
  }
  writeFileSync(join(OUT, "_mapping.json"), JSON.stringify(mapping, null, 2), "utf-8");
  console.log("Sign mapping saved to _mapping.json");
}

main().catch(console.error);
