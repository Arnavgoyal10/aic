"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";
import members from "@/data/members.json";

interface AuthContextValue {
  user: User | null;
  memberId: string | null;   // the member ID matching this user's email
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  memberId: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const memberId = user?.email
    ? (members.find((m) => m.email.toLowerCase() === user.email!.toLowerCase())?.id ?? null)
    : null;

  return (
    <AuthContext.Provider value={{ user, memberId, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
