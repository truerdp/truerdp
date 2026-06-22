"use client"

import * as React from "react"
type Theme = "light" | "dark" | "system"
type ResolvedTheme = "light" | "dark"

type SetTheme = (value: Theme | ((previous: Theme) => Theme)) => void

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: SetTheme
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light"
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function resolveTheme(theme: Theme, enableSystem: boolean): ResolvedTheme {
  if (theme === "system") {
    return enableSystem ? getSystemTheme() : "light"
  }

  return theme
}

function disableTransitionsTemporarily() {
  if (typeof window === "undefined") {
    return null
  }

  const style = document.createElement("style")
  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{transition:none!important;-webkit-transition:none!important}"
    )
  )
  document.head.appendChild(style)

  return () => {
    window.getComputedStyle(document.body)
    setTimeout(() => {
      style.remove()
    }, 1)
  }
}

function applyThemeClass(
  resolvedTheme: ResolvedTheme,
  disableTransitionOnChange: boolean
) {
  const restoreTransitions = disableTransitionOnChange
    ? disableTransitionsTemporarily()
    : null
  const root = document.documentElement

  root.classList.remove("light", "dark")
  root.classList.add(resolvedTheme)
  root.style.colorScheme = resolvedTheme

  restoreTransitions?.()
}

function readStoredTheme(defaultTheme: Theme): Theme {
  if (typeof window === "undefined") {
    return defaultTheme
  }

  try {
    const storedTheme = localStorage.getItem("theme")
    if (
      storedTheme === "light" ||
      storedTheme === "dark" ||
      storedTheme === "system"
    ) {
      return storedTheme
    }
  } catch {
    // Ignore storage failures and fall back to defaults.
  }

  return defaultTheme
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

function ThemeProvider({
  children,
  defaultTheme = "light",
  enableSystem = true,
  disableTransitionOnChange = true,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] =
    React.useState<ResolvedTheme>("light")

  React.useEffect(() => {
    setThemeState(readStoredTheme(defaultTheme))
  }, [defaultTheme])

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleMediaChange = () => {
      if (theme === "system") {
        setResolvedTheme(resolveTheme("system", enableSystem))
      }
    }

    setResolvedTheme(resolveTheme(theme, enableSystem))

    if (!enableSystem) {
      return
    }

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleMediaChange)
      return () => mediaQuery.removeEventListener("change", handleMediaChange)
    }

    mediaQuery.addListener(handleMediaChange)
    return () => mediaQuery.removeListener(handleMediaChange)
  }, [enableSystem, theme])

  React.useEffect(() => {
    applyThemeClass(resolvedTheme, disableTransitionOnChange)
  }, [disableTransitionOnChange, resolvedTheme])

  const setTheme = React.useCallback<SetTheme>((value) => {
    setThemeState((previousTheme) => {
      const nextTheme =
        typeof value === "function" ? value(previousTheme) : value

      try {
        localStorage.setItem("theme", nextTheme)
      } catch {
        // Ignore storage failures.
      }

      return nextTheme
    })
  }, [])

  const contextValue = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [resolvedTheme, setTheme, theme]
  )

  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeHotkey />
      {children}
    </ThemeContext.Provider>
  )
}

function useTheme() {
  const context = React.useContext(ThemeContext)

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }

  return context
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

function ThemeHotkey() {
  const { resolvedTheme, setTheme } = useTheme()

  // use alt+shift+d to toggle dark mode
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) {
        return
      }

      // ignore Meta/Ctrl combinations
      if (event.metaKey || event.ctrlKey) {
        return
      }

      const key = typeof event.key === "string" ? event.key : ""

      if (key.toLowerCase() !== "d") {
        return
      }

      if (isTypingTarget(event.target)) {
        return
      }

      // require Alt+Shift+D
      if (!(event.altKey && event.shiftKey)) {
        return
      }

      setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [resolvedTheme, setTheme])

  return null
}

export { ThemeProvider }
export { useTheme }
