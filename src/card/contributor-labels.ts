import { titleCase } from "../menubar/format";

const short: Record<string, string> = {
  deep_sleep: "Deep",
  efficiency: "Effic.",
  latency: "Latency",
  rem_sleep: "REM",
  restfulness: "Restful",
  timing: "Timing",
  total_sleep: "Total",
  activity_balance: "Act bal",
  body_temperature: "Temp",
  hrv_balance: "HRV",
  previous_day_activity: "Prev act",
  previous_night: "Prev nt",
  recovery_index: "Recov",
  resting_heart_rate: "RHR",
  sleep_balance: "Slp bal",
  sleep_regularity: "Regular",
  meet_daily_targets: "Targets",
  move_every_hour: "Hourly",
  recovery_time: "Recov",
  stay_active: "Active",
  training_frequency: "Freq",
  training_volume: "Volume",
};

export const contributorLabel = (key: string) => short[key] ?? titleCase(key);
