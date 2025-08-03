"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function useThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update theme-color meta tag when theme changes
  useEffect(() => {
    if (!mounted) return;

    const updateThemeColor = () => {
      const currentTheme = resolvedTheme || theme;
      const themeColor = currentTheme === "dark" ? "#1e1e1e" : "#f5f5f5";

      // Remove existing theme-color meta tags
      const existingMeta = document.querySelectorAll(
        'meta[name="theme-color"]'
      );
      existingMeta.forEach((meta) => meta.remove());

      // Add new theme-color meta tag
      const metaTag = document.createElement("meta");
      metaTag.name = "theme-color";
      metaTag.content = themeColor;
      document.head.appendChild(metaTag);
    };

    if (theme) {
      updateThemeColor();
    }
  }, [theme, resolvedTheme, mounted]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return {
    theme: mounted ? theme : "dark", // Return default theme during SSR
    setTheme,
    resolvedTheme: mounted ? resolvedTheme : "dark", // Return default theme during SSR
    toggleTheme,
    mounted,
  };
}
