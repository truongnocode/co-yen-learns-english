/**
 * Download REAL sign images from Wikimedia Commons (free, no API key needed)
 * Searches for actual sign photos/renders, not icons
 */
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const OUT = join(import.meta.dirname, "..", "public", "images", "signs");
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

// ── Search queries mapped to sign IDs ──
// Each entry: [signId, searchQuery, preferredFormat]
const SIGN_SEARCHES = [
  // --- Prohibition signs ---
  ["no_smoking", "no smoking sign prohibition", "svg"],
  ["no_swimming", "no swimming sign prohibition", "svg"],
  ["no_climbing", "no climbing sign prohibition", "svg"],
  ["no_photography", "no photography sign prohibition camera", "svg"],
  ["no_flash", "no flash photography sign", "svg"],
  ["no_eating_drinking", "no eating drinking sign prohibition", "svg"],
  ["no_food_drinks", "no food drinks sign prohibition", "svg"],
  ["no_feed_animals", "do not feed animals sign", "svg"],
  ["no_littering", "no littering sign prohibition", "svg"],
  ["no_phone_charging", "no charging phone sign", "svg"],
  ["no_straight_ahead", "no straight ahead road sign", "svg"],
  ["no_sharp_objects", "no sharp objects sign airplane", "svg"],
  ["no_cutting_trees", "no cutting trees sign prohibition", "svg"],
  ["no_camping", "no camping sign prohibition", "svg"],
  ["no_phone_gas", "no mobile phone petrol station sign", "svg"],
  ["no_lean_window", "do not lean out window sign", "svg"],
  ["no_u_turn", "no u-turn road sign", "svg"],
  ["no_u_turn_stop", "no u-turn road sign", "svg"],
  ["no_parking", "no parking sign", "svg"],
  ["no_entry", "no entry sign prohibition", "svg"],
  ["no_motorbikes", "no motorbikes sign prohibition", "svg"],
  ["no_pick_flowers", "do not pick flowers sign", "svg"],
  ["no_open_flames", "no open flames fire sign prohibition", "svg"],
  ["tree_cutting_prohibited", "no cutting trees sign", "svg"],

  // --- Warning signs ---
  ["high_noise", "high noise area warning sign ear protection", "svg"],
  ["wet_paint", "wet paint warning sign", "svg"],
  ["falling_rocks", "falling rocks warning road sign", "svg"],
  ["elderly_crossing", "elderly crossing pedestrian warning sign", "svg"],
  ["beware_door", "automatic door warning sign", "svg"],
  ["wet_floor", "wet floor caution sign yellow", "svg"],
  ["school_zone", "school zone warning sign", "svg"],
  ["mind_the_gap", "mind the gap warning sign", "svg"],

  // --- Danger signs ---
  ["danger_electricity", "danger electricity high voltage sign", "svg"],
  ["high_voltage", "high voltage danger sign electricity", "svg"],
  ["no_loose_clothing", "danger machinery loose clothing sign", "svg"],

  // --- Mandatory signs ---
  ["turn_off_light", "turn off lights switch sign", "svg"],
  ["face_mask", "face mask required sign", "svg"],
  ["bring_id", "ID card required sign", "svg"],
  ["put_waste_bin", "put waste in bin sign", "svg"],
  ["children_helmets", "children must wear helmet sign", "svg"],
  ["fasten_seatbelt", "fasten seat belt sign", "svg"],
  ["stop_bullying", "stop bullying sign", "svg"],
  ["save_water", "save water turn off tap sign", "svg"],
  ["silent_mode", "silent mode phone sign", "svg"],
  ["permit_required", "authorized personnel only sign", "svg"],
  ["authorized_only", "authorized personnel only sign", "svg"],

  // --- Info signs ---
  ["free_wifi", "free wifi sign", "svg"],
  ["restrooms", "restroom toilet sign", "svg"],
  ["help_desk", "help desk information sign", "svg"],
  ["waterfall_5km", "waterfall direction sign", "svg"],
  ["fire_alarm", "fire alarm button sign", "svg"],
  ["emergency_exit", "emergency exit sign green", "svg"],
  ["reserved_parking", "disabled parking reserved sign", "svg"],
  ["hospital_nearby", "hospital sign red cross", "svg"],
  ["quiet_study", "quiet study area library sign", "svg"],

  // --- Notice/Announcement signs ---
  ["art_workshop", "art workshop class announcement", "svg"],
  ["ice_cream_promo", "ice cream buy one get one promotion", "svg"],
  ["dine_in_only", "dine in only restaurant sign", "svg"],
  ["cctv_24_7", "CCTV camera recording sign", "svg"],
  ["elevator_out_of_order", "elevator out of order sign", "svg"],
  ["cash_only", "cash only payment sign", "svg"],
  ["silence_please", "silence please exam sign", "svg"],
  ["sale_10_off", "sale discount sign", "svg"],
  ["tour_booking", "tour booking information sign", "svg"],
  ["general_waste", "general waste only bin sign", "svg"],
];

