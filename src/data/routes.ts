// Single source of truth for app routes. Use these instead of hardcoded strings
// so the IA can be reorganized in one place (see docs/IA-PLAN.md).
export const routes = {
  home: "/",
  dashboard: "/dashboard",
  grades: "/grades",
  grade: (id: string | number) => `/grade/${id}`,
  practice: "/practice",
  video: "/video-lessons",
  videoLesson: (id: string) => `/video-lessons/${id}`,
  progress: "/progress",
  pet: "/pet",
  tests: "/tests",
} as const;
