import { useEffect, useState, useMemo } from "react"
import Select from "react-select"
import { supabase } from "../../lib/supabase"
import { rankColors, formatRankLabel } from "../rankColors"
import "./AssignmentEditPage.css"

const APPARATUS = {
  ENGINE_41: {
    name: "Engine 41",
    positions: ["CHAUFFEUR", "OFFICER", "NOZZLE", "LAYOUT", "FORCIBLE ENTRY", "BACKUP"],
  },
  ENGINE_42: {
    name: "Engine 42",
    positions: ["CHAUFFEUR", "OFFICER", "NOZZLE", "LAYOUT", "FORCIBLE ENTRY", "BACKUP"],
  },
  TRUCK: {
    name: "Truck",
    positions: ["CHAUFFEUR", "OFFICER", "OVM", "IRONS", "ROOF", "CAN"],
  },
  RESCUE: {
    name: "Rescue",
    positions: ["CHAUFFEUR", "OFFICER", "SAFETY", "TOOL", "CRIB", "CRIB"],
  },
}

const AMBULANCES = [47, 48, 49].map((num) => ({
  name: `Ambulance ${num}`,
  positions: ["Staff", "Staff"],
}))

const AssignmentSelect = ({ value, onChange, options, isDisabled }) => (
  <Select
    className="member-select"
    classNamePrefix="member-select"
    value={options.find((opt) => opt.value === value) || null}
    onChange={(opt) => onChange(opt?.value || null)}
    options={options}
    menuPortalTarget={typeof document !== "undefined" ? document.body : null}
    menuPosition="fixed"
    menuPlacement="auto"
    menuShouldScrollIntoView={false}
    isClearable
    isSearchable
    isDisabled={isDisabled}
    styles={{
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
      
    }

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  


  const memberOptions = useMemo(
    () => {
      const RANK_ORDER = [
        "CHIEF",
        "CHIEFEMT",
        "CHIEFMEDIC",
        "CAPTAIN",
        "CAPTAINEMT",
        "CAPTAINMEDIC",
        "LIEUTENANT",
        "LIEUTENANTEMT",
        "LIEUTENANTMEDIC",
        "ENGINEER",
        "ENGINEEREMT",
        "ENGINEERMEDIC",
        "FIREFIGHTER",
        "FIREFIGHTEREMT",
        "FIREFIGHTERMEDIC",
        "GREENSHIELD",
        "GREENSHIELDEMT",
        "GREENSHIELDMEDIC",
        "PARAMEDIC",
        "AEMT",
        "EMT",
        "JUNIOR",
      ]

      const sorted = [...members].sort((a, b) => {
        const ia = RANK_ORDER.indexOf(String(a.rank).toUpperCase())
        const ib = RANK_ORDER.indexOf(String(b.rank).toUpperCase())
        const ra = ia === -1 ? RANK_ORDER.length : ia
        const rb = ib === -1 ? RANK_ORDER.length : ib
        if (ra !== rb) return ra - rb
        return (a.name || "").localeCompare(b.name || "")
      })

      return sorted.map((m) => ({
        value: m.id,
        label: `${m.name} — ${formatRankLabel(m.rank)}`,
        color: rankColors[m.rank]?.background || "#fff",
      }))
    },
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
