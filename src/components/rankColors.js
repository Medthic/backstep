// src/components/rankColors.js
export const rankColors = {
  CHIEF: { background: "#f2f3f4", color: "#222" },
  CAPTAIN: { background: "#ce2029", color: "#fff" },
  LIEUTENANT: { background: "#f9b233", color: "#222" },
  ENGINEER: { background: "#FFD700", color: "#222" },
  FIREFIGHTEREMT: { background: "#375365", color: "#dfddc4" },
  FIREFIGHTER: { background: "#375365", color: "#dfddc4" },
  FIREFIGHTERMEDIC: { background: "#375365", color: "#dfddc4" },
  GREENSHIELD: { background: "#6bf178", color: "#222" },
  EMT: { background: "#2eccca", color: "#222" },
  PARAMEDIC: { background: "#8e7cc3", color: "#222" },
  // Add more as needed
}
export function formatRankLabel(rank) {
  if (!rank) return ""
  const up = String(rank).toUpperCase()
  // Only split the two firefighter combinations explicitly. Do NOT split PARAMEDIC.
  if (up === "FIREFIGHTEREMT") return "Firefighter | EMT"
  if (up === "FIREFIGHTERMEDIC") return "Firefighter | MEDIC"

  const lower = up.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}
