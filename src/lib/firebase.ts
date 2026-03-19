import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBU_YOotirDyotQ40v2xLCyTrR-cF9O0xc",
  authDomain: "english-class-28f06.firebaseapp.com",
  projectId: "english-class-28f06",
  storageBucket: "english-class-28f06.firebasestorage.app",
  messagingSenderId: "968347388200",
  appId: "1:968347388200:web:dfbafbb34c5eb8448ae81d",
  measurementId: "G-JMRDQLVX0J",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
