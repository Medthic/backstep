// src/components/rankColors.js
export const rankColors = {
  CHIEF: { background: "#f2f3f4", color: "#222" },
  CHIEFEMT: { background: "#f2f3f4", color: "#222" },
  CHIEFMEDIC: { background: "#f2f3f4", color: "#222" },
  CAPTAIN: { background: "#ce2029", color: "#fff" },
  CAPTAINEMT: { background: "#ce2029", color: "#fff" },
  CAPTAINMEDIC: { background: "#ce2029", color: "#fff" },
  LIEUTENANT: { background: "#f9b233", color: "#222" },
  LIEUTENANTEMT: { background: "#f9b233", color: "#222" },
  LIEUTENANTMEDIC: { background: "#f9b233", color: "#222" },
  ENGINEER: { background: "#FFD700", color: "#222" },
  ENGINEEREMT: { background: "#FFD700", color: "#222" },
  ENGINEERMEDIC: { background: "#FFD700", color: "#222" },
  FIREFIGHTER: { background: "#375365", color: "#dfddc4" },
  FIREFIGHTEREMT: { background: "#375365", color: "#dfddc4" },
  FIREFIGHTERMEDIC: { background: "#375365", color: "#dfddc4" },
  GREENSHIELD: { background: "#6bf178", color: "#222" },
  GREENSHIELDEMT: { background: "#6bf178", color: "#222" },
  GREENSHIELDMEDIC: { background: "#6bf178", color: "#222" },
  EMT: { background: "#2eccca", color: "#222" },
  AEMT: { background: "#4099ffff", color: "#222" },
  PARAMEDIC: { background: "#8e7cc3", color: "#222" },
  // Add more as needed
  JUNIOR: { background: "#ffae17ff", color: "#222" },

}

export function formatRankLabel(rank) {
  if (!rank) return ""
  const up = String(rank).toUpperCase()

  // Keep PARAMEDIC as a single label
  if (up === "PARAMEDIC") return "Paramedic"

  // Exact EMT should display simply as "EMT" (no leading pipe)
  if (up === "EMT") return "EMT"

  // Exact AEMT should display as "A-EMT"
  if (up === "AEMT") return "A-EMT"

  // Backwards-compatible explicit firefighter labels
  if (up === "FIREFIGHTEREMT") return "Firefighter | EMT"
  if (up === "FIREFIGHTERMEDIC") return "Firefighter | MEDIC"

  // Generic split for any rank that ends with EMT or MEDIC
  if (up.endsWith("EMT")) {
    const base = up.slice(0, -3)
    const baseLabel = base.toLowerCase()
      ? base.toLowerCase().charAt(0).toUpperCase() + base.toLowerCase().slice(1)
      : base
    return `${baseLabel} | EMT`
  }
  if (up.endsWith("MEDIC")) {
    const base = up.slice(0, -5)
    const baseLabel = base.toLowerCase()
      ? base.toLowerCase().charAt(0).toUpperCase() + base.toLowerCase().slice(1)
      : base
    return `${baseLabel} | MEDIC`
  }

  const lower = up.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}
