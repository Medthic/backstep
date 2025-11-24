export const rankColors = {
  CHIEF: { background: "#f2f3f4", color: "#222" },
  CHIEFEMT: { background: "#f2f3f4", color: "#222" },
  CHIEFMEDIC: { background: "#f2f3f4", color: "#222" },
  CAPTAIN: { background: "#ce2029", color: "#fff" },
  CAPTAINEMT: { background: "#ce2029", color: "#fff" },
  CAPTAINMEDIC: { background: "#ce2029", color: "#fff" },
  LIEUTENANT: { background: "#ffea00ff", color: "#222" },
  LIEUTENANTEMT: { background: "#ffea00ff", color: "#222" },
  LIEUTENANTMEDIC: { background: "#ffea00ff", color: "#222" },
  ENGINEER: { background: "#ff7575ff", color: "#222" },
  ENGINEEREMT: { background: "#ff7575ff", color: "#222" },
  ENGINEERMEDIC: { background: "#ff7575ff", color: "#222" },
  FIREFIGHTER: { background: "#375365", color: "#dfddc4" },
  FIREFIGHTEREMT: { background: "#375365", color: "#dfddc4" },
  FIREFIGHTERMEDIC: { background: "#375365", color: "#dfddc4" },
  GREENSHIELD: { background: "#6bf178", color: "#222" },
  GREENSHIELDEMT: { background: "#6bf178", color: "#222" },
  GREENSHIELDMEDIC: { background: "#6bf178", color: "#222" },
  EMT: { background: "#2eccca", color: "#222" },
  AEMT: { background: "#55a1f7ff", color: "#222" },
  PARAMEDIC: { background: "#8e7cc3", color: "#222" },
  JUNIOR: { background: "#ffae17ff", color: "#222" },

}

export function formatRankLabel(rank) {
  if (!rank) return ""
  const up = String(rank).toUpperCase()
  if (up === "PARAMEDIC") return "Paramedic"
  if (up === "EMT") return "EMT"
  if (up === "AEMT") return "A-EMT"
  if (up === "FIREFIGHTEREMT") return "Firefighter | EMT"
  if (up === "FIREFIGHTERMEDIC") return "Firefighter | MEDIC"
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
