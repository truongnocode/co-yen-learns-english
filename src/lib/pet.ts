import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export type PetType = "dragon" | "cat" | "fox";
export type PetStage = "egg" | "baby" | "teen" | "adult" | "legend";

export interface PetData {
  type: PetType;
  name: string;
  energy: number;
  stage: PetStage;
  createdAt: string;
  lastFedAt: string;
}

export const PET_TYPES: Record<PetType, { label: string; egg: string; baby: string; teen: string; adult: string; legend: string }> = {
  dragon: { label: "Rồng con", egg: "🥚", baby: "🐣", teen: "🐲", adult: "🐉", legend: "🌟🐉🌟" },
  cat: { label: "Mèo con", egg: "🥚", baby: "🐱", teen: "😺", adult: "😸", legend: "🌟😸🌟" },
  fox: { label: "Cáo nhỏ", egg: "🥚", baby: "🦊", teen: "🦊", adult: "🦊", legend: "🌟🦊🌟" },
};

export const PET_STAGES: { stage: PetStage; label: string; threshold: number }[] = [
  { stage: "egg", label: "Trứng", threshold: 0 },
  { stage: "baby", label: "Sơ sinh", threshold: 50 },
  { stage: "teen", label: "Thiếu niên", threshold: 200 },
  { stage: "adult", label: "Trưởng thành", threshold: 500 },
  { stage: "legend", label: "Huyền thoại", threshold: 1000 },
];

export const getStageForEnergy = (energy: number): PetStage => {
  for (let i = PET_STAGES.length - 1; i >= 0; i--) {
    if (energy >= PET_STAGES[i].threshold) return PET_STAGES[i].stage;
  }
  return "egg";
};

export const getNextStage = (stage: PetStage): { stage: PetStage; threshold: number } | null => {
  const idx = PET_STAGES.findIndex(s => s.stage === stage);
  return idx < PET_STAGES.length - 1 ? PET_STAGES[idx + 1] : null;
};

export const getPetEmoji = (type: PetType, stage: PetStage): string => {
  return PET_TYPES[type][stage];
};

export const getStageLabel = (stage: PetStage): string => {
  return PET_STAGES.find(s => s.stage === stage)?.label || "";
};

// Firebase operations
export const getPetData = async (uid: string): Promise<PetData | null> => {
  const snap = await getDoc(doc(db, "pets", uid));
  return snap.exists() ? (snap.data() as PetData) : null;
};

export const savePetData = async (uid: string, data: PetData): Promise<void> => {
  await setDoc(doc(db, "pets", uid), data);
};

export const feedPet = async (uid: string, energyGain: number): Promise<PetData | null> => {
  const pet = await getPetData(uid);
  if (!pet) return null;
  pet.energy += energyGain;
  pet.stage = getStageForEnergy(pet.energy);
  pet.lastFedAt = new Date().toISOString();
  await savePetData(uid, pet);
  return pet;
};

export const createPet = async (uid: string, type: PetType, name: string): Promise<PetData> => {
  const pet: PetData = {
    type,
    name,
    energy: 0,
    stage: "egg",
    createdAt: new Date().toISOString(),
    lastFedAt: new Date().toISOString(),
  };
  await savePetData(uid, pet);
  return pet;
};
