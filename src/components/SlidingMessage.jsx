import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase" // adjust path if needed
import "./SlidingMessage.css"

export const SlidingMessage = ({ duration = 4000 }) => {
  const [message, setMessage] = useState("")
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // fetchLatest moved inside effect to avoid missing dependency warnings
    const fetchLatest = async () => {
      const { data } = await supabase
        .from("sliding_messages")
        .select("message")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
      if (data) {
        setMessage(data.message)
        setVisible(true)
        setTimeout(() => setVisible(false), duration)
      }
    }

    fetchLatest()

    const channel = supabase
      .channel("realtime:sliding_messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sliding_messages" },
        fetchLatest // fetch latest on insert
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sliding_messages" },
        fetchLatest // fetch latest on update
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [duration])

  return (
    <div className="sliding-message-bar">
      <div className={`sliding-message${visible ? " show" : ""}`}>
        {message}
      </div>
    </div>
  )
}
