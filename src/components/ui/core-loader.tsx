import { cn } from "@/lib/utils"

// CoFabri Core mark, in motion — design option 5a ("Breathe"). Same three
// paths as the static mark; only layer scale is animated (core first, then
// void, then shell).
//
// This repo's tokens (globals.css) are resolved hex values (e.g.
// `--primary: var(--accent)` -> `#0B6BE6`), not bare HSL triplets — so fills
// reference `var(--token)` directly. Do not wrap these in `hsl(...)`.
const D = "M50 1 Q55 45 99 50 Q55 55 50 99 Q45 55 1 50 Q45 45 50 1 Z"

interface CoreLoaderProps {
  size?: number
  /** Background this sits directly on. Defaults per `tone` — override on a
   * raised surface (e.g. `var(--card)`) so the void layer blends in. */
  surface?: string
  label?: string
  /** "inverted" is for sitting on a solid `--primary` surface (e.g. the
   * default Button variant) where the normal shell/core colors would be
   * invisible against their own background. */
  tone?: "default" | "inverted"
  className?: string
}

export function CoreLoader({
  size = 40,
  surface,
  label = "Loading",
  tone = "default",
  className,
}: CoreLoaderProps) {
  const twoLayer = size <= 24 // three layers turn to mush below 24px
  const shellColor = tone === "inverted" ? "var(--primary-foreground)" : "var(--primary)"
  const coreColor = tone === "inverted" ? "var(--primary-foreground)" : "var(--foreground)"
  const resolvedSurface = surface ?? (tone === "inverted" ? "var(--primary)" : "var(--background)")

  const base = {
    transformBox: "fill-box",
    transformOrigin: "center",
    animationDuration: "1.2s",
    animationTimingFunction: "cubic-bezier(.65,0,.35,1)",
    animationIterationCount: "infinite",
  } as const

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="status"
      aria-label={label}
      className={cn("cf-core-loader", className)}
    >
      <path
        d={D}
        fill={shellColor}
        style={{ ...base, transform: "scale(1)", animationName: "cf-shell", animationDelay: twoLayer ? "0s" : ".18s" }}
      />
      <path
        d={D}
        fill={resolvedSurface}
        style={{
          ...base,
          transform: twoLayer ? "scale(.44)" : "scale(.70)",
          animationName: twoLayer ? "cf-void2" : "cf-void",
          animationDelay: twoLayer ? "0s" : ".09s",
        }}
      />
      {!twoLayer && (
        <path d={D} fill={coreColor} style={{ ...base, transform: "scale(.36)", animationName: "cf-core" }} />
      )}
    </svg>
  )
}
