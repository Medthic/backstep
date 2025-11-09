import { useEffect, useState, useMemo } from "react"
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
    /* Ensure react-select internal classes use this prefix so your CSS selectors like
       .member-select__menu or .member-select__option will apply even when the menu is portaled */
    classNamePrefix="member-select"
    value={options.find((opt) => opt.value === value) || null}
    onChange={(opt) => onChange(opt?.value || null)}
    options={options}
    /* Render the menu into document.body to avoid clipping by parent containers */
    menuPortalTarget={typeof document !== "undefined" ? document.body : null}
    /* Use fixed positioning so the menu overlays the viewport and can appear above or below as needed */
    menuPosition="fixed"
    /* Let react-select choose the best placement (top or bottom) */
    menuPlacement="auto"
    /* Prevent automatic scrolling of the page when opening the menu */
    menuShouldScrollIntoView={false}
    isClearable
    isSearchable
    isDisabled={isDisabled}
    styles={{
      /* Keep only dynamic styles here: per-option background color depends on rank */
      option: (provided, state) => ({
        ...provided,
        backgroundColor: state.data?.color || provided.backgroundColor,
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
  savingMap,
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
          isDisabled={!!savingMap[`${boxIdx}-${posIdx}`]}
        />
      </div>
    ))}
  </div>
)

export const AssignmentEditPage = () => {
  const [assignments, setAssignments] = useState([])
  const [members, setMembers] = useState([])
  const [savingMap, setSavingMap] = useState({})

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

    // Subscribe to realtime assignment updates so UI stays live without full reloads
    let channel = null
    try {
      channel = supabase
        .channel("realtime:assignments")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "assignments" },
          (payload) => {
            const { eventType } = payload
            if (eventType === "INSERT" || eventType === "UPDATE") {
              const row = payload.new
              setAssignments((prev) => {
                const filtered = prev.filter(
                  (a) => !(a.box === row.box && a.position === row.position)
                )
                return [
                  ...filtered,
                  { box: row.box, position: row.position, member_id: row.member_id },
                ]
              })
            } else if (eventType === "DELETE") {
              const row = payload.old
              setAssignments((prev) =>
                prev.filter((a) => !(a.box === row.box && a.position === row.position))
              )
            }
          }
        )
        .subscribe()
    } catch {
      // ignore
    }

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  const memberOptions = useMemo(
    () =>
      members.map((m) => ({
        value: m.id,
        label: `${m.name} (${m.rank})`,
        color: rankColors[m.rank]?.background || "#fff",
      })),
    [members]
  )

  const getAssignment = (boxIdx, posIdx) =>
    assignments.find((a) => a.box === boxIdx && a.position === posIdx)
      ?.member_id || ""

  const handleAssignment = async (boxIdx, posIdx, memberId) => {
    const key = `${boxIdx}-${posIdx}`
    setSavingMap((m) => ({ ...m, [key]: true }))
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
        setAssignments((prev) => {
          const filtered = prev.filter((a) => !(a.box === boxIdx && a.position === posIdx))
          return [...filtered, { box: boxIdx, position: posIdx, member_id: memberId }]
        })
      }
    } catch (error) {
      console.error("Error updating assignment:", error)
    }
    setSavingMap((m) => {
      const copy = { ...m }
      delete copy[key]
      return copy
    })
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
            savingMap={savingMap}
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
              savingMap={savingMap}
              getAssignment={getAssignment}
              className="ambulance-box"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
