export const colors = {
  primary: "#2F6FED",
  primaryDark: "#1D4FD6",
  primaryLight: "#5B93F5",
  white: "#FFFFFF",
  textDark: "#111827",
  textGray: "#6B7280",
  inputBg: "#F3F4F6",
  inputBgOnBlue: "rgba(255,255,255,0.15)",
  border: "#E5E7EB",
} as const;

export const gradients = {
  primary: [colors.primaryDark, colors.primary, colors.primaryLight] as const,
};
