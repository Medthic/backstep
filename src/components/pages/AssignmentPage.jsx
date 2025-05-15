import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { rankColors } from "../rankColors"
import "./AssignmentPage.css"

export const AssignmentPage = () => {
  // Box names and positions
  const boxNames = [
    "Engine",
    "Truck",
    "Rescue",
    "Ambulance 47",
    "Ambulance 48",
    "Ambulance 49",
  ]
  const boxPositions = [
    ["CHAUFFEUR", "OFFICER", "NOZZLE", "LAYOUT", "FORCIBLE ENTRY", "BACKUP"], // Engine
    ["CHAUFFEUR", "OFFICER", "OVM", "IRONS", "ROOF", "CAN"], // Truck
    ["CHAUFFEUR", "OFFICER", "SAFETY", "TOOL", "CRIB", "CRIB"], // Rescue
    ["STAFF", "STAFF"], // Ambulance 47
    ["STAFF", "STAFF"], // Ambulance 48
    ["STAFF", "STAFF"], // Ambulance 49
  ]
  const boxCount = boxNames.length

  const [assignments, setAssignments] = useState([])
  const [members, setMembers] = useState([])

  useEffect(() => {
    let ignore = false
    // Fetch assignments (selected member ids for each box/position)
    const fetchAssignments = () =>
      supabase
        .from("assignments")
        .select("box, position, member_id")
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
        (payload) => {
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

  return (
    <div className="carousel-page assignment-grid ambulance-layout">
      {/* Main apparatus side by side */}
      {boxNames.slice(0, 3).map((name, boxIdx) => (
        <div className="assignment-box" key={boxIdx}>
          <h3>{name}</h3>
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
                      <span className="member-rank">{member.rank}</span>
                    </span>
                  ) : (
                    <span>Unassigned</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}
      {/* Ambulance boxes stacked vertically */}
      <div className="ambulance-stack">
        {boxNames.slice(3).map((name, boxIdx) => (
          <div className="assignment-box ambulance-box" key={boxIdx + 3}>
            <h3>{name}</h3>
            {boxPositions[boxIdx + 3].map((pos, ddIdx) => {
              const assignment = assignments.find(
                (a) => a.box === boxIdx + 3 && a.position === ddIdx
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
                        <span className="member-rank">{member.rank}</span>
                      </span>
                    ) : (
                      <span>Unassigned</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
