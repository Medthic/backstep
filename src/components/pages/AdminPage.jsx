import React, { useState, useEffect } from "react"
import Select from "react-select"
import { supabase } from "../../lib/supabase"
import "./AdminPage.css"
import { rankColors } from "../rankColors"

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
  // Admin actor id stored in localStorage to identify the client making changes
  const [adminActor, setAdminActor] = useState(() => {
    try {
      return localStorage.getItem("admin_actor") || null
    } catch {
      return null
    }
  })
  const [adminId, setAdminId] = useState(null)
  const [adminName, setAdminName] = useState(null)

  // Carousel pages configuration (Supabase-backed)
  const defaultCarouselConfig = {
    assignment: true,
    calendar: true,
    information: true,
  }
  // store DB row id for carousel settings if present
  const [carouselConfig, setCarouselConfig] = useState(defaultCarouselConfig)
  const [carouselRowId, setCarouselRowId] = useState(null)

  // Prepare options for react-select
  const rankOptions = Object.keys(rankColors).map((rank) => ({
    value: rank,
    label: rank.replace(/([A-Z])/g, " $1").trim(),
    color: rankColors[rank].background,
    textColor: rankColors[rank].color,
  }))

  // Define the order of ranks for sorting
  const rankOrder = Object.keys(rankColors)

  useEffect(() => {
    if (isLoggedIn) {
      supabase
        .from("memberlist")
        .select("id, name, rank")
        .then(({ data }) => setMembers(data || []))
    }
    // load carousel config from Supabase when admin page mounts / login state changes
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
          // no row yet — keep defaults until a row is created
          setCarouselConfig(defaultCarouselConfig)
        }
      } catch {
        // on error, keep defaults and notify admin
        setCarouselConfig(defaultCarouselConfig)
        showPopup("Could not load carousel settings from server", "error")
      }
    }
    fetchCarouselConfig()
  }, [isLoggedIn, memberStatus])

  // Helper to show popup
  const showPopup = (message, type = "info", duration = 2000) => {
    setPopup({ show: true, message, type })
    setTimeout(() => setPopup({ show: false, message: "", type: "" }), duration)
  }

  // Ensure we have an actor id (create and persist if needed)
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
      // create a simple uuid using crypto if available
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

  // Helper to record admin audit events in Supabase including actor
  const recordAdminAudit = async (action, details = {}) => {
    try {
      // ensure actor exists; prefer human-readable name when available
      const actorCandidate = ensureActor()
      const actor = adminName || actorCandidate || null
      // attach admin info into details for easier querying
      const detailsWithAdmin = {
        ...details,
        admin: { id: adminId || null, name: adminName || actorCandidate || null },
      }
      // Use RPC to insert audit row via a SECURITY DEFINER function (bypasses RLS safely)
      const { error: rpcErr } = await supabase.rpc("insert_admin_audit", {
        p_actor: actor,
        p_action: action,
        p_details: detailsWithAdmin,
      })
      if (rpcErr) {
        // last-resort: try direct insert (may fail due to RLS)
        await supabase.from("admin_audit").insert([{ actor, action, details: detailsWithAdmin }])
      }
    } catch {
      // non-fatal: ignore audit failures
    }
  }

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault()
  _setError("")
    // Authenticate against `admins` table by passcode and set admin identity
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
      // success
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
      <div className="admin-container">
        <h1 className="admin-title">Admin Login</h1>
        <form onSubmit={handleLogin} className="admin-form">
          <input
            type="password"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, ""))}
            placeholder="4-digit passcode"
            className="admin-input"
            required
          />
          <button type="submit" className="admin-button">
            Login
          </button>
        </form>
        {/* Popup for login errors */}
        {popup.show && (
          <div className={`admin-popup ${popup.type}`}>{popup.message}</div>
        )}
      </div>
    )
  }

  // Admin content after login
  return (
    <div className="admin-container">
      <h1 className="admin-title">Admin Page</h1>
      {/* Carousel page toggles */}
      <div className="carousel-settings">
        <h3 className="carousel-title">Carousel Pages</h3>
        <div className="carousel-toggle-row">
          {Object.keys(defaultCarouselConfig).map((key) => (
            <label key={key} className="carousel-toggle">
              <input
                type="checkbox"
                className="carousel-checkbox"
                checked={!!carouselConfig[key]}
                onChange={async (e) => {
                  const next = { ...carouselConfig, [key]: e.target.checked }
                  setCarouselConfig(next)
                  // try saving to Supabase
                  try {
                    if (carouselRowId) {
                      // request the updated row back with .select() so we can inspect results
                      const { data, error } = await supabase
                        .from("carousel_settings")
                        .update({ config: next, updated_at: new Date().toISOString() })
                        .eq("id", carouselRowId)
                        .select()
                      if (error) throw error
                      // Some RLS/policy setups allow the write but prevent returning rows.
                      // Treat an empty array as a successful write (no error) but log it for debugging.
                      if (!data || (Array.isArray(data) && data.length === 0)) {
                        console.warn("carousel_settings update returned no rows but update succeeded")
                      } else {
                        console.log("carousel_settings update result:", data)
                      }
                    } else {
                      // ask Supabase to return the inserted row so we can capture its id
                      const { data, error } = await supabase
                        .from("carousel_settings")
                        .insert([{ config: next }])
                        .select()
                      if (error) throw error
                      console.log("carousel_settings insert result:", data)
                      // store the id for future updates
                      if (data && data[0] && data[0].id) {
                        setCarouselRowId(data[0].id)
                      } else {
                        // if insert returned no row (RLS), try to fetch the single row id as a fallback
                        try {
                          const { data: fetched, error: fetchErr } = await supabase
                            .from("carousel_settings")
                            .select("id")
                            .limit(1)
                            .single()
                          if (!fetchErr && fetched && fetched.id) {
                            setCarouselRowId(fetched.id)
                          } else if (fetchErr) {
                            console.warn("Could not fetch carousel_settings id after insert:", fetchErr)
                          }
                        } catch (_e) {
                          console.warn("Fallback fetch for carousel_settings id failed", _e)
                        }
                      }
                    }
                    // notify carousel to update (for clients without realtime)
                    window.dispatchEvent(new Event("carouselPagesChanged"))
                    setPopup({ show: true, message: "Carousel updated", type: "success" })
                    setTimeout(() => setPopup({ show: false, message: "", type: "" }), 1500)
                    // record admin-level audit for carousel change
                    void recordAdminAudit("update_carousel", { config: next })
                  } catch (_err) {
                    // Supabase failed — notify user and log error for debugging
                    console.error("Failed to save carousel settings", _err)
                    setPopup({ show: true, message: "Failed to save", type: "error" })
                    setTimeout(() => setPopup({ show: false, message: "", type: "" }), 2000)
                  }
                }}
              />
              <span className="carousel-slider" aria-hidden="true" />
              <span className="carousel-label">{key.replace(/([A-Z])/g, " $1").trim()}</span>
            </label>
          ))}
        </div>
      </div>
      {/* Scrolling Message Update */}
      <form onSubmit={handleMessageSubmit} className="admin-form">
        <label htmlFor="scrolling-message">Update Scrolling Message:</label>
        <input
          id="scrolling-message"
          className="admin-input"
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter new message"
        />
        <button type="submit" className="admin-button">
          Update Message
        </button>
      </form>
      {/* Popup for all alerts */}
      {popup.show && (
        <div className={`admin-popup ${popup.type}`}>{popup.message}</div>
      )}
      {/* Members Table */}
      <div className="admin-table-container">
        <h2 style={{ marginTop: "0.5rem", marginBottom: "1rem" }}>Members</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Rank</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {members
              .slice() // avoid mutating state
              .sort((a, b) => {
                const aIdx = rankOrder.indexOf(a.rank)
                const bIdx = rankOrder.indexOf(b.rank)
                // If rank not found, put at end
                if (aIdx === -1 && bIdx === -1) return 0
                if (aIdx === -1) return 1
                if (bIdx === -1) return -1
                return aIdx - bIdx
              })
              .map((member) => (
                <tr key={member.id}>
                  <td>
                    {editingId === member.id ? (
                      <input
                        className="admin-input"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                      />
                    ) : (
                      member.name
                    )}
                  </td>
                  <td>
                    {editingId === member.id ? (
                      <select
                        className="admin-input"
                        value={editingRank}
                        onChange={(e) => setEditingRank(e.target.value)}
                      >
                        <option value="">Select rank</option>
                        {Object.keys(rankColors).map((r) => (
                          <option key={r} value={r}>
                            {r.replace(/([A-Z])/g, " $1").trim()}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        style={{
                          background: rankColors[member.rank]?.background,
                          color: rankColors[member.rank]?.color,
                          padding: "2px 8px",
                          borderRadius: "0.3em",
                          fontWeight: 600,
                          fontFamily: '"BebasNeue", Arial, sans-serif',
                          letterSpacing: "2px",
                        }}
                      >
                        {member.rank.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingId === member.id ? (
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          className="admin-button"
                          onClick={() => saveEditMember(member.id)}
                        >
                          Save
                        </button>
                        <button
                          className="admin-button"
                          onClick={() => cancelEditMember()}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          className="admin-button"
                          onClick={() => startEditMember(member)}
                          style={{ minWidth: 60 }}
                        >
                          Edit
                        </button>
                        <button
                          className="admin-button"
                          style={{
                            background: "#ce2029",
                            color: "#fff",
                            minWidth: 60,
                            padding: "0.3rem 0.8rem",
                          }}
                          onClick={() => handleDeleteClick(member.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            {/* Add Member Row */}
            <tr>
              <td>
                <input
                  className="admin-input"
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="New member name"
                  required
                />
              </td>
              <td>
                <Select
                  className="member-select"
                  options={rankOptions}
                  value={
                    rankOptions.find((opt) => opt.value === memberRank) || null
                  }
                  onChange={(opt) => setMemberRank(opt ? opt.value : "")}
                  isClearable
                  isSearchable
                  placeholder="Select rank"
                  menuPlacement="top"
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
                      minHeight: "40px",
                    }),
                    menu: (provided) => ({
                      ...provided,
                      backgroundColor: "#fff",
                      color: "#222",
                    }),
                  }}
                />
              </td>
              <td>
                <button
                  className="admin-button"
                  style={{ minWidth: 80 }}
                  onClick={handleMemberSubmit}
                  disabled={!memberName || !memberRank}
                >
                  Add
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <h3>Confirm Delete</h3>
            <p>Enter your 4-digit passcode to confirm deletion:</p>
            <form onSubmit={handleConfirmDelete}>
              <input
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                value={deleteCode}
                onChange={(e) =>
                  setDeleteCode(e.target.value.replace(/\D/g, ""))
                }
                className="admin-input"
                placeholder="4-digit passcode"
                required
                autoFocus
              />
              <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
                <button
                  type="submit"
                  className="admin-button"
                  style={{ background: "#ce2029" }}
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  className="admin-button"
                  onClick={handleCancelDelete}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Popup for all alerts */}
      {popup.show && (
        <div className={`admin-popup ${popup.type}`}>{popup.message}</div>
      )}
    </div>
  )
}
