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
  }, [isLoggedIn, memberStatus])

  // Helper to show popup
  const showPopup = (message, type = "info", duration = 2000) => {
    setPopup({ show: true, message, type })
    setTimeout(() => setPopup({ show: false, message: "", type: "" }), duration)
  }

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault()
  _setError("")
    const { data, error: fetchError } = await supabase
      .from("admin_passcode")
      .select("code")
      .single()
    if (fetchError) {
      showPopup("Error connecting to server.", "error")
      return
    }
    if (data && input === data.code) {
      setIsLoggedIn(true)
      setInput("")
      showPopup("Login successful!", "success")
    } else {
      showPopup("Incorrect passcode.", "error")
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
      } else {
        showPopup("Message updated!", "success")
      }
    } else {
      showPopup("Could not find message row.", "error")
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
    } else {
      showPopup("Member added!", "success")
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
  }

  // Confirm delete handler
  const handleConfirmDelete = async (e) => {
    e.preventDefault()
  _setDeleteError("")
    const { data, error: fetchError } = await supabase
      .from("admin_passcode")
      .select("code")
      .single()
    if (fetchError) {
      showPopup("Error connecting to server.", "error")
      return
    }
    if (!data || deleteCode !== data.code) {
      showPopup("Incorrect passcode.", "error")
      return
    }
    const { error } = await supabase
      .from("memberlist")
      .delete()
      .eq("id", deleteTargetId)
    if (error) {
      showPopup("Failed to delete member.", "error")
    } else {
      showPopup("Member deleted!", "success")
      setMembers(members.filter((m) => m.id !== deleteTargetId))
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
