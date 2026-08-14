export type ThemePreference = "system" | "light" | "dark";
export type DefaultDashboardPreference = "overview" | "problems" | "projects";
export type TimeFormatPreference = "12h" | "24h";

export interface NotificationSettings {
  projectUpdates: boolean;
  taskAssignments: boolean;
  deadlines: boolean;
  messages: boolean;
  mentorUpdates: boolean;
  applicationUpdates: boolean;
  fundingUpdates: boolean;
  certificateUpdates: boolean;
  achievements: boolean;
  announcements: boolean;
  inApp: boolean;
  email: boolean; // Persisted preference; UI clarifies email digest scheduling
}

export interface PrivacySettings {
  visibleToMentors: boolean;
  visibleToTeammates: boolean;
  showSkills: boolean;
  allowDiscovery: boolean;
}

export interface ApplicationSettings {
  defaultDashboard: DefaultDashboardPreference;
  timeFormat: TimeFormatPreference;
  timezone: string;
}

export interface UserSettings {
  userId: string;
  theme: ThemePreference;
  compactMode: boolean;
  reducedMotion: boolean;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  application: ApplicationSettings;
  updatedAt: number;
}

export const DEFAULT_USER_SETTINGS: Omit<UserSettings, "userId" | "updatedAt"> = {
  theme: "system",
  compactMode: false,
  reducedMotion: false,
  notifications: {
    projectUpdates: true,
    taskAssignments: true,
    deadlines: true,
    messages: true,
    mentorUpdates: true,
    applicationUpdates: true,
    fundingUpdates: true,
    certificateUpdates: true,
    achievements: true,
    announcements: true,
    inApp: true,
    email: false,
  },
  privacy: {
    visibleToMentors: true,
    visibleToTeammates: true,
    showSkills: true,
    allowDiscovery: true,
  },
  application: {
    defaultDashboard: "overview",
    timeFormat: "12h",
    timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" : "UTC",
  },
};
