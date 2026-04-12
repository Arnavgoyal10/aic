"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface DarkModeContextValue {
  dark: boolean;
  toggle: () => void;
}

const DarkModeContext = createContext<DarkModeContextValue>({
  dark: false,
  toggle: () => {},
});

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);

  // Read saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem("bodhi-dark");
    if (saved === "true") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggle = () => {
    setDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("bodhi-dark", "true");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("bodhi-dark", "false");
      }
      return next;
    });
  };

  return (
    <DarkModeContext.Provider value={{ dark, toggle }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDark() {
  return useContext(DarkModeContext);
}
