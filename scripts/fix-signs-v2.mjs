/**
 * Fix ALL incorrect sign images using verified Wikimedia filenames
 * Downloads via thumbnail API to avoid rate limiting
 */
import { writeFileSync, existsSync, unlinkSync, statSync } from "fs";
import { join } from "path";

const OUT = join(import.meta.dirname, "..", "public", "images", "signs");

// [signId, wikimediaFilename] — ALL verified correct mappings
const ALL_SIGNS = [
  // ── CONFIRMED CORRECT ISO 7010 (already downloaded correctly) ──
  ["no_smoking", "ISO_7010_P002.svg"],          // ✓ No smoking
  ["no_open_flames", "ISO_7010_P003.svg"],       // ✓ No open flames
  ["no_entry", "ISO_7010_P004.svg"],             // ✓ No entry
  ["no_climbing", "ISO_7010_P009.svg"],           // ✓ No climbing (not P017!)
  ["no_eating_drinking", "ISO_7010_P022.svg"],    // ✓ No eating or drinking
  ["no_photography", "ISO_7010_P029.svg"],        // ✓ No photography
  ["danger_electricity", "ISO_7010_W012.svg"],    // ✓ Electricity danger
  ["high_voltage", "ISO_7010_W012.svg"],          // ✓ Same sign
  ["no_littering", "ISO_7010_P042.svg"],          // ✗ P042 = not for pregnant!

  // ── FIXES: Wrong ISO codes used before ──
  ["no_swimming", "ISO_7010_P049.svg"],           // P049 = No swimming (NOT P011/P025)
  ["no_phone_gas", "ISO_7010_P013.svg"],          // P013 = No mobile phone (NOT P010)
  ["no_feed_animals", "Do_Not_Feed_Animals_-_The_Noun_Project.svg"], // No ISO for this
  ["no_motorbikes", "Singapore_Road_Signs_-_Restrictive_Sign_-_No_motorcycles.svg"],
  ["no_parking", "Singapore_Road_Signs_-_Restrictive_Sign_-_No_Parking.svg"],
  ["no_u_turn", "Singapore_road_sign_-_Prohibitory_-_No_U-turn_-_Historic.svg"],
  ["no_u_turn_stop", "Singapore_road_sign_-_Prohibitory_-_No_U-turn_-_Historic.svg"],
  ["no_food_drinks", "ISO_7010_P022.svg"],        // Same as no eating drinking
  ["no_littering", "Tidy_man.svg"],               // Tidy man symbol
  ["no_camping", "ISO_7010_P045.svg"],            // P045 = No campfire (closest)

  // Warning signs
  ["wet_floor", "Yellow_wet_floor_caution_sign_in_English.JPG"],
  ["school_zone", "Philippines_road_sign_W6-2_Slow_Down_School_Zone.svg"],
  ["elderly_crossing", "Japan_road_sign_214.svg"],
  ["falling_rocks", "Mauritius_Road_Signs_-_Warning_Sign_-_Falling_rocks.svg"],
  ["mind_the_gap", "Mind_the_gap1.svg"],
  ["beware_door", "ANSI_A156.19_Sign_3_-_Warning_of_automatic_doors.svg"],

  // Mandatory signs
  ["children_helmets", "ISO_7010_M014.svg"],      // ✓ Correct - wear head protection
  ["face_mask", "ISO_7010_M016.svg"],             // ✓ Correct - wear mask
  ["fasten_seatbelt", "Seatbelt.svg"],
  ["put_waste_bin", "Tidyman.svg"],
  ["bring_id", "Clipart_identity_card.svg"],
  ["save_water", "Water_drop.svg"],
  ["stop_bullying", "Stop_hand_nuvola.svg"],

  // Info/Emergency signs
  ["emergency_exit", "ISO_7010_E001.svg"],        // ✓ Correct
  ["fire_alarm", "Fire_alarm.svg"],
  ["hospital_nearby", "Aiga_firstaid.svg"],
  ["free_wifi", "Wifiservice.svg"],
  ["restrooms", "Toilets_unisex.svg"],
  ["help_desk", "Help_icon.svg"],
  ["cctv_24_7", "CCTV_Surveillance_Notice.svg"],
  ["reserved_parking", "Handicapped_Accessible_sign.svg"],
  ["silence_please", "Mute_Icon.svg"],
  ["silent_mode", "Mute_Icon.svg"],

  // Signs without good Wikimedia matches (keep generated or try alternatives)
  ["no_sharp_objects", "No_entry_with_knife.svg"],
  ["no_lean_window", "Do_not_lean_out.svg"],
  ["no_phone_charging", "Battery_with_charging_sign.svg"],
  ["no_straight_ahead", "Zeichen_209_-_Vorgeschriebene_Fahrtrichtung_links,_StVO_2017.svg"],
  ["no_pick_flowers", "No_picking_flowers.svg"],
  ["no_cutting_trees", "ISO_7010_P045.svg"], // Campfire prohibition (closest to nature)
  ["high_noise", "ISO_7010_W038_warning,_sudden_loud_noises.svg"],
  ["wet_paint", "Wet_paint.svg"],
  ["authorized_only", "Authorized_Personnel_Only_-_Safety_Sign.svg"],
  ["turn_off_light", "Light_bulb_icon_tips.svg"],
];

async function downloadThumbnail(filename, signId) {
  const thumbUrl = `https://commons.wikimedia.org/w/thumb.php?f=${encodeURIComponent(filename)}&w=400`;

  try {
    const resp = await fetch(thumbUrl, {
      headers: { "User-Agent": "CoYenLearnsEnglish/1.0 (Educational)" },
      redirect: "follow",
    });

    if (!resp.ok) return null;

    const buffer = Buffer.from(await resp.arrayBuffer());
    if (buffer.length < 300) return null;

    // Detect format
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8;
    const isSvg = buffer.toString("utf-8", 0, 10).includes("<");

    let ext = "png";
    if (isSvg) ext = "svg";
    else if (isJpeg) ext = "jpg";

    const outPath = join(OUT, `${signId}.${ext}`);
    writeFileSync(outPath, buffer);

    // Remove other extensions
    for (const e of ["svg", "png", "jpg"]) {
      if (e !== ext) {
        const p = join(OUT, `${signId}.${e}`);
        if (existsSync(p)) unlinkSync(p);
      }
    }

    return ext;
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log("=== Fixing ALL sign images ===\n");

  let fixed = 0, failed = 0, skipped = 0;
  const extMap = {}; // signId -> extension

  for (const [signId, wikiFile] of ALL_SIGNS) {
    process.stdout.write(`[${signId}] `);

    const ext = await downloadThumbnail(wikiFile, signId);

    if (ext) {
      const size = statSync(join(OUT, `${signId}.${ext}`)).size;
      console.log(`✓ ${wikiFile} → ${ext} (${size} bytes)`);
      extMap[signId] = ext;
      fixed++;
    } else {
      console.log(`✗ ${wikiFile} not found`);
      // Check what we have
      for (const e of ["png", "svg", "jpg"]) {
        if (existsSync(join(OUT, `${signId}.${e}`))) {
          extMap[signId] = e;
          break;
        }
      }
      failed++;
    }

    await new Promise(r => setTimeout(r, 1500));
  }

  // Output the extension map for updating the component
  console.log(`\n=== Results: Fixed ${fixed}, Failed ${failed} ===`);
  console.log("\n=== PNG signs list for component update ===");
  const pngList = Object.entries(extMap)
    .filter(([, e]) => e === "png" || e === "jpg")
    .map(([id]) => id);
  console.log(JSON.stringify(pngList));
}

main().catch(console.error);
