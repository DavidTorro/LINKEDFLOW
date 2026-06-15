import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "linkedflow-theme";

// Tema por defecto: claro. Si el usuario ya eligió uno, se respeta lo guardado.
function getInitialTheme(): Theme {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "dark" || stored === "light" ? stored : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Sincroniza el atributo data-theme del <html> y persiste la preferencia.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === "light" ? "dark" : "light"));

  return { theme, setTheme, toggleTheme };
}
