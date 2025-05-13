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
    ["Officer", "Driver", "Nozzle", "Backup", "Control", "Door"], // Engine
    ["Officer", "Driver", "Irons", "Can", "OVM", "Roof"], // Truck
    ["Officer", "Driver", "Rescue 1", "Rescue 2", "Rescue 3", "Rescue 4"], // Rescue
    ["Medic", "Driver"], // Ambulance 47
    ["Medic", "Driver"], // Ambulance 48
    ["Medic", "Driver"], // Ambulance 49
  ]
  const boxCount = boxNames.length

  const [assignments, setAssignments] = useState([])
  const [members, setMembers] = useState([])

  useEffect(() => {
    // Fetch assignments (selected member ids for each box/position)
    supabase
      .from("assignments")
      .select("box, position, member_id")
      .then(({ data }) => setAssignments(data || []))
    // Fetch member info for display
    supabase
      .from("memberlist")
      .select("id, name, rank")
      .then(({ data }) => setMembers(data || []))
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
              <div className="assignment-row" key={ddIdx}>
                <span>
                  {pos}:{" "}
                  {member ? (
                    <span style={{ color: rankColors[member.rank] || "#fff" }}>
                      {member.name} ({member.rank})
                    </span>
                  ) : (
                    <span style={{ color: "#888" }}>Unassigned</span>
                  )}
                </span>
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
                <div className="assignment-row" key={ddIdx}>
                  <span>
                    {pos}:{" "}
                    {member ? (
                      <span
                        style={{ color: rankColors[member.rank] || "#fff" }}
                      >
                        {member.name} ({member.rank})
                      </span>
                    ) : (
                      <span style={{ color: "#888" }}>Unassigned</span>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
