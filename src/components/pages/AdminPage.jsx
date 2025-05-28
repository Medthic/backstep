import React, { useState, useEffect } from "react"
import Select from "react-select"
import { supabase } from "../../lib/supabase"
import "./AdminPage.css"
import { rankColors } from "../rankColors"

export const AdminPage = () => {
  const [input, setInput] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [messageStatus, setMessageStatus] = useState("")
  const [memberName, setMemberName] = useState("")
  const [memberRank, setMemberRank] = useState("")
  const [memberStatus, setMemberStatus] = useState("")
  const [members, setMembers] = useState([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState(null)
  const [deleteCode, setDeleteCode] = useState("")
  const [deleteError, setDeleteError] = useState("")

  // Prepare options for react-select
  const rankOptions = Object.keys(rankColors).map((rank) => ({
    value: rank,
    label: rank.replace(/([A-Z])/g, " $1").trim(),
    color: rankColors[rank].background,
    textColor: rankColors[rank].color,
  }))

  useEffect(() => {
    if (isLoggedIn) {
      supabase
        .from("memberlist")
        .select("id, name, rank")
        .then(({ data }) => setMembers(data || []))
    }
  }, [isLoggedIn, memberStatus])

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    const { data, error: fetchError } = await supabase
      .from("admin_passcode")
      .select("code")
      .single()
    if (fetchError) {
      setError("Error connecting to server.")
      return
    }
    if (data && input === data.code) {
      setIsLoggedIn(true)
      setInput("")
    } else {
      setError("Incorrect passcode.")
    }
  }

  // Update scrolling message
  const handleMessageSubmit = async (e) => {
    e.preventDefault()
    setMessageStatus("")
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
      setMessageStatus(
        updateError ? "Failed to update message." : "Message updated!"
      )
    } else {
      setMessageStatus("Could not find message row.")
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
      setMemberStatus("Failed to add member.")
    } else {
      setMemberStatus("Member added!")
      setMemberName("")
      setMemberRank("")
    }
  }

  // Show confirm dialog
  const handleDeleteClick = (id) => {
    setDeleteTargetId(id)
    setShowDeleteConfirm(true)
    setDeleteCode("")
    setDeleteError("")
  }

  // Confirm delete handler
  const handleConfirmDelete = async (e) => {
    e.preventDefault()
    setDeleteError("")
    const { data, error: fetchError } = await supabase
      .from("admin_passcode")
      .select("code")
      .single()
    if (fetchError) {
      setDeleteError("Error connecting to server.")
      return
    }
    if (!data || deleteCode !== data.code) {
      setDeleteError("Incorrect passcode.")
      return
    }
    const { error } = await supabase
      .from("memberlist")
      .delete()
      .eq("id", deleteTargetId)
    if (error) {
      setMemberStatus("Failed to delete member.")
    } else {
      setMemberStatus("Member deleted!")
      setMembers(members.filter((m) => m.id !== deleteTargetId))
    }
    setShowDeleteConfirm(false)
    setDeleteTargetId(null)
    setDeleteCode("")
    setDeleteError("")
  }

  // Cancel delete
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
    setDeleteTargetId(null)
    setDeleteCode("")
    setDeleteError("")
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
        {error && <div className="admin-error">{error}</div>}
      </div>
    )
  }

  // Admin content after login
  return (
    <div className="admin-container">
      <h1 className="admin-title">Admin Page</h1>
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
        {messageStatus && <div className="admin-error">{messageStatus}</div>}
      </form>
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
            {members.map((member) => (
              <tr key={member.id}>
                <td>{member.name}</td>
                <td>
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
                </td>
                <td>
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
                      backgroundColor:
                        state.isSelected || state.isFocused
                          ? state.data.color
                          : state.data.color, // Always show the color for each option
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
        {memberStatus && <div className="admin-error">{memberStatus}</div>}
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
              {deleteError && <div className="admin-error">{deleteError}</div>}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
