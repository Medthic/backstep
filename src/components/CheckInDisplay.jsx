import React, { useEffect, useState, useRef } from "react";
import "./checkindisplay.css";

// Dummy fetch function, replace with your actual fetch logic (e.g., from Supabase or API)
const fetchCheckedInMembers = async () => {
  // Example data: [{ name: "John Doe", time: "08:15 AM" }, ...]
  return [
    { name: "John Doe", time: "08:15 AM" },
    { name: "Jane Smith", time: "08:20 AM" },
    { name: "Alex Brown", time: "08:25 AM" },
    { name: "Chris Lee", time: "08:30 AM" },
    { name: "Morgan Fox", time: "08:35 AM" },
    // ...more
  ];
};

export default function CheckInDisplay() {
  const [members, setMembers] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    // Fetch checked-in members
    fetchCheckedInMembers().then(setMembers);
    // Optionally, poll for updates every minute
    const interval = setInterval(() => {
      fetchCheckedInMembers().then(setMembers);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (!scrollRef.current || members.length === 0) return;
    let scrollAmount = 0;
    const scrollStep = 1; // px per frame
    const scrollDelay = 30; // ms per frame

    let animationFrame;
    function scrollList() {
      if (!scrollRef.current) return;
      scrollAmount += scrollStep;
      if (scrollAmount >= scrollRef.current.scrollHeight / 2) {
        scrollAmount = 0;
      }
      scrollRef.current.scrollTop = scrollAmount;
      animationFrame = setTimeout(scrollList, scrollDelay);
    }
    scrollList();
    return () => clearTimeout(animationFrame);
  }, [members]);

  // Duplicate list for seamless scroll
  const displayList = [...members, ...members];

  return (
    <div className="checkin-display-container">
      <div className="checkin-title">Checked In</div>
      <div className="checkin-scroll-list" ref={scrollRef}>
        <ul>
          {displayList.map((member, idx) => (
            <li key={idx} className="checkin-member-row">
              <span className="checkin-member-name">{member.name}</span>
              <span className="checkin-member-time">{member.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}