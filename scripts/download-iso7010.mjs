/**
 * Download ISO 7010 safety sign SVGs from Wikimedia Commons
 * Uses the proper API to get direct file URLs
 */
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const OUT = join(import.meta.dirname, "..", "public", "images", "signs");
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

// ISO 7010 code → output filename mapping
// Verified codes from https://en.wikipedia.org/wiki/ISO_7010
const ISO_SIGNS = {
  // Prohibition (P)
  "P002": "no_smoking",        // No smoking
  "P003": "no_open_flames",    // No open flames
  "P004": "no_entry",          // No entry
  "P006": "no_pedestrians",    // No pedestrians (unused but good to have)
  "P010": "no_phone_gas",      // No activated mobile phones
  "P011": "no_swimming",       // No swimming (note: some sources say P025)
  "P017": "no_climbing",       // No climbing
  "P022": "no_eating_drinking", // No eating or drinking
  "P029": "no_photography",    // No photography
  // Warning (W)
  "W001": "general_warning",   // General warning
  "W012": "danger_electricity", // Electricity
  // Mandatory (M)
  "M014": "children_helmets",  // Wear head protection
  "M016": "face_mask",         // Wear a mask
  // Emergency (E)
  "E001": "emergency_exit",    // Emergency exit left
  "E003": "fire_alarm",        // First aid (close to fire alarm)
};

async function getWikimediaUrl(isoCode) {
  const filename = `ISO_7010_${isoCode}.svg`;
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${filename}&prop=imageinfo&iiprop=url&format=json&origin=*`;

  try {
    const resp = await fetch(apiUrl, {
      headers: { "User-Agent": "CoYenLearnsEnglish/1.0 (Educational; contact@example.com)" }
    });
    const data = await resp.json();
    const pages = Object.values(data.query.pages);
    if (pages[0]?.imageinfo?.[0]?.url) {
      return pages[0].imageinfo[0].url;
    }
  } catch (e) {
    console.log(`  API error for ${isoCode}: ${e.message}`);
  }
  return null;
}

async function downloadSvg(url, outPath) {
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "CoYenLearnsEnglish/1.0 (Educational)" }
    });
    if (!resp.ok) return false;
    const text = await resp.text();
    if (!text.includes("<svg") && !text.includes("<?xml")) return false;
    writeFileSync(outPath, text, "utf-8");
    return true;
  } catch {
    return false;
  }
}

// Also try some well-known non-ISO sign files
const OTHER_SIGNS = {
  "no_camping": ["No_camping.svg", "P078", "Verbotszeichen_Zelten_verboten.svg"],
  "no_littering": ["No_littering.svg", "Pictogram_no_littering.svg", "Verbotszeichen_Nicht_wegwerfen.svg"],
  "no_parking": ["No_parking_sign.svg", "UK_road_sign_no_parking.svg", "Zeichen_286_-_Eingeschränktes_Haltverbot,_StVO_1992.svg"],
  "no_u_turn": ["No_U-turn.svg", "Japanese_road_sign_312-2.svg", "UK_traffic_sign_614.svg"],
  "no_motorbikes": ["No_motorcycle.svg", "No_mopeds.svg"],
  "reserved_parking": ["Handicapped_Accessible_sign.svg", "Disability_symbols.svg"],
  "wet_floor": ["Caution_wet_floor.svg", "Wet_floor_sign.svg"],
  "restrooms": ["Toilet_sign.svg", "Pictograms-nps-restrooms.svg", "Aiga_toilets.svg"],
  "free_wifi": ["Free_Wifi.svg", "Wi-Fi_Logo.svg", "Wifi_logo.svg"],
  "fasten_seatbelt": ["Seatbelt_sign.svg", "Buckle_up_sign.svg", "Fasten_seat_belt.svg"],
  "school_zone": ["School_zone_sign.svg", "School_warning_sign.svg"],
  "falling_rocks": ["Falling_rocks.svg", "Italian_traffic_signs_-_caduta_massi_da_destra.svg"],
  "elderly_crossing": ["Elderly_crossing.svg", "Old_people_crossing.svg"],
  "save_water": ["Save_water_sign.svg"],
  "help_desk": ["Information_icon.svg", "Aiga_information.svg"],
  "hospital_nearby": ["Hospital_sign.svg", "Aiga_firstaid.svg"],
  "cctv_24_7": ["CCTV_in_use_sign.svg", "CCTV_sign.svg"],
  "mind_the_gap": ["Mind_the_gap.svg", "Mind_the_gap_2.svg"],
  "no_flash": ["No_flash.svg", "No_flash_photography.svg"],
  "no_feed_animals": ["Do_not_feed_the_animals.svg", "No_feeding.svg"],
  "no_lean_window": ["Do_not_lean_out_of_window.svg"],
  "no_sharp_objects": ["No_sharp_objects.svg"],
  "no_cutting_trees": ["No_logging.svg", "No_tree_cutting.svg"],
  "no_pick_flowers": ["Do_not_pick_flowers.svg", "No_picking_flowers.svg"],
  "no_food_drinks": ["No_food_or_drink.svg", "P022"],
  "stop_bullying": ["Stop_bullying.svg", "Anti-bullying_sign.svg"],
  "bring_id": ["ID_card.svg", "Identification_card.svg"],
  "no_phone_charging": ["No_charging.svg"],
  "no_straight_ahead": ["No_through_road.svg", "Zeichen_209_-_Vorgeschriebene_Fahrtrichtung_links,_StVO_2017.svg"],
  "put_waste_bin": ["Tidy_man.svg", "Litter_sign.svg", "Tidyman.svg"],
};

async function tryDownloadOther(signId, candidates, outPath) {
  for (const candidate of candidates) {
    // Check if it's an ISO code
    if (/^[PWME]\d{3}$/.test(candidate)) {
      const url = await getWikimediaUrl(candidate);
      if (url && await downloadSvg(url, outPath)) return true;
    } else {
      // Try as a Wikimedia filename
      const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(candidate)}&prop=imageinfo&iiprop=url&format=json&origin=*`;
      try {
        const resp = await fetch(apiUrl, {
          headers: { "User-Agent": "CoYenLearnsEnglish/1.0 (Educational)" }
        });
        const data = await resp.json();
        const pages = Object.values(data.query.pages);
        if (pages[0]?.imageinfo?.[0]?.url) {
          const fileUrl = pages[0].imageinfo[0].url;
          if (await downloadSvg(fileUrl, outPath)) return true;
        }
      } catch {}
    }
    await new Promise(r => setTimeout(r, 200));
  }
  return false;
}

