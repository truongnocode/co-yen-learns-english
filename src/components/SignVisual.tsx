/**
 * SignVisual - renders a real sign image for quiz questions.
 * Maps sign text to SVG image files in /images/signs/.
 * Falls back to a styled text card for unmapped signs.
 */

// ── Sign text → image file mapping ──

const SIGN_IMAGE_MAP: [RegExp, string][] = [
  // Prohibition signs
  [/no\s+smoking/i, "no_smoking"],
  [/no\s+swimming/i, "no_swimming"],
  [/no\s+climbing/i, "no_climbing"],
  [/no\s+photography\s+allowed/i, "no_photography"],
  [/no\s+photography$/i, "no_photography"],
  [/no\s+flash/i, "no_flash"],
  [/no\s+eating/i, "no_eating_drinking"],
  [/no\s+food/i, "no_food_drinks"],
  [/do\s+not\s+feed/i, "no_feed_animals"],
  [/no\s+littering/i, "no_littering"],
  [/no\s+phone\s+charging/i, "no_phone_charging"],
  [/no\s+straight/i, "no_straight_ahead"],
  [/no\s+sharp/i, "no_sharp_objects"],
  [/no\s+cutting|tree\s+cutting\s+prohibit/i, "no_cutting_trees"],
  [/no\s+camping/i, "no_camping"],
  [/don'?t\s+use\s+cell/i, "no_phone_gas"],
  [/do\s+not\s+lean/i, "no_lean_window"],
  [/no\s+u-?turn.*stop/i, "no_u_turn_stop"],
  [/no\s+u-?turn/i, "no_u_turn"],
  [/no\s+parking/i, "no_parking"],
  [/no\s+entry/i, "no_entry"],
  [/no\s+motorbike/i, "no_motorbikes"],
  [/do\s+not\s+pick/i, "no_pick_flowers"],
  [/no\s+open\s+flame|danger.*no\s+open/i, "no_open_flames"],
  [/no\s+recyclable/i, "general_waste"],
  [/no\s+loose\s+clothing/i, "no_loose_clothing"],

  // Danger signs
  [/danger.*electricity/i, "danger_electricity"],
  [/danger.*high\s+voltage/i, "high_voltage"],

  // Warning signs
  [/caution.*noise/i, "high_noise"],
  [/wet\s+paint/i, "wet_paint"],
  [/falling\s+rocks/i, "falling_rocks"],
  [/elderly\s+crossing/i, "elderly_crossing"],
  [/beware.*door/i, "beware_door"],
  [/caution.*wet\s+floor/i, "wet_floor"],
  [/school\s+zone/i, "school_zone"],
  [/mind\s+the\s+gap/i, "mind_the_gap"],

  // Mandatory signs
  [/turn\s+off\s+light/i, "turn_off_light"],
  [/face\s+mask/i, "face_mask"],
  [/bring\s+your\s+id/i, "bring_id"],
  [/put\s+waste/i, "put_waste_bin"],
  [/children\s+must\s+wear/i, "children_helmets"],
  [/fasten\s+seat/i, "fasten_seatbelt"],
  [/stop\s+bullying/i, "stop_bullying"],
  [/save\s+water/i, "save_water"],
  [/silent\s+mode/i, "silent_mode"],
  [/permit\s+required/i, "permit_required"],
  [/authorized\s+personnel/i, "authorized_only"],

  // Info signs
  [/free\s+wi-?fi/i, "free_wifi"],
  [/restroom/i, "restrooms"],
  [/help\s+desk/i, "help_desk"],
  [/waterfall/i, "waterfall_5km"],
  [/fire\s+alarm/i, "fire_alarm"],
  [/emergency\s+exit/i, "emergency_exit"],
  [/reserved\s+parking/i, "reserved_parking"],
  [/hospital|medical\s+service/i, "hospital_nearby"],
  [/quiet\s+study/i, "quiet_study"],

  // Notice/Announcement signs
  [/art\s+workshop/i, "art_workshop"],
  [/ice\s+cream/i, "ice_cream_promo"],
  [/dine\s+in/i, "dine_in_only"],
  [/camera.*recording/i, "cctv_24_7"],
  [/elevator.*out/i, "elevator_out_of_order"],
  [/cash\s+only/i, "cash_only"],
  [/silence\s+please/i, "silence_please"],
  [/sale\s+\d+%/i, "sale_10_off"],
  [/tour\s+booking/i, "tour_booking"],
];

function getSignImageId(signText: string): string | null {
  const cleaned = signText.replace(/<[^>]*>/g, "").replace(/[\u{1F000}-\u{1FFFF}]/gu, "").trim();
  for (const [regex, imageId] of SIGN_IMAGE_MAP) {
    if (regex.test(cleaned)) return imageId;
  }
  return null;
}

// Extension map: signId -> file extension (png/jpg/svg)
const SIGN_EXT: Record<string, string> = {
  // Real images from Wikimedia Commons (PNG/JPG)
  no_smoking: "png", no_open_flames: "png", no_entry: "png", no_climbing: "png",
  no_eating_drinking: "png", no_photography: "png", danger_electricity: "png",
  high_voltage: "png", no_swimming: "png", no_phone_gas: "png", no_feed_animals: "png",
  no_motorbikes: "png", no_parking: "png", no_u_turn: "png", no_u_turn_stop: "png",
  no_food_drinks: "png", no_littering: "png", no_camping: "png",
  wet_floor: "jpg", school_zone: "png", elderly_crossing: "png", falling_rocks: "png",
  mind_the_gap: "png", beware_door: "png", children_helmets: "png", face_mask: "png",
  fasten_seatbelt: "png", put_waste_bin: "png", bring_id: "png", save_water: "png",
  stop_bullying: "png", emergency_exit: "png", fire_alarm: "png", hospital_nearby: "png",
  free_wifi: "png", restrooms: "png", help_desk: "png", cctv_24_7: "png",
  reserved_parking: "png", silence_please: "png", silent_mode: "png",
  no_lean_window: "png", no_phone_charging: "png", no_straight_ahead: "png",
  no_pick_flowers: "png", no_cutting_trees: "png", no_flash: "png",
  wet_paint: "png", turn_off_light: "png",
  // Generated SVGs (custom signs without standard images)
  no_sharp_objects: "svg", high_noise: "svg", authorized_only: "svg",
  art_workshop: "svg", ice_cream_promo: "svg", dine_in_only: "svg",
  elevator_out_of_order: "svg", cash_only: "svg", sale_10_off: "svg",
  tour_booking: "svg", general_waste: "svg", waterfall_5km: "svg",
  quiet_study: "svg", permit_required: "svg", tree_cutting_prohibited: "svg",
  no_loose_clothing: "svg",
};

// ── Component ──

interface SignVisualProps {
  sign: string;
  className?: string;
}

export default function SignVisual({ sign, className = "" }: SignVisualProps) {
  const imageId = getSignImageId(sign);

  if (imageId) {
    const ext = SIGN_EXT[imageId] || "svg";
    return (
      <div className={`rounded-2xl p-4 mb-4 text-center bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 ${className}`}>
        <img
          src={`/images/signs/${imageId}.${ext}`}
          alt={sign.replace(/<[^>]*>/g, "").replace(/[\u{1F000}-\u{1FFFF}]/gu, "").trim()}
          className="mx-auto max-h-52 w-auto object-contain"
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback: styled text card for unmapped signs
  const cleanText = sign.replace(/<[^>]*>/g, "").replace(/[\u{1F000}-\u{1FFFF}]/gu, "").trim();
  return (
    <div className={`bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700/50 rounded-2xl p-5 mb-4 text-center ${className}`}>
      <p className="font-extrabold text-lg text-amber-800 dark:text-amber-300">{cleanText}</p>
    </div>
  );
}
