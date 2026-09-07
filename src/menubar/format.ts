export const scoreText = (score: number | null | undefined) =>
  score === null || score === undefined ? "--" : String(score);

export const scoreColor = (score: number | null | undefined) => {
  if (score === null || score === undefined) {
    return "#8e8e93";
  }
  if (score >= 85) {
    return "#34c759";
  }
  if (score >= 70) {
    return "#ff9f0a";
  }
  return "#ff453a";
};

export const hoursMinutes = (seconds: number | null | undefined) => {
  if (seconds === null || seconds === undefined) {
    return "--";
  }
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0
    ? `${hours}h ${String(minutes).padStart(2, "0")}m`
    : `${minutes}m`;
};

export const clockTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

export const decimal = (value: number | null | undefined, digits = 1) =>
  value === null || value === undefined ? "--" : value.toFixed(digits);

const acronyms: Record<string, string> = {
  hrv: "HRV",
  rem: "REM",
  spo2: "SpO2",
};

export const titleCase = (key: string) =>
  key
    .split("_")
    .map((word, index) => {
      const acronym = acronyms[word];
      if (acronym) {
        return acronym;
      }
      return index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word;
    })
    .join(" ");

export const kilometers = (meters: number) =>
  `${(meters / 1000).toFixed(1)} km`;

export const percent = (value: number | null | undefined, digits = 0) =>
  value === null || value === undefined ? "--" : `${value.toFixed(digits)}%`;

export const signed = (value: number | null | undefined, digits = 2) => {
  if (value === null || value === undefined) {
    return "--";
  }
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}`;
};

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const shortDay = (isoDay: string) => {
  const [, month, day] = isoDay.split("-");
  const name = monthNames[Number(month) - 1];
  return name && day ? `${Number(day)} ${name}` : isoDay;
};
