/**
 * Emoji mapping for common English vocabulary.
 * Used by FlashcardMatch and ListenChoosePicture games.
 * Keys are lowercase English words.
 */
const emojiMap: Record<string, string> = {
  // Animals
  cat: "🐱", dog: "🐶", bird: "🐦", fish: "🐟", rabbit: "🐰", mouse: "🐭",
  elephant: "🐘", lion: "🦁", tiger: "🐯", monkey: "🐒", bear: "🐻", horse: "🐴",
  cow: "🐄", pig: "🐷", sheep: "🐑", chicken: "🐔", duck: "🦆", frog: "🐸",
  snake: "🐍", turtle: "🐢", whale: "🐳", dolphin: "🐬", butterfly: "🦋",
  bee: "🐝", ant: "🐜", spider: "🕷️", penguin: "🐧", owl: "🦉", fox: "🦊",
  deer: "🦌", giraffe: "🦒", zebra: "🦓", gorilla: "🦍", parrot: "🦜",
  crab: "🦀", octopus: "🐙", snail: "🐌", koala: "🐨", panda: "🐼",
  crocodile: "🐊", camel: "🐫", dragon: "🐉", dinosaur: "🦕",

  // Food & Drinks
  apple: "🍎", banana: "🍌", orange: "🍊", grape: "🍇", strawberry: "🍓",
  watermelon: "🍉", lemon: "🍋", peach: "🍑", cherry: "🍒", pineapple: "🍍",
  mango: "🥭", coconut: "🥥", tomato: "🍅", corn: "🌽", carrot: "🥕",
  potato: "🥔", onion: "🧅", garlic: "🧄", pepper: "🌶️", mushroom: "🍄",
  bread: "🍞", cheese: "🧀", egg: "🥚", meat: "🥩", chicken: "🍗",
  pizza: "🍕", hamburger: "🍔", sandwich: "🥪", hotdog: "🌭",
  rice: "🍚", noodle: "🍜", soup: "🍲", salad: "🥗", cake: "🎂",
  cookie: "🍪", candy: "🍬", chocolate: "🍫", "ice cream": "🍦",
  milk: "🥛", juice: "🧃", water: "💧", tea: "🍵", coffee: "☕",
  soda: "🥤",

  // School & Stationery
  book: "📖", pencil: "✏️", pen: "🖊️", ruler: "📏", eraser: "🧹",
  bag: "🎒", backpack: "🎒", notebook: "📓", school: "🏫", teacher: "👩‍🏫",
  student: "👨‍🎓", desk: "🪑", chair: "🪑", clock: "🕐", computer: "💻",
  calculator: "🧮", globe: "🌍", map: "🗺️", library: "📚",

  // Family & People
  mother: "👩", mom: "👩", father: "👨", dad: "👨", baby: "👶",
  boy: "👦", girl: "👧", man: "👨", woman: "👩", family: "👨‍👩‍👧‍👦",
  brother: "👦", sister: "👧", grandfather: "👴", grandmother: "👵",
  friend: "🤝", doctor: "👩‍⚕️", nurse: "👨‍⚕️", police: "👮",
  firefighter: "🧑‍🚒", farmer: "🧑‍🌾", chef: "👨‍🍳", pilot: "👨‍✈️",
  singer: "🎤", dancer: "💃", artist: "🎨",

  // Body Parts
  eye: "👁️", ear: "👂", nose: "👃", mouth: "👄", hand: "✋", foot: "🦶",
  head: "🗣️", tooth: "🦷", heart: "❤️", brain: "🧠",

  // Weather & Nature
  sun: "☀️", sunny: "☀️", moon: "🌙", star: "⭐", cloud: "☁️", cloudy: "☁️",
  rain: "🌧️", rainy: "🌧️", snow: "❄️", snowy: "❄️", wind: "💨", windy: "💨",
  storm: "⛈️", rainbow: "🌈", thunder: "⚡", hot: "🔥", cold: "🥶",
  tree: "🌳", flower: "🌸", leaf: "🍃", mountain: "⛰️", river: "🏞️",
  sea: "🌊", ocean: "🌊", beach: "🏖️", forest: "🌲", garden: "🌻",
  island: "🏝️", volcano: "🌋", desert: "🏜️",

  // Transport
  car: "🚗", bus: "🚌", train: "🚆", bicycle: "🚲", bike: "🚲",
  motorcycle: "🏍️", airplane: "✈️", plane: "✈️", helicopter: "🚁",
  ship: "🚢", boat: "⛵", taxi: "🚕", truck: "🚛", ambulance: "🚑",
  rocket: "🚀", subway: "🚇",

  // Sports & Activities
  football: "⚽", soccer: "⚽", basketball: "🏀", tennis: "🎾",
  baseball: "⚾", volleyball: "🏐", swimming: "🏊", running: "🏃",
  cycling: "🚴", skiing: "⛷️", surfing: "🏄", fishing: "🎣",
  badminton: "🏸", "table tennis": "🏓", golf: "⛳",

  // Home & Objects
  house: "🏠", home: "🏠", door: "🚪", window: "🪟", bed: "🛏️",
  sofa: "🛋️", table: "🪑", lamp: "💡", television: "📺", tv: "📺",
  phone: "📱", camera: "📷", key: "🔑", umbrella: "☂️", mirror: "🪞",
  kitchen: "🍳", bathroom: "🛁", bedroom: "🛏️",

  // Clothes
  shirt: "👕", pants: "👖", dress: "👗", hat: "🎩", cap: "🧢",
  shoes: "👟", boots: "👢", socks: "🧦", jacket: "🧥", coat: "🧥",
  glasses: "👓", scarf: "🧣", gloves: "🧤", bag: "👜",

  // Colors (show colored circle)
  red: "🔴", blue: "🔵", green: "🟢", yellow: "🟡", orange: "🟠",
  purple: "🟣", black: "⚫", white: "⚪", brown: "🟤", pink: "💗",

  // Numbers
  one: "1️⃣", two: "2️⃣", three: "3️⃣", four: "4️⃣", five: "5️⃣",
  six: "6️⃣", seven: "7️⃣", eight: "8️⃣", nine: "9️⃣", ten: "🔟",

  // Emotions
  happy: "😊", sad: "😢", angry: "😠", scared: "😨", surprised: "😲",
  tired: "😴", hungry: "🤤", thirsty: "🥵", sick: "🤒", excited: "🤩",
  love: "❤️", laugh: "😂", cry: "😭", smile: "😄",

  // Actions (common verbs)
  eat: "🍽️", drink: "🥤", sleep: "😴", run: "🏃", walk: "🚶",
  read: "📖", write: "✍️", sing: "🎤", dance: "💃", play: "🎮",
  cook: "👨‍🍳", clean: "🧹", wash: "🧼", study: "📚", draw: "🎨",
  swim: "🏊", fly: "🕊️", jump: "🤸", climb: "🧗",

  // Music & Entertainment
  music: "🎵", guitar: "🎸", piano: "🎹", drum: "🥁", movie: "🎬",
  game: "🎮", toy: "🧸", doll: "🪆", ball: "⚽", kite: "🪁",
  robot: "🤖", puzzle: "🧩",

  // Time & Calendar
  morning: "🌅", afternoon: "🌤️", evening: "🌆", night: "🌙",
  birthday: "🎂", christmas: "🎄", holiday: "🎉", party: "🥳",

  // Places
  hospital: "🏥", park: "🏞️", zoo: "🦁", museum: "🏛️", cinema: "🎬",
  restaurant: "🍽️", supermarket: "🛒", market: "🏪", airport: "✈️",
  hotel: "🏨", church: "⛪", castle: "🏰", stadium: "🏟️",
  playground: "🛝", farm: "🌾", city: "🏙️", village: "🏘️",
};

/**
 * Get emoji for an English word. Returns null if no mapping exists.
 */
export const getEmoji = (word: string): string | null => {
  const key = word.toLowerCase().trim();
  return emojiMap[key] || null;
};

/**
 * Get all vocab items that have emoji mappings from a list.
 */
export const filterWithEmoji = (vocabItems: { en: string; vi: string }[]): { en: string; vi: string; emoji: string }[] => {
  const result: { en: string; vi: string; emoji: string }[] = [];
  const seen = new Set<string>();
  for (const item of vocabItems) {
    const emoji = getEmoji(item.en);
    if (emoji && !seen.has(item.en.toLowerCase())) {
      seen.add(item.en.toLowerCase());
      result.push({ ...item, emoji });
    }
  }
  return result;
};

export default emojiMap;
