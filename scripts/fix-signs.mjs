/**
 * Fix incorrect sign images by downloading the RIGHT images from Wikimedia Commons
 * Uses EXACT file names verified on Wikimedia, not ISO codes
 */
import { writeFileSync, existsSync, unlinkSync } from "fs";
import { join } from "path";

const OUT = join(import.meta.dirname, "..", "public", "images", "signs");

// [outputName, wikimediaFilename, description]
// Verified filenames from Wikimedia Commons categories
const FIXES = [
  // === WRONG ISO codes - need correct images ===

  // P006 = forklift, NOT feed animals. No ISO code for this.
  ["no_feed_animals", "Do not feed the ducks - geograph.org.uk - 540079.jpg", "Do not feed animals"],

  // P005 = not drinking water, NOT motorbikes
  ["no_motorbikes", "Malaysia_road_sign_-_Prohibition_-_Motorcycles.svg", "No motorbikes"],

  // P010 = do not touch, NOT no mobile phone at gas station
  ["no_phone_gas", "ISO_7010_P013.svg", "No activated mobile phone (P013 is correct)"],

  // P011 = don't extinguish with water, NOT no swimming
  ["no_swimming", "ISO_7010_P049.svg", "No swimming (P049 is correct)"],

  // P012 = no heavy load, NOT no u-turn
  ["no_u_turn", "MUTCD_R3-4.svg", "No U-turn road sign"],
  ["no_u_turn_stop", "MUTCD_R3-4.svg", "No U-turn road sign"],

  // P013 = no mobile phone, P015 = no reaching in — NOT no camping
  ["no_camping", "MUTCD_RA-030.svg", "No camping"],

  // P007 = no cardiac devices, NOT no parking
  ["no_parking", "MUTCD_R8-3.svg", "No parking sign"],

  // P008 = no metallic articles, NOT no sharp objects (keep generated)

  // P034 = no grinding, NOT no food drinks
  ["no_food_drinks", "ISO_7010_P022.svg", "No eating or drinking (same as P022)"],

  // W023 = corrosive, NOT wet floor
  ["wet_floor", "Caution_wet_floor_-_monopoly.svg", "Wet floor caution"],

  // W026 = battery charging, NOT school zone
  ["school_zone", "Japanese_Road_sign_(School_Zone).svg", "School zone warning"],

  // W028 = oxidizing, NOT elderly crossing (no ISO for this)

  // W035 = falling objects (close but not beware of door)

  // M009 = wear gloves, NOT put waste in bin
  ["put_waste_bin", "Tidyman.svg", "Put waste in bin (Tidy Man symbol)"],

  // M015 = high-vis, NOT fasten seatbelt
  ["fasten_seatbelt", "Seatbelt_-_The_Noun_Project.svg", "Fasten seat belt"],

  // M017 = respiratory protection, NOT bring ID

  // M004 = eye protection, NOT save water

  // M001 = general mandatory, NOT stop bullying

  // P047/P048 = toboggan signs, NOT silence/silent

  // E004 = emergency telephone, NOT hospital
  ["hospital_nearby", "Aiga_firstaid.svg", "Hospital / First aid"],

  // E003 = first aid, which IS close to fire alarm but not exact
  ["fire_alarm", "Fire_alarm_call_point.svg", "Fire alarm button"],

  // === Also fix: P036 = hot works prohibited, NOT no picking flowers ===

  // === Signs that DON'T exist in ISO 7010 — search by name ===
  ["elderly_crossing", "Japan_road_sign_214.svg", "Elderly crossing"],
  ["mind_the_gap", "Mind_the_gap_2.svg", "Mind the gap"],
  ["cctv_24_7", "Video_surveillance.svg", "CCTV surveillance"],
  ["reserved_parking", "Handicapped_Accessible_sign.svg", "Disabled parking"],
  ["free_wifi", "Wi-Fi_Logo.svg", "Free WiFi"],
  ["emergency_exit", "ISO_7010_E001.svg", "Emergency exit"],
  ["restrooms", "Toilets_unisex.svg", "Restrooms"],
  ["help_desk", "Aiga_information.svg", "Information / Help desk"],
  ["stop_bullying", "Stop_hand_nuvola.svg", "Stop / Bullying"],
  ["silence_please", "Mute_Icon.svg", "Silence please"],
];

async function downloadFromWikimedia(filename, outPath, ext) {
  // First get the real URL via API
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url|mime&format=json&origin=*`;

  try {
    const resp = await fetch(apiUrl, {
      headers: { "User-Agent": "CoYenLearnsEnglish/1.0 (Educational App)" }
    });
    const data = await resp.json();
    const pages = Object.values(data.query.pages);
    const info = pages[0]?.imageinfo?.[0];

    if (!info?.url) return false;

    // Use thumbnail API for reliable downloads (avoids rate limiting on direct URLs)
    const thumbUrl = `https://commons.wikimedia.org/w/thumb.php?f=${encodeURIComponent(filename)}&w=400`;

    await new Promise(r => setTimeout(r, 2000)); // Rate limit protection

    const imgResp = await fetch(thumbUrl, {
      headers: { "User-Agent": "CoYenLearnsEnglish/1.0 (Educational App)" }
    });

    if (!imgResp.ok) return false;

    const buffer = Buffer.from(await imgResp.arrayBuffer());
    if (buffer.length < 500) return false;

    // Detect actual format
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
    const actualExt = isPng ? "png" : "svg";

    writeFileSync(outPath.replace(/\.\w+$/, `.${actualExt}`), buffer);
    return actualExt;
  } catch (e) {
    console.log(`    Error: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log("=== Fixing incorrect sign images ===\n");

  const results = { fixed: 0, failed: 0, skipped: 0 };
  const pngSigns = [];

  for (const [signId, wikiFile, desc] of FIXES) {
    process.stdout.write(`[${signId}] ${desc}: `);

    const outPath = join(OUT, `${signId}.png`); // Will be corrected by download function
    const ext = await downloadFromWikimedia(wikiFile, outPath);

    if (ext) {
      // Remove old wrong file (other extension)
      const otherExt = ext === "png" ? "svg" : "png";
      const otherPath = join(OUT, `${signId}.${otherExt}`);
      if (existsSync(otherPath)) unlinkSync(otherPath);

      if (ext === "png") pngSigns.push(signId);

      const size = (await import("fs")).statSync(join(OUT, `${signId}.${ext}`)).size;
      console.log(`✓ ${ext.toUpperCase()} (${size} bytes)`);
      results.fixed++;
    } else {
      console.log(`✗ Failed to download`);
      results.failed++;
    }

    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n=== Results ===`);
  console.log(`Fixed: ${results.fixed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`\nPNG signs (need to update component): ${pngSigns.join(", ")}`);
}

main().catch(console.error);