// ── Known high-quality Wikimedia files (manually curated) ──
const KNOWN_FILES = {
  no_smoking: "ISO_7010_P002.svg",
  no_open_flames: "ISO_7010_P003.svg",
  no_entry: "ISO_7010_P004.svg",
  no_photography: "ISO_7010_P029.svg",
  no_eating_drinking: "ISO_7010_P022.svg",
  no_phone_gas: "ISO_7010_P010.svg",
  no_swimming: "ISO_7010_P025.svg",
  danger_electricity: "ISO_7010_W012.svg",
  high_voltage: "ISO_7010_W012.svg",
  face_mask: "ISO_7010_M016.svg",
  children_helmets: "ISO_7010_M014.svg",
  emergency_exit: "ISO_7010_E001.svg",
  no_camping: "ISO_7010_P078.svg",
  no_littering: "ISO_7010_P042.svg",
  no_parking: "No_parking.svg",
  no_u_turn: "Singapore_Road_Signs_-_Regulatory_Sign_-_No_U-Turn.svg",
  fasten_seatbelt: "Fasten_seat_belt_sign.svg",
  wet_floor: "Wet_floor_-_caution.svg",
  free_wifi: "Free_WiFi.svg",
  restrooms: "Toilets_unisex.svg",
  school_zone: "Vienna_Convention_road_sign_A-12-V1.svg",
  falling_rocks: "Italian_traffic_signs_-_caduta_massi_da_destra.svg",
  no_flash: "ISO_7010_P029.svg",
  cctv_24_7: "CCTV_sign.svg",
  reserved_parking: "Handicapped_Accessible_sign.svg",
  hospital_nearby: "Aiga_firstaid_inv.svg",
  fire_alarm: "Fire_alarm_button.svg",
  no_feed_animals: "Do_not_feed_the_animals_sign.svg",
  no_climbing: "ISO_7010_P009.svg",
  elderly_crossing: "Japanese_road_sign_(Old_pedestrians_crossing).svg",
  mind_the_gap: "Mind_the_gap.svg",
  no_motorbikes: "No_motorcycle.svg",
  no_straight_ahead: "Vienna_Convention_road_sign_C1.svg",
  save_water: "Save_water.svg",
  authorized_only: "Authorized_Personnel_Only_-_Safety_Sign.svg",
  dine_in_only: "Ristorante_TSVG.svg",
  cash_only: "Cash_only_sign.svg",
  no_cutting_trees: "No_cutting_trees.svg",
  tree_cutting_prohibited: "No_cutting_trees.svg",
  stop_bullying: "Stop_bullying_sign.svg",
};

async function downloadFile(url, outPath) {
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "CoYenLearnsEnglish/1.0 (Educational App)" }
    });
    if (!resp.ok) return false;
    const buffer = Buffer.from(await resp.arrayBuffer());
    if (buffer.length < 200) return false; // Too small = error page
    writeFileSync(outPath, buffer);
    return true;
  } catch {
    return false;
  }
}

async function downloadFromWikimedia(filename, outPath) {
  // Use Special:FilePath for direct redirect
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
  return downloadFile(url, outPath);
}

async function searchWikimediaAndDownload(query, outPath) {
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=500&format=json`;

  try {
    const resp = await fetch(apiUrl, {
      headers: { "User-Agent": "CoYenLearnsEnglish/1.0 (Educational App)" }
    });
    const data = await resp.json();

    if (!data.query?.pages) return false;

    const pages = Object.values(data.query.pages)
      .filter(p => p.imageinfo?.[0])
      .sort((a, b) => {
        // Prefer SVG, then PNG, then others
        const aInfo = a.imageinfo[0];
        const bInfo = b.imageinfo[0];
        const aSvg = aInfo.mime === "image/svg+xml" ? 1 : 0;
        const bSvg = bInfo.mime === "image/svg+xml" ? 1 : 0;
        if (aSvg !== bSvg) return bSvg - aSvg;
        // Prefer larger images
        return (bInfo.size || 0) - (aInfo.size || 0);
      });

    for (const page of pages) {
      const info = page.imageinfo[0];
      const url = info.thumburl || info.url;
      if (await downloadFile(url, outPath)) {
        console.log(`    ↳ ${page.title} (${info.mime})`);
        return true;
      }
    }
  } catch (e) {
    console.log(`    ✗ Search failed: ${e.message}`);
  }
  return false;
}

async function main() {
  console.log("=== Downloading REAL sign images ===\n");

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const [signId, query] of SIGN_SEARCHES) {
    const ext = "svg"; // Default to SVG
    const outPath = join(OUT, `${signId}.svg`);

    // Check if we have a known high-quality file
    const knownFile = KNOWN_FILES[signId];

    process.stdout.write(`[${signId}] `);

    // Strategy 1: Try known Wikimedia file
    if (knownFile) {
      console.log(`Trying known file: ${knownFile}...`);
      if (await downloadFromWikimedia(knownFile, outPath)) {
        console.log(`  ✓ Downloaded from known file`);
        downloaded++;
        await new Promise(r => setTimeout(r, 300));
        continue;
      }
    }

    // Strategy 2: Search Wikimedia Commons
    console.log(`Searching: "${query}"...`);
    if (await searchWikimediaAndDownload(query + " sign filetype:svg", outPath)) {
      console.log(`  ✓ Downloaded from search`);
      downloaded++;
      await new Promise(r => setTimeout(r, 500));
      continue;
    }

    // Strategy 3: Try broader search
    if (await searchWikimediaAndDownload(query, outPath)) {
      console.log(`  ✓ Downloaded from broader search`);
      downloaded++;
      await new Promise(r => setTimeout(r, 500));
      continue;
    }

    console.log(`  ⚠ Keeping existing generated file`);
    failed++;
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n=== Results ===`);
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Kept existing: ${failed}`);
  console.log(`Total: ${SIGN_SEARCHES.length}`);
}

main().catch(console.error);
