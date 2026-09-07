export type Appearance = "dark" | "light";

export interface Theme {
  readonly awake: string;
  readonly deep: string;
  readonly fair: string;
  readonly good: string;
  readonly high: string;
  readonly light: string;
  readonly low: string;
  readonly medium: string;
  readonly muted: string;
  readonly none: string;
  readonly poor: string;
  readonly rem: string;
  readonly rule: string;
  readonly sedentary: string;
  readonly text: string;
  readonly track: string;
}

const shared = {
  good: "#30d158",
  fair: "#ff9f0a",
  poor: "#ff453a",
  deep: "#5e5ce6",
  rem: "#0a84ff",
  light: "#64d2ff",
  awake: "#98989d",
  high: "#ff375f",
  medium: "#ff9f0a",
  low: "#30d158",
  sedentary: "#98989d",
};

export const themes: Record<Appearance, Theme> = {
  dark: {
    ...shared,
    text: "#ffffff",
    muted: "#98989d",
    rule: "rgba(255,255,255,0.14)",
    track: "rgba(255,255,255,0.12)",
    none: "#636366",
  },
  light: {
    ...shared,
    text: "#1d1d1f",
    muted: "#6e6e73",
    rule: "rgba(0,0,0,0.12)",
    track: "rgba(0,0,0,0.08)",
    none: "#aeaeb2",
  },
};

export const scoreTone = (theme: Theme, score: number | null | undefined) => {
  if (score === null || score === undefined) {
    return theme.none;
  }
  if (score >= 85) {
    return theme.good;
  }
  if (score >= 70) {
    return theme.fair;
  }
  return theme.poor;
};
