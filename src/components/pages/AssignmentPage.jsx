import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { rankColors, formatRankLabel } from "../rankColors"
import "./AssignmentPage.css"

export const AssignmentPage = () => {
  // Box names and positions
  const boxNames = [
    "Engine 41",
    "Engine 42",
    "Truck",
    "Rescue",
    "Ambulance 47",
    "Ambulance 48",
    "Ambulance 49",
  ]
  const boxPositions = [
    ["CHAUFFEUR", "OFFICER", "NOZZLE", "LAYOUT", "FORCIBLE ENTRY", "BACKUP"], // Engine 41
    ["CHAUFFEUR", "OFFICER", "NOZZLE", "LAYOUT", "FORCIBLE ENTRY", "BACKUP"], // Engine 42 (same positions)
    ["CHAUFFEUR", "OFFICER", "CAN", "OVM", "IRONS", "ROOF"], // Truck
    ["CHAUFFEUR", "OFFICER", "SAFETY", "TOOL", "CRIB", "CRIB"], // Rescue
    ["STAFF", "STAFF"], // Ambulance 47
    ["STAFF", "STAFF"], // Ambulance 48
    ["STAFF", "STAFF"], // Ambulance 49
  ]
  const _boxCount = boxNames.length

  const [assignments, setAssignments] = useState([])
  const [members, setMembers] = useState([])

  useEffect(() => {
    let ignore = false
    // Fetch assignments (selected member ids for each box/position)
    const fetchAssignments = () =>
      supabase
        .from("assignments")
        .select("box, position, member_id, last_updated")
        .then(({ data }) => {
          if (!ignore) setAssignments(data || [])
        })
    fetchAssignments()
    // Fetch member info for display
    supabase
      .from("memberlist")
      .select("id, name, rank")
      .then(({ data }) => {
        if (!ignore) setMembers(data || [])
      })

    // --- Real-time subscription for assignments table ---
    const channel = supabase
      .channel("realtime-assignments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assignments" },
        () => {
          fetchAssignments()
        }
      )
      .subscribe()

    return () => {
      ignore = true
      supabase.removeChannel(channel)
    }
  }, [])

  // Helper to get member info by id
  const getMember = (id) => members.find((m) => m.id === id)

  // Gets the most recent update time for all assignments within a specific apparatus box
  const getLatestUpdateForBox = (boxIdx) => {
    const boxAssignments = assignments.filter((a) => a.box === boxIdx)
    if (boxAssignments.length === 0) return null

    // Find the most recent timestamp by reducing over the assignments for this box
    const latestTimestamp = boxAssignments.reduce((latest, current) => {
      // Guard against null or invalid timestamps
      if (!latest?.last_updated) return current
      if (!current?.last_updated) return latest

      const latestDate = new Date(latest.last_updated)
      const currentDate = new Date(current.last_updated)
      return currentDate > latestDate ? current : latest
    })?.last_updated

    if (!latestTimestamp) return null

    // Format it into a user-friendly string (e.g., "11/14 2:30 PM")
    return new Date(latestTimestamp).toLocaleString([], {
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).replace(",", "")
  }

  return (
    <div className="carousel-page assignment-grid ambulance-layout">
      {/* Main apparatus side by side */}
      {boxNames.slice(0, 4).map((name, boxIdx) => {
        const lastUpdated = getLatestUpdateForBox(boxIdx)
        return (
          <div className="assignment-box" key={boxIdx}>
            <h3>{name}</h3>
            {lastUpdated && (
              <h4 className="last-updated-stamp">{lastUpdated}</h4>
            )}
            {boxPositions[boxIdx].map((pos, ddIdx) => {
              const assignment = assignments.find(
                (a) => a.box === boxIdx && a.position === ddIdx
              )
              const member = assignment ? getMember(assignment.member_id) : null
              return (
                <div className="assignment-row vertical-align" key={ddIdx}>
                  <div className="position-label left-align">{pos}</div>
                  <div
                    className={
                      member
                        ? `member-selection-box rank-${
                            member.rank?.toLowerCase() || "default"
                          }`
                        : "member-selection-box unassigned"
                    }
                    style={
                      member && rankColors[member.rank?.toUpperCase()]
                        ? {
                            background:
                              rankColors[member.rank.toUpperCase()].background,
                            color: rankColors[member.rank.toUpperCase()].color,
                          }
                        : undefined
                    }
                  >
                    {member ? (
                      <span>
                        <span className="member-name">{member.name}</span>{" "}
                        <span className="member-rank">{formatRankLabel(member.rank)}</span>
                      </span>
                    ) : (
                      <span>Unassigned</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
      {/* Ambulance boxes stacked vertically */}
      <div className="ambulance-stack">
        {boxNames.slice(4).map((name, relativeIdx) => {
          const boxIdx = relativeIdx + 4
          const lastUpdated = getLatestUpdateForBox(boxIdx)
          return (
            <div className="assignment-box ambulance-box" key={boxIdx}>
              <h3>{name}</h3>
              {lastUpdated && (
                <h4 className="last-updated-stamp">{lastUpdated}</h4>
              )}
              {boxPositions[boxIdx].map((pos, ddIdx) => {
                const assignment = assignments.find(
                  (a) => a.box === boxIdx && a.position === ddIdx
                )
                const member = assignment ? getMember(assignment.member_id) : null
                return (
                  <div className="assignment-row vertical-align" key={ddIdx}>
                    <div className="position-label left-align">{pos}</div>
                    <div
                      className={
                        member
                          ? `member-selection-box rank-${
                              member.rank?.toLowerCase() || "default"
                            }`
                          : "member-selection-box unassigned"
                      }
                      style={
                        member && rankColors[member.rank?.toUpperCase()]
                          ? {
                              background:
                                rankColors[member.rank.toUpperCase()].background,
                              color: rankColors[member.rank.toUpperCase()].color,
                            }
                          : undefined
                      }
                    >
                      {member ? (
                        <span>
                          <span className="member-name">{member.name}</span>{" "}
                          <span className="member-rank">{formatRankLabel(member.rank)}</span>
                        </span>
                      ) : (
                        <span>Unassigned</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
