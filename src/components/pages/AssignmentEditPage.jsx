import { useEffect, useState } from "react"
import Select from "react-select"
import { supabase } from "../../lib/supabase"
import { rankColors } from "../rankColors"
import "./AssignmentEditPage.css"

// Constants
const APPARATUS = {
  ENGINE_41: {
    name: "Engine 41",
    positions: ["Driver", "Officer", "Nozzle", "Backup", "Bar", "Layout"],
  },
  ENGINE_42: {
    name: "Engine 42",
    positions: ["Driver", "Officer", "Nozzle", "Backup", "Bar", "Layout"],
  },
  TRUCK: {
    name: "Truck",
    positions: ["Driver", "Officer", "OVM", "Roof", "Bar", "Can"],
  },
  RESCUE: {
    name: "Rescue",
    positions: ["Driver", "Officer", "Safety", "Crib", "Crib", "Tool"],
  },
}

const AMBULANCES = [47, 48, 49].map((num) => ({
  name: `Ambulance ${num}`,
  positions: ["Staff", "Staff"],
}))

// Components
const AssignmentSelect = ({ value, onChange, options, isDisabled }) => (
  <Select
    className="member-select"
    value={options.find((opt) => opt.value === value) || null}
    onChange={(opt) => onChange(opt?.value || null)}
    options={options}
    isClearable
    isSearchable
    isDisabled={isDisabled}
    styles={{
      option: (provided, state) => ({
        ...provided,
        color: "#222",
        backgroundColor: state.data.color,
      }),
      singleValue: (provided) => ({
        ...provided,
        color: "#222",
      }),
    }}
  />
)

const AssignmentBox = ({
  name,
  positions,
  boxIdx,
  onAssign,
  memberOptions,
  saving,
  getAssignment,
}) => (
  <div className="assignment-box">
    <h3>{name}</h3>
    {positions.map((pos, posIdx) => (
      <div className="assignment-row vertical-align" key={posIdx}>
        <div className="position-label left-align">{pos}</div>
        <AssignmentSelect
          value={getAssignment(boxIdx, posIdx)}
          onChange={(value) => onAssign(boxIdx, posIdx, value)}
          options={memberOptions}
          isDisabled={saving}
        />
      </div>
    ))}
  </div>
)

export const AssignmentEditPage = () => {
  const [assignments, setAssignments] = useState([])
  const [members, setMembers] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const [assignmentsData, membersData] = await Promise.all([
        supabase.from("assignments").select("box, position, member_id"),
        supabase.from("memberlist").select("id, name, rank"),
      ])
      setAssignments(assignmentsData.data || [])
      setMembers(membersData.data || [])
    }
    fetchData()
  }, [])

  const memberOptions = members.map((m) => ({
    value: m.id,
    label: `${m.name} (${m.rank})`,
    color: rankColors[m.rank]?.background || "#fff",
  }))

  const getAssignment = (boxIdx, posIdx) =>
    assignments.find((a) => a.box === boxIdx && a.position === posIdx)
      ?.member_id || ""

  const handleAssignment = async (boxIdx, posIdx, memberId) => {
    setSaving(true)
    try {
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
        await supabase.from("assignments").upsert(
          {
            box: boxIdx,
            position: posIdx,
            member_id: memberId,
          },
          { onConflict: ["box", "position"] }
        )
        setAssignments((prev) => [
          ...prev.filter((a) => !(a.box === boxIdx && a.position === posIdx)),
          { box: boxIdx, position: posIdx, member_id: memberId },
        ])
      }
    } catch (error) {
      console.error("Error updating assignment:", error)
    }
    setSaving(false)
  }

  return (
    <div className="assignment-edit-page">
      <div className="assignment-grid">
        {/* Main apparatus */}
        {Object.values(APPARATUS).map(({ name, positions }, idx) => (
          <AssignmentBox
            key={idx}
            name={name}
            positions={positions}
            boxIdx={idx}
            onAssign={handleAssignment}
            memberOptions={memberOptions}
            saving={saving}
            getAssignment={getAssignment}
          />
        ))}

        {/* Ambulances */}
        <div className="ambulance-stack">
          {AMBULANCES.map(({ name, positions }, idx) => (
            <AssignmentBox
              key={idx + 4}
              name={name}
              positions={positions}
              boxIdx={idx + 4}
              onAssign={handleAssignment}
              memberOptions={memberOptions}
              saving={saving}
              getAssignment={getAssignment}
              className="ambulance-box"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
