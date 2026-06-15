import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
  browserLocalPersistence,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { getUserProfile, createUserProfile, setUserGrade, type UserProfile } from "@/lib/progress";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authError: string | null;
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
  const [authError, setAuthError] = useState<string | null>(null);
  const googleRedirectInFlight = useRef(false);

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
    let disposed = false;
    let anonInFlight = false;
    let unsub: (() => void) | undefined;
    const isAdminRoute = window.location.pathname.startsWith("/admin");

    const handleAuthState = async (u: User | null) => {
      if (!u) {
        if (googleRedirectInFlight.current) return;
        if (isAdminRoute) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        // Guest mode: any visitor without a Google session gets an anonymous Firebase
        // identity so progress, pet, etc. work device-locally without an explicit login.
        // The auth state listener will fire again once signInAnonymously completes.
        if (anonInFlight) return;
        anonInFlight = true;
        try {
          await signInAnonymously(auth);
        } catch (err) {
          anonInFlight = false;
          console.warn("anonymous sign-in failed:", err);
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
        return;
      }
      anonInFlight = false;
      if (disposed) return;
      setAuthError(null);
      setUser(u);
      await loadProfile(u);
      if (!disposed) setLoading(false);
    };

    (async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        await getRedirectResult(auth);
      } catch (err) {
        setAuthError(firebaseErrorMessage(err));
        console.warn("getRedirectResult:", err?.code || err);
      }
      if (disposed) return;
      unsub = onAuthStateChanged(auth, handleAuthState);
    })();

    return () => {
      disposed = true;
      unsub?.();
    };
  }, []);

  const signInWithGoogle = async () => {
    googleRedirectInFlight.current = true;
    setAuthError(null);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, googleProvider);
      googleRedirectInFlight.current = false;
      setUser(result.user);
      await loadProfile(result.user);
      setLoading(false);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (
        code === "auth/popup-blocked" ||
        code === "auth/operation-not-supported-in-this-environment"
      ) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      googleRedirectInFlight.current = false;
      setAuthError(firebaseErrorMessage(err));
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
    <AuthContext.Provider value={{ user, profile, loading, authError, signInWithGoogle, logout, selectGrade, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

function firebaseErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code;
  if (code === "auth/unauthorized-domain") {
    return "Domain hiện tại chưa được thêm vào Firebase Authentication > Authorized domains.";
  }
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
    return "Cửa sổ đăng nhập đã bị đóng trước khi hoàn tất.";
  }
  if (code === "auth/account-exists-with-different-credential") {
    return "Email này đã tồn tại với cách đăng nhập khác.";
  }
  return code ? `Lỗi đăng nhập Firebase: ${code}` : "Không hoàn tất được đăng nhập Google.";
}
