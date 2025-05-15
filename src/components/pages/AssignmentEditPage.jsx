import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { rankColors } from "../rankColors"
import Select from "react-select"
import "./AssignmentEditPage.css"

export const AssignmentEditPage = () => {
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
    ["Driver", "Officer", "Nozzle", "Backup", "Bar", "Layout"], // Engine
    ["Driver", "Officer", "OVM", "Roof", "Bar", "Can"], // Truck
    ["Driver", "Officer", "Safety", "Crib", "Crib", "Tool"], // Rescue
    ["Staff", "Staff"], // Ambulance 47
    ["Staff", "Staff"], // Ambulance 48
    ["Staff", "Staff"], // Ambulance 49
  ]

  const [assignments, setAssignments] = useState([])
  const [members, setMembers] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from("assignments")
      .select("box, position, member_id")
      .then(({ data }) => setAssignments(data || []))
    supabase
      .from("memberlist")
      .select("id, name, rank")
      .then(({ data }) => setMembers(data || []))
  }, [])

  // Helper to get member id for a box/position
  const getAssignment = (boxIdx, posIdx) => {
    return (
      assignments.find((a) => a.box === boxIdx && a.position === posIdx)
        ?.member_id || ""
    )
  }

  // Helper to build options
  const memberOptions = members.map((m) => ({
    value: m.id,
    label: `${m.name} (${m.rank})`,
    color: rankColors[m.rank]?.background || "#fff",
  }))

  // Save assignment change
  const handleChange = async (boxIdx, posIdx, memberId) => {
    setSaving(true)
    // If memberId is null, remove the assignment
    if (memberId === null) {
      await supabase
        .from("assignments")
        .delete()
        .eq("box", boxIdx)
        .eq("position", posIdx)
      setAssignments((prev) =>
        prev.filter((a) => !(a.box === boxIdx && a.position === posIdx))
      )
    } else {
      // Upsert assignment
      await supabase.from("assignments").upsert(
        {
          box: boxIdx,
          position: posIdx,
          member_id: memberId,
        },
        { onConflict: ["box", "position"] }
      )
      // Update local state
      setAssignments((prev) => {
        const filtered = prev.filter(
          (a) => !(a.box === boxIdx && a.position === posIdx)
        )
        return [
          ...filtered,
          { box: boxIdx, position: posIdx, member_id: memberId },
        ]
      })
    }
    setSaving(false)
  }

  return (
    <div className="carousel-page assignment-grid ambulance-layout">
      {/* Main apparatus side by side */}
      {boxNames.slice(0, 3).map((name, boxIdx) => (
        <div className="assignment-box" key={boxIdx}>
          <h3>{name}</h3>
          {boxPositions[boxIdx].map((pos, ddIdx) => {
            const selectedId = getAssignment(boxIdx, ddIdx)
            return (
              <div className="assignment-row vertical-align" key={ddIdx}>
                <div className="position-label left-align">{pos}</div>
                <Select
                  className="member-select"
                  value={
                    memberOptions.find((opt) => opt.value === selectedId) ||
                    null
                  }
                  onChange={(opt) =>
                    handleChange(boxIdx, ddIdx, opt ? opt.value : null)
                  }
                  options={memberOptions}
                  isClearable
                  isSearchable
                  isDisabled={saving}
                  styles={{
                    option: (provided, state) => ({
                      ...provided,
                      color: "#222",
                      backgroundColor: state.data.color,
                    }),
                    singleValue: (provided, state) => ({
                      ...provided,
                      color: "#222",
                    }),
                  }}
                />
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
              const selectedId = getAssignment(boxIdx + 3, ddIdx)
              return (
                <div className="assignment-row vertical-align" key={ddIdx}>
                  <div className="position-label left-align">{pos}</div>
                  <Select
                    className="member-select"
                    value={
                      memberOptions.find((opt) => opt.value === selectedId) ||
                      null
                    }
                    onChange={(opt) =>
                      handleChange(boxIdx + 3, ddIdx, opt ? opt.value : null)
                    }
                    options={memberOptions}
                    isClearable
                    isSearchable
                    isDisabled={saving}
                    styles={{
                      option: (provided, state) => ({
                        ...provided,
                        color: "#222",
                        backgroundColor: state.data.color,
                      }),
                      singleValue: (provided, state) => ({
                        ...provided,
                        color: "#222",
                      }),
                    }}
                  />
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
