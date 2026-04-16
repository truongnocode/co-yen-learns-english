import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { getUserProfile, createUserProfile, setUserGrade, type UserProfile } from "@/lib/progress";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  selectGrade: (grade: number) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (u: User) => {
    let p = await getUserProfile(u.uid);
    if (!p) {
      p = await createUserProfile(u.uid, {
        displayName: u.displayName || "",
        photoURL: u.photoURL || "",
      });
    }
    setProfile(p);
  };

  useEffect(() => {
    // Pick up redirect result on page load (used when popup was blocked and we fell back to redirect).
    getRedirectResult(auth).catch((err) => {
      // Ignore cancelled / no-result cases; real failures still surface via the sign-in call.
      console.warn("getRedirectResult:", err?.code || err);
    });
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await loadProfile(u);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      // When the popup is blocked or the user closes it, fall back to a full-page redirect so
      // sign-in still completes. Other errors (network, cancelled, etc.) bubble up to the caller.
      if (
        code === "auth/popup-blocked" ||
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request" ||
        code === "auth/operation-not-supported-in-this-environment"
      ) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const selectGrade = async (grade: number) => {
    if (!user) return;
    await setUserGrade(user.uid, grade);
    setProfile((prev) => prev ? { ...prev, grade } : null);
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, logout, selectGrade, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
