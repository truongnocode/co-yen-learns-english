// Bộ linh vật cho học sinh chọn — 12 con giáp + nhiều bạn dễ thương khác.
// Ảnh: Microsoft Fluent 3D emoji (MIT), đồng bộ phong cách với Gấu/Thỏ/Cà Rốt.
import mouse from "@/assets/pets/mouse.png";
import ox from "@/assets/pets/ox.png";
import tiger from "@/assets/pets/tiger.png";
import cat from "@/assets/pets/cat.png";
import dragon from "@/assets/pets/dragon.png";
import snake from "@/assets/pets/snake.png";
import horse from "@/assets/pets/horse.png";
import goat from "@/assets/pets/goat.png";
import monkey from "@/assets/pets/monkey.png";
import rooster from "@/assets/pets/rooster.png";
import dog from "@/assets/pets/dog.png";
import pig from "@/assets/pets/pig.png";
import dolphin from "@/assets/pets/dolphin.png";
import owl from "@/assets/pets/owl.png";
import fox from "@/assets/pets/fox.png";
import panda from "@/assets/pets/panda.png";
import lion from "@/assets/pets/lion.png";
import elephant from "@/assets/pets/elephant.png";
import unicorn from "@/assets/pets/unicorn.png";
import frog from "@/assets/pets/frog.png";
import penguin from "@/assets/pets/penguin.png";
import honeybee from "@/assets/pets/honeybee.png";
import koala from "@/assets/pets/koala.png";
import turtle from "@/assets/pets/turtle.png";
import bear from "@/assets/emoji/bear.png";
import rabbit from "@/assets/emoji/rabbit.png";

export interface PetSpecies {
  id: string;
  name: string;
  img: string;
  zodiac?: boolean;
}

export const PET_SPECIES: PetSpecies[] = [
  // 12 con giáp
  { id: "mouse", name: "Chuột", img: mouse, zodiac: true },
  { id: "ox", name: "Trâu", img: ox, zodiac: true },
  { id: "tiger", name: "Hổ", img: tiger, zodiac: true },
  { id: "cat", name: "Mèo", img: cat, zodiac: true },
  { id: "dragon", name: "Rồng", img: dragon, zodiac: true },
  { id: "snake", name: "Rắn", img: snake, zodiac: true },
  { id: "horse", name: "Ngựa", img: horse, zodiac: true },
  { id: "goat", name: "Dê", img: goat, zodiac: true },
  { id: "monkey", name: "Khỉ", img: monkey, zodiac: true },
  { id: "rooster", name: "Gà", img: rooster, zodiac: true },
  { id: "dog", name: "Chó", img: dog, zodiac: true },
  { id: "pig", name: "Lợn", img: pig, zodiac: true },
  // các bạn thêm
  { id: "bear", name: "Gấu", img: bear },
  { id: "rabbit", name: "Thỏ", img: rabbit },
  { id: "fox", name: "Cáo", img: fox },
  { id: "panda", name: "Gấu trúc", img: panda },
  { id: "lion", name: "Sư tử", img: lion },
  { id: "elephant", name: "Voi", img: elephant },
  { id: "unicorn", name: "Kỳ lân", img: unicorn },
  { id: "dolphin", name: "Cá heo", img: dolphin },
  { id: "owl", name: "Cú mèo", img: owl },
  { id: "penguin", name: "Cánh cụt", img: penguin },
  { id: "frog", name: "Ếch", img: frog },
  { id: "koala", name: "Koala", img: koala },
  { id: "turtle", name: "Rùa", img: turtle },
  { id: "honeybee", name: "Ong", img: honeybee },
];

const byId = new Map(PET_SPECIES.map((s) => [s.id, s]));

/** Always returns a species; falls back to the first if an unknown/legacy id is stored. */
export const getSpecies = (id: string): PetSpecies => byId.get(id) || PET_SPECIES[0];