async function main() {
  console.log("=== Downloading ISO 7010 signs ===\n");

  let downloaded = 0;

  // Step 1: Download ISO 7010 signs
  for (const [code, signId] of Object.entries(ISO_SIGNS)) {
    const outPath = join(OUT, `${signId}.svg`);
    process.stdout.write(`[ISO ${code}] ${signId}: `);

    const url = await getWikimediaUrl(code);
    if (url) {
      if (await downloadSvg(url, outPath)) {
        const size = (await import("fs")).statSync(outPath).size;
        console.log(`✓ (${size} bytes)`);
        downloaded++;
      } else {
        console.log(`✗ SVG download failed`);
      }
    } else {
      console.log(`✗ File not found on Wikimedia`);
    }
    await new Promise(r => setTimeout(r, 300));
  }

  // Step 2: Try other known filenames
  console.log("\n=== Trying other Wikimedia files ===\n");

  for (const [signId, candidates] of Object.entries(OTHER_SIGNS)) {
    const outPath = join(OUT, `${signId}.svg`);

    // Check if current file is already a real SVG > 1500 bytes (means it's already good)
    if (existsSync(outPath)) {
      const content = (await import("fs")).readFileSync(outPath, "utf-8");
      if (content.includes("<svg") && content.length > 1500) {
        console.log(`[${signId}] Already has good SVG (${content.length} bytes), skipping`);
        continue;
      }
    }

    process.stdout.write(`[${signId}] Trying ${candidates.length} candidates: `);
    if (await tryDownloadOther(signId, candidates, outPath)) {
      const size = (await import("fs")).statSync(outPath).size;
      console.log(`✓ (${size} bytes)`);
      downloaded++;
    } else {
      console.log(`✗ None found`);
    }
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n=== Done: ${downloaded} files downloaded ===`);
}

main().catch(console.error);
