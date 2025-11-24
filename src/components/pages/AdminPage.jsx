import React, { useState, useEffect } from "react"
import Select from "react-select"
import { supabase } from "../../lib/supabase"
import "./AdminPage.css"
import { rankColors, formatRankLabel } from "../rankColors"

export const AdminPage = () => {
  const [input, setInput] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [_error, _setError] = useState("")
  const [message, setMessage] = useState("")
  const [_messageStatus, _setMessageStatus] = useState("")
  const [memberName, setMemberName] = useState("")
  const [memberRank, setMemberRank] = useState("")
  const [memberStatus, setMemberStatus] = useState("")
  const [members, setMembers] = useState([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState(null)
  const [deleteCode, setDeleteCode] = useState("")
  const [_deleteError, _setDeleteError] = useState("")
  const [_showMessagePopup, _setShowMessagePopup] = useState(false)
  const [popup, setPopup] = useState({ show: false, message: "", type: "" })
  const [adminActor, setAdminActor] = useState(() => {
    try {
      return localStorage.getItem("admin_actor") || null
    } catch {
      return null
    }
  })
  const [adminId, setAdminId] = useState(null)
  const [adminName, setAdminName] = useState(null)

  const defaultCarouselConfig = {
    assignment: true,
    calendar: true,
    information: true,
    slide: true,
  }
  const [carouselConfig, setCarouselConfig] = useState(defaultCarouselConfig)
  const [carouselRowId, setCarouselRowId] = useState(null)

  const EXTERNAL_AMBULANCES = [18, 19, 58, 59, 68, 69]
  const [ambulanceStatuses, setAmbulanceStatuses] = useState({})
  const saveTimers = React.useRef({})
  const [ambulanceMenuWidths, setAmbulanceMenuWidths] = useState({})

  const ambulanceOptions = [
    { value: "Medic", label: "Medic", color: "#8e7cc3", textColor: "#333" },
    { value: "Advanced", label: "Advanced", color: "#55a1f7", textColor: "#333" },
    { value: "Ambulance", label: "Ambulance", color: "#2eccca", textColor: "#333" },
    { value: "Unstaffed", label: "Unstaffed", color: "#aaaaaa", textColor: "#333" },
    { value: "OOS", label: "OOS", color: "#ff7575", textColor: "#333" },
  ]


  const rankOptions = Object.keys(rankColors).map((rank) => ({
    value: rank,
    label: formatRankLabel(rank),
    color: rankColors[rank].background,
    textColor: rankColors[rank].color,
  }))

  const rankOrder = Object.keys(rankColors)

  useEffect(() => {
    if (isLoggedIn) {
      supabase
        .from("memberlist")
        .select("id, name, rank")
        .then(({ data }) => setMembers(data || []))
    }
    const fetchCarouselConfig = async () => {
      try {
        const { data, error } = await supabase
          .from("carousel_settings")
          .select("id, config")
          .limit(1)
          .single()
        if (!error && data && data.config) {
          setCarouselConfig(data.config)
          setCarouselRowId(data.id)
        } else {
          setCarouselConfig(defaultCarouselConfig)
        }
      } catch {
        setCarouselConfig(defaultCarouselConfig)
        showPopup("Could not load carousel settings from server", "error")
      }
    }
    fetchCarouselConfig()
  }, [isLoggedIn, memberStatus])

  useEffect(() => {
    if (!isLoggedIn) return
    let mounted = true
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("info_statuses")
          .select("station, status")
          .in("station", EXTERNAL_AMBULANCES)
        if (error) throw error
        if (!mounted) return
        const map = {}
        ;(data || []).forEach((r) => { map[r.station] = r.status })
        setAmbulanceStatuses(map)
      } catch (e) {
        console.error("Failed to load ambulance statuses:", e)
      }
    }
    load()
    return () => { mounted = false }
  }, [isLoggedIn])

  const showPopup = (message, type = "info", duration = 2000) => {
    setPopup({ show: true, message, type })
    setTimeout(() => setPopup({ show: false, message: "", type: "" }), duration)
  }

  const ensureActor = () => {
    if (adminName) return adminName
    if (adminId) return adminId
    if (adminActor) return adminActor
    try {
      let existing = localStorage.getItem("admin_actor")
      if (existing) {
        setAdminActor(existing)
        return existing
      }
      const id = (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : `anon-${Date.now()}-${Math.floor(Math.random() * 10000)}`
  try { localStorage.setItem("admin_actor", id) } catch { /* ignore */ }
      setAdminActor(id)
      return id
    } catch {
      return null
    }
  }

  const recordAdminAudit = async (action, details = {}) => {
    try {
      const actorCandidate = ensureActor()
      const actor = adminName || actorCandidate || null
      const detailsWithAdmin = {
        ...details,
        admin: { id: adminId || null, name: adminName || actorCandidate || null },
      }
      const { error: rpcErr } = await supabase.rpc("insert_admin_audit", {
        p_actor: actor,
        p_action: action,
        p_details: detailsWithAdmin,
      })
      if (rpcErr) {
        await supabase.from("admin_audit").insert([{ actor, action, details: detailsWithAdmin }])
      }
    } catch {
      
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
  _setError("")
    try {
      const { data, error } = await supabase
        .from("admins")
        .select("id, name")
        .eq("passcode", input)
        .limit(1)
        .single()
      if (error || !data) {
        showPopup("Incorrect passcode.", "error")
        void recordAdminAudit("login_failed", { reason: "incorrect_passcode" })
        return
      }
      setIsLoggedIn(true)
      setInput("")
      setAdminId(data.id)
      setAdminName(data.name || null)
      showPopup("Login successful!", "success")
      void recordAdminAudit("login", { success: true, admin: { id: data.id, name: data.name } })
    } catch {
      showPopup("Error connecting to server.", "error")
      void recordAdminAudit("login_failed", { reason: "server_error" })
    }
  }

  // Update scrolling message
  const handleMessageSubmit = async (e) => {
    e.preventDefault()
  _setMessageStatus("")
    const { data } = await supabase
      .from("sliding_messages")
      .select("id")
      .limit(1)
      .single()
    if (data) {
      const uuid = data.id
      const { error: updateError } = await supabase
        .from("sliding_messages")
        .update({ message })
        .eq("id", uuid)
      if (updateError) {
        showPopup("Failed to update message.", "error")
        void recordAdminAudit("update_message_failed", { error: updateError.message || "unknown" })
      } else {
        showPopup("Message updated!", "success")
        void recordAdminAudit("update_message", { message })
      }
    } else {
      showPopup("Could not find message row.", "error")
      void recordAdminAudit("update_message_failed", { error: "no_message_row" })
    }
  }

  // Add member
  const handleMemberSubmit = async (e) => {
    e.preventDefault()
    setMemberStatus("")
    const { error } = await supabase
      .from("memberlist")
      .insert([{ name: memberName, rank: memberRank }])
    if (error) {
      showPopup("Failed to add member.", "error")
      void recordAdminAudit("add_member_failed", { name: memberName, rank: memberRank, error: error.message || "unknown" })
    } else {
      showPopup("Member added!", "success")
      void recordAdminAudit("add_member", { name: memberName, rank: memberRank })
      setMemberName("")
      setMemberRank("")
      // Fetch updated members list
      const { data } = await supabase
        .from("memberlist")
        .select("id, name, rank")
      setMembers(data || [])
    }
  }

  // Show confirm dialog
  const handleDeleteClick = (id) => {
    setDeleteTargetId(id)
    setShowDeleteConfirm(true)
    setDeleteCode("")
  _setDeleteError("")
    // record that a delete was initiated (who initiated will be the actor stored in admin_audit)
    void recordAdminAudit("delete_member_initiated", { targetId: id })
  }

  // Edit member state
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState("")
  const [editingRank, setEditingRank] = useState("")

  const startEditMember = (member) => {
    setEditingId(member.id)
    setEditingName(member.name)
    setEditingRank(member.rank)
  }

  const cancelEditMember = () => {
    setEditingId(null)
    setEditingName("")
    setEditingRank("")
  }

  const saveEditMember = async (id) => {
    const prev = members.find((m) => m.id === id)
    if (!prev) return
    const updated = { name: editingName, rank: editingRank }
    const { error } = await supabase.from("memberlist").update(updated).eq("id", id)
    if (error) {
      showPopup("Failed to update member.", "error")
      void recordAdminAudit("edit_member_failed", { id, prev, attempted: updated, error: error.message || "unknown" })
    } else {
      showPopup("Member updated!", "success")
      // update local state
      setMembers((cur) => cur.map((m) => (m.id === id ? { ...m, ...updated } : m)))
      void recordAdminAudit("edit_member", { id, prev, next: updated })
      cancelEditMember()
    }
  }

  // Save a single external ambulance status (upsert into info_statuses)
  const saveAmbulanceStatus = async (station, explicitStatus = undefined) => {
    const status = explicitStatus !== undefined
      ? (explicitStatus === "" ? null : explicitStatus)
      : (ambulanceStatuses[station] || null)
    try {
      const payload = { station, status }
      const { data, error } = await supabase
        .from("info_statuses")
        .upsert(payload, { returning: "representation" })
      if (error) throw error
      showPopup(`Saved status for ${station}`, "success", 1200)
      void recordAdminAudit("update_external_ambulance_status", { station, status })
      // notify local listeners immediately so UI can update instantly
      try {
        window.dispatchEvent(new CustomEvent("externalAmbulanceStatusChanged", { detail: { station, status } }))
      } catch (_e) {
        // ignore if window unavailable
      }
      return true
    } catch (e) {
      console.error("Failed to save ambulance status:", e)
      showPopup("Failed to save status", "error", 2000)
      void recordAdminAudit("update_external_ambulance_status_failed", { station, status, error: e.message || String(e) })
      return false
    }
  }

  // Confirm delete handler
  const handleConfirmDelete = async (e) => {
    e.preventDefault()
  _setDeleteError("")
    // Verify the entered passcode matches an admin in `admins` table
    try {
      const { data, error } = await supabase
        .from("admins")
        .select("id, name")
        .eq("passcode", deleteCode)
        .limit(1)
        .single()
      if (error || !data) {
        showPopup("Incorrect passcode.", "error")
        void recordAdminAudit("delete_member_failed", { id: deleteTargetId, reason: "incorrect_passcode" })
        return
      }
      // passcode verified; optionally could check that the current logged-in admin matches
    } catch {
      showPopup("Error connecting to server.", "error")
      void recordAdminAudit("delete_member_failed", { id: deleteTargetId, reason: "fetch_passcode_error" })
      return
    }
    // capture target member details for audit
    const targetMember = members.find((m) => m.id === deleteTargetId) || { id: deleteTargetId }
    const { error } = await supabase
      .from("memberlist")
      .delete()
      .eq("id", deleteTargetId)
    if (error) {
      showPopup("Failed to delete member.", "error")
      void recordAdminAudit("delete_member_failed", { id: deleteTargetId, error: error.message || "unknown" })
    } else {
      showPopup("Member deleted!", "success")
      setMembers(members.filter((m) => m.id !== deleteTargetId))
      void recordAdminAudit("delete_member", { target: targetMember })
    }
    setShowDeleteConfirm(false)
    setDeleteTargetId(null)
    setDeleteCode("")
  _setDeleteError("")
  }

  // Cancel delete
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
    setDeleteTargetId(null)
    setDeleteCode("")
    _setDeleteError("")
    void recordAdminAudit("delete_member_cancelled", {})
  }

  if (!isLoggedIn) {
    return (
      <div className="admin-container admin-login">
        <h1 className="admin-title">Admin Login</h1>
        <form onSubmit={handleLogin} className="admin-form" aria-label="Admin login form">
          <label htmlFor="admin-passcode" className="visually-hidden">Passcode</label>
          <input
            id="admin-passcode"
            type="password"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, ""))}
            placeholder="4-digit passcode"
            className="admin-input"
            required
            aria-required="true"
          />
          <button type="submit" className="admin-button" aria-label="Login">Login</button>
        </form>
        {popup.show && <div className={`admin-popup ${popup.type}`}>{popup.message}</div>}
      </div>
    )
  }

  // Admin content after login
  return (
    <div className="admin-container">
      <h1 className="admin-title">Admin Dashboard</h1>
      <div className="admin-grid" aria-live="polite">
  {/* Add Member Card */}
  <section className="admin-card add-member-card" aria-labelledby="add-member-heading">
          <h2 id="add-member-heading" className="card-title">Add Member</h2>
          <form className="stack-form add-member-form" onSubmit={handleMemberSubmit} aria-label="Add member form">
            <div className="field name-field">
              <label htmlFor="new-member-name" className="input-label">Name</label>
              <input
                id="new-member-name"
                className="admin-input"
                type="text"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="New member name"
                required
              />
            </div>
            <div className="field rank-field">
              <label htmlFor="new-member-rank" className="input-label">Rank</label>
              <Select
                inputId="new-member-rank"
                className="member-select"
                options={rankOptions}
                value={rankOptions.find((opt) => opt.value === memberRank) || null}
                onChange={(opt) => setMemberRank(opt ? opt.value : "")}
                isClearable
                isSearchable
                placeholder="Select rank"
                menuPlacement="auto"
                formatOptionLabel={(option) => (
                  <span style={{ color: option.textColor, fontWeight: 600 }}>
                    {option.label}
                  </span>
                )}
                styles={{
                  option: (provided, state) => ({
                    ...provided,
                    backgroundColor: state.data.color,
                    color: state.data.textColor,
                    fontFamily: '"BebasNeue", Arial, sans-serif',
                    letterSpacing: "2px",
                    fontWeight: 600,
                  }),
                  singleValue: (provided, state) => ({
                    ...provided,
                    color: state.data.textColor,
                    backgroundColor: state.data.color,
                    fontFamily: '"BebasNeue", Arial, sans-serif',
                    letterSpacing: "2px",
                    padding: "2px 8px",
                    borderRadius: "0.3em",
                    fontWeight: 600,
                  }),
                  control: (provided) => ({
                    ...provided,
                    backgroundColor: "#fff",
                    color: "#222",
                    border: "1px solid #444",
                    fontFamily: '"BebasNeue", Arial, sans-serif',
                    letterSpacing: "2px",
                    minHeight: "32px",
                    height: "32px",
                  }),
                  valueContainer: (provided) => ({
                    ...provided,
                    height: "32px",
                    padding: "0 8px",
                    display: "flex",
                    alignItems: "center",
                  }),
                  indicatorsContainer: (provided) => ({
                    ...provided,
                    height: "32px",
                    alignItems: "center",
                  }),
                  menu: (provided) => ({
                    ...provided,
                    backgroundColor: "#fff",
                    color: "#222",
                    zIndex: 3000,
                  }),
                }}
                menuPosition="fixed"
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              />
            </div>
            <div className="form-actions">
              <button
                type="submit"
                className="admin-button"
                disabled={!memberName || !memberRank}
                aria-disabled={!memberName || !memberRank}
              >
                Add Member
              </button>
            </div>
          </form>
        </section>

        {/* Members Table moved inside grid for layout */}
        <section className="admin-table-wrapper admin-card" aria-labelledby="members-heading">
        <h2 id="members-heading" className="card-title">Members</h2>
        <div className="admin-table-container">
          <table className="admin-table" aria-label="Members list">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Rank</th>
                <th scope="col" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {members
                .slice()
                .sort((a, b) => {
                  const aIdx = rankOrder.indexOf(a.rank)
                  const bIdx = rankOrder.indexOf(b.rank)
                  if (aIdx === -1 && bIdx === -1) return 0
                  if (aIdx === -1) return 1
                  if (bIdx === -1) return -1
                  return aIdx - bIdx
                })
                .map((member) => (
                  <tr key={member.id}>
                    <td data-label="Name">
                      {editingId === member.id ? (
                        <input
                          className="admin-input"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          aria-label="Edit member name"
                        />
                      ) : (
                        member.name
                      )}
                    </td>
                    <td data-label="Rank">
                          {editingId === member.id ? (
                        <select
                          className="admin-input"
                          value={editingRank}
                          onChange={(e) => setEditingRank(e.target.value)}
                          aria-label="Edit member rank"
                        >
                          <option value="">Select rank</option>
                          {Object.keys(rankColors).map((r) => (
                            <option key={r} value={r}>
                                  {formatRankLabel(r)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className="rank-badge"
                          style={{
                            background: rankColors[member.rank]?.background,
                            color: rankColors[member.rank]?.color,
                          }}
                        >
                          {formatRankLabel(member.rank)}
                        </span>
                      )}
                    </td>
                    <td data-label="Actions">
                      {editingId === member.id ? (
                        <div className="action-group">
                          <button
                            className="admin-button sm" onClick={() => saveEditMember(member.id)} aria-label="Save member changes"
                          >
                            Save
                          </button>
                          <button
                            className="admin-button sm" onClick={cancelEditMember} aria-label="Cancel member edit"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="action-group">
                          <button
                            className="admin-button sm"
                            onClick={() => startEditMember(member)}
                            style={{ minWidth: 60 }}
                            aria-label={`Edit ${member.name}`}
                          >
                            Edit
                          </button>
                          <button
                            className="admin-button sm danger"
                            onClick={() => handleDeleteClick(member.id)}
                            aria-label={`Delete ${member.name}`}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        </section>
        {/* Right column stack: carousel, message, ambulances */}
        <div className="admin-right-column">
          <section className="admin-card carousel-card" aria-labelledby="carousel-heading">
            <h2 id="carousel-heading" className="card-title">Carousel Pages</h2>
            <div className="carousel-toggle-row">
              {Object.keys(defaultCarouselConfig).map((key) => (
                <label key={key} className="carousel-toggle">
                  <input
                    type="checkbox"
                    className="carousel-checkbox"
                    checked={!!carouselConfig[key]}
                    aria-checked={!!carouselConfig[key]}
                    aria-label={`Toggle ${key.replace(/([A-Z])/g, " $1").trim()} page`}
                    onChange={async (e) => {
                      const next = { ...carouselConfig, [key]: e.target.checked }
                      setCarouselConfig(next)
                      try {
                        if (carouselRowId) {
                          const { data, error } = await supabase
                            .from("carousel_settings")
                            .update({ config: next, updated_at: new Date().toISOString() })
                            .eq("id", carouselRowId)
                            .select()
                          if (error) throw error
                        } else {
                          const { data, error } = await supabase
                            .from("carousel_settings")
                            .insert([{ config: next }])
                            .select()
                          if (error) throw error
                          if (data && data[0] && data[0].id) setCarouselRowId(data[0].id)
                        }
                        window.dispatchEvent(new Event("carouselPagesChanged"))
                        showPopup("Carousel updated", "success", 1500)
                        void recordAdminAudit("update_carousel", { config: next })
                      } catch (_err) {
                        console.error("Failed to save carousel settings", _err)
                        showPopup("Failed to save", "error", 2000)
                      }
                    }}
                  />
                  <span className="carousel-slider" aria-hidden="true" />
                  <span className="carousel-label">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="admin-card message-card" aria-labelledby="message-heading">
            <h2 id="message-heading" className="card-title">Scrolling Message</h2>
            <form onSubmit={handleMessageSubmit} className="stack-form" aria-label="Update scrolling message form">
              <label htmlFor="scrolling-message" className="input-label">Message</label>
              <input
                id="scrolling-message"
                className="admin-input"
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter new message"
              />
              <button type="submit" className="admin-button" aria-label="Update scrolling message">Update</button>
            </form>
          </section>

          <section className="admin-card ambulance-card" aria-labelledby="ambulance-heading">
            <h2 id="ambulance-heading" className="card-title">External Ambulances</h2>
            <div className="ambulance-list">
              {EXTERNAL_AMBULANCES.map((st) => (
                <div className="ambulance-row" key={st}>
                  <div className="ambulance-id">{st}</div>
                  <Select
                    inputId={`ambulance-${st}`}
                    className="ambulance-select"
                    classNamePrefix="ambulance-select"
                    options={ambulanceOptions}
                    value={ambulanceOptions.find((o) => o.value === (ambulanceStatuses[st] ?? "")) || null}
                    onChange={(opt) => {
                      const val = opt ? opt.value : ""
                      setAmbulanceStatuses((cur) => ({ ...cur, [st]: val }))
                      if (saveTimers.current[st]) clearTimeout(saveTimers.current[st])
                      saveTimers.current[st] = setTimeout(async () => {
                        try {
                          setPopup({ show: true, message: `Saving status for ${st}...`, type: "info" })
                        } catch (_e) {
                          /* ignore */
                        }
                        await saveAmbulanceStatus(st, val)
                        delete saveTimers.current[st]
                      }, 600)
                    }}
                    isSearchable={false}
                    placeholder=""
                    menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                    menuPosition="fixed"
                    menuPlacement="auto"
                    onMenuOpen={() => {
                      try {
                        const el = typeof document !== "undefined" ? document.getElementById(`ambulance-${st}`) : null
                        const control = el ? (el.closest && el.closest('.ambulance-select__control')) || el.parentElement : null
                        const rect = control ? control.getBoundingClientRect() : null
                        if (rect) setAmbulanceMenuWidths((cur) => ({ ...cur, [st]: `${rect.width}px` }))
                      } catch (_e) {}
                    }}
                    menuWidth={ambulanceMenuWidths[st]}
                    styles={{
                      control: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.selectProps.value?.color || "#fff",
                        border: "1px solid #444",
                        minHeight: "1.4rem",
                        height: "1.4rem",
                        boxShadow: "none",
                      }),
                      valueContainer: (provided) => ({
                        ...provided,
                        height: "1.4rem",
                        padding: "0 0.5rem",
                        display: "flex",
                        alignItems: "center",
                      }),
                      indicatorsContainer: (provided) => ({
                        ...provided,
                        height: "1.4rem",
                        display: "flex",
                        alignItems: "center",
                      }),
                      singleValue: (provided, state) => ({
                        ...provided,
                        color: state.data?.textColor || "#222",
                        backgroundColor: "transparent",
                        padding: 0,
                        borderRadius: 0,
                        fontFamily: '"BebasNeue", Arial, sans-serif',
                        fontWeight: 700,
                        letterSpacing: "2px",
                      }),
                      option: (provided, state) => ({
                        ...provided,
                        minHeight: "1.4rem",
                        lineHeight: "1.4rem",
                        padding: "0 0.5rem",
                        color: state.data?.textColor || state.selectProps.value?.textColor || "#222",
                        backgroundColor: state.data?.color || "transparent",
                        fontFamily: '"BebasNeue", Arial, sans-serif',
                        fontWeight: 700,
                        letterSpacing: "2px",
                      }),
                      menuList: (provided) => ({
                        ...provided,
                        padding: "0.1rem 0",
                        boxSizing: "border-box",
                        maxHeight: "calc(1.4rem * 8)",
                        backgroundColor: "transparent",
                        color: "inherit",
                      }),
                      menu: (provided, state) => {
                        const w = state.selectProps.menuWidth || provided.width
                        return {
                          ...provided,
                          zIndex: 3000,
                          width: w,
                          minWidth: "0",
                          boxSizing: "border-box",
                          backgroundColor: provided.backgroundColor,
                          color: provided.color,
                        }
                      },
                    }}
                    aria-label={`Status for ambulance ${st}`}
                  />
                  <div className="ambulance-actions">
                    <div className="ambulance-saved" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      {showDeleteConfirm && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-heading">
          <div className="admin-modal">
            <h3 id="delete-heading">Confirm Delete</h3>
            <p>Enter your 4-digit passcode to confirm deletion:</p>
            <form onSubmit={handleConfirmDelete} aria-label="Confirm delete member form">
              <label htmlFor="delete-passcode" className="visually-hidden">Passcode</label>
              <input
                id="delete-passcode"
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                value={deleteCode}
                onChange={(e) => setDeleteCode(e.target.value.replace(/\D/g, ""))}
                className="admin-input"
                placeholder="4-digit passcode"
                required
                autoFocus
              />
              <div className="modal-actions">
                <button type="submit" className="admin-button danger" aria-label="Confirm deletion">Confirm Delete</button>
                <button type="button" className="admin-button" onClick={handleCancelDelete} aria-label="Cancel deletion">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {popup.show && <div className={`admin-popup ${popup.type}`}>{popup.message}</div>}
    </div>
  )
}
