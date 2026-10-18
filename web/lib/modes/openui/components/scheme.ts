"use client"

import { useEffect, useState, type RefObject } from "react"

export function useColorScheme(ref: RefObject<HTMLElement | null>): "light" | "dark" {
  const [scheme, setScheme] = useState<"light" | "dark">("light")
  useEffect(() => {
    const read = () => {
      const root = document.documentElement
      const dark = root.classList.contains("dark") || root.dataset.theme === "dark"
      const value = ref.current ? getComputedStyle(ref.current).colorScheme : ""
      setScheme(dark || value.trim() === "dark" ? "dark" : "light")
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] })
    return () => observer.disconnect()
  }, [ref])
  return scheme
}
