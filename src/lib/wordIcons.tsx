import {
  School, BookOpen, User, GraduationCap, Backpack, Pencil, Ruler,
  Home, Sofa, Bed, Bath, Lamp, Tv, Armchair,
  TreePine, Mountain, Sun, Cloud, Droplets, Waves, Flower2,
  Dog, Cat, Bird, Fish, Bug,
  Car, Bike, Bus, Plane, Ship, Train,
  Apple, Pizza, Coffee, IceCream, Cake, Sandwich, CupSoda,
  Heart, Star, Music, Camera, Gamepad2, Palette, Trophy,
  Clock, Calendar, Phone, Mail, Globe, Map, Compass,
  Shirt, Watch, Glasses,
  Flame, Zap, Wind, Snowflake, Thermometer,
  Building, Church, Store, Hospital, Library,
  Users, Baby, PersonStanding,
  Eye, Ear, Hand, Footprints,
  Dumbbell, Volleyball,
  Laptop, Smartphone, Wifi, Monitor,
  Pen, NotebookPen, FileText, BookOpenCheck,
  CirclePlay, RotateCcw, Sparkles, type LucideIcon,
  Package, Activity, MessageCircle, Lightbulb
} from "lucide-react";

/** Map of English words → Lucide icon components */
const wordIconMap: Record<string, LucideIcon> = {
  // School
  school: School, classroom: School, student: User, teacher: GraduationCap,
  subject: BookOpen, uniform: Shirt, calculator: Smartphone, pencil: Pencil,
  "pencil sharpener": Pencil, compass: Compass, "school bag": Backpack,
  "pencil case": Pen, rubber: Package, ruler: Ruler, notebook: NotebookPen,
  textbook: BookOpen, playground: Gamepad2, library: Library,
  "boarding school": Building, "international school": Globe, activity: Activity,
  "break time": Clock, study: BookOpenCheck, exam: FileText, lesson: BookOpen,
  homework: NotebookPen, exercise: Dumbbell, test: FileText,
  
  // House
  house: Home, "country house": Home, "town house": Building, flat: Building,
  villa: Home, "stilt house": Home, "living room": Sofa, bedroom: Bed,
  bathroom: Bath, kitchen: Flame, lamp: Lamp, television: Tv, tv: Tv,
  sofa: Armchair, chair: Armchair, table: Package, door: Home, window: Home,
  garden: Flower2, garage: Car, roof: Home, wall: Home, floor: Home,
  
  // Nature
  tree: TreePine, mountain: Mountain, sun: Sun, cloud: Cloud, rain: Droplets,
  river: Waves, sea: Waves, ocean: Waves, flower: Flower2, forest: TreePine,
  lake: Waves, beach: Waves, island: Mountain, sky: Cloud, star: Star,
  moon: Star, wind: Wind, snow: Snowflake, weather: Thermometer,
  
  // Animals
  dog: Dog, cat: Cat, bird: Bird, fish: Fish, insect: Bug, pet: Dog,
  animal: Dog, monkey: Dog, elephant: Dog, lion: Cat,
  
  // Transport
  car: Car, bicycle: Bike, bike: Bike, bus: Bus, plane: Plane, ship: Ship,
  train: Train, taxi: Car, motorcycle: Bike, boat: Ship,
  
  // Food
  food: Apple, fruit: Apple, apple: Apple, pizza: Pizza, coffee: Coffee,
  "ice cream": IceCream, cake: Cake, bread: Sandwich, sandwich: Sandwich,
  water: CupSoda, milk: CupSoda, juice: CupSoda, rice: Package,
  meat: Package, vegetable: Apple, meal: Pizza, breakfast: Coffee,
  lunch: Pizza, dinner: Pizza, drink: CupSoda,
  
  // Emotions & Activities
  love: Heart, happy: Heart, music: Music, photo: Camera, camera: Camera,
  game: Gamepad2, sport: Volleyball, art: Palette, painting: Palette,
  prize: Trophy, win: Trophy, dance: Music, sing: Music,
  
  // Time
  time: Clock, clock: Clock, day: Calendar, week: Calendar, month: Calendar,
  year: Calendar, morning: Sun, afternoon: Sun, evening: Star, night: Star,
  
  // Communication
  phone: Phone, email: Mail, letter: Mail, message: MessageCircle,
  talk: MessageCircle, speak: MessageCircle, say: MessageCircle,
  
  // Body
  eye: Eye, ear: Ear, hand: Hand, foot: Footprints, face: User,
  
  // Tech
  computer: Laptop, laptop: Laptop, internet: Wifi, screen: Monitor,
  
  // People
  friend: Users, family: Users, mother: User, father: User,
  brother: User, sister: User, baby: Baby, child: Baby,
  people: Users, person: PersonStanding, man: PersonStanding, woman: PersonStanding,
  boy: PersonStanding, girl: PersonStanding,
  
  // Places
  city: Building, hospital: Hospital, church: Church, shop: Store,
  market: Store, restaurant: Store, hotel: Building, museum: Building,
  park: TreePine, zoo: Dog, cinema: Monitor, theater: Monitor,
  
  // Misc
  idea: Lightbulb, think: Lightbulb, fire: Flame, light: Lightbulb,
  watch: Watch, glasses: Glasses, clothes: Shirt, hat: User,
  book: BookOpen, pen: Pen, paper: FileText, map: Map,
  world: Globe, country: Globe, flag: Globe,
  
  // Common verbs
  play: CirclePlay, run: Zap, walk: Footprints, read: BookOpen,
  write: Pen, listen: Ear, look: Eye, see: Eye, hear: Ear,
  eat: Apple, cook: Flame, clean: Sparkles, wash: Droplets,
  open: BookOpen, close: BookOpen, start: CirclePlay, begin: CirclePlay,
  stop: RotateCcw, learn: GraduationCap, teach: GraduationCap,
  work: Building, buy: Store, sell: Store, give: Heart, help: Heart,
  ride: Bike, drive: Car, fly: Plane, swim: Waves,
  wear: Shirt, draw: Palette, paint: Palette, build: Building,
};

/** Fallback icons by word type */
const typeIconMap: Record<string, LucideIcon> = {
  n: Package,
  v: Zap,
  adj: Palette,
  adv: Wind,
  prep: Map,
  idiom: MessageCircle,
  "n/v": Sparkles,
  "v phr": Activity,
};

export function getWordIcon(word: string, type?: string): LucideIcon {
  const lower = word.toLowerCase().trim();
  
  // Exact match
  if (wordIconMap[lower]) return wordIconMap[lower];
  
  // Check if any key is contained in the word
  for (const [key, icon] of Object.entries(wordIconMap)) {
    if (lower.includes(key) || key.includes(lower)) return icon;
  }
  
  // Fallback by type
  if (type && typeIconMap[type]) return typeIconMap[type];
  
  return Sparkles;
}
