import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { AssignmentPage } from "./pages/AssignmentPage";
import { CalanderPage } from "./pages/CalanderPage";
import Information from "./pages/Information";
import "./PageCarousel.css";

// Define pages with stable keys so admin can toggle them
const allPages = [
  { key: "assignment", node: <AssignmentPage key="assignment" /> },
  { key: "calendar", node: <CalanderPage key="calendar" /> },
  { key: "information", node: <Information key="information" /> },
];

export const PageCarousel = () => {
  const [index, setIndex] = useState(0);
  const [sliding, setSliding] = useState(false);
  const [direction, setDirection] = useState("right");
  const [pages, setPages] = useState(allPages.map((p) => p.node));
  const timeoutRef = useRef(null);

  // Build pages from a config object { assignment: boolean, calendar: boolean, information: boolean }
  const buildPagesFromConfig = (config) => {
    if (!config) return allPages.map((p) => p.node);
    const enabledKeys = Object.keys(config).filter((k) => config[k]);
    const filtered = allPages.filter((p) => enabledKeys.includes(p.key));
    // if nothing enabled, fallback to all pages
    return filtered.length ? filtered.map((p) => p.node) : allPages.map((p) => p.node);
  };

  useEffect(() => {
    // Load config from Supabase (strict Supabase-only behavior). If no config exists
    // we'll fall back to sensible defaults (all pages) but we do NOT use localStorage.
    let channel = null
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase.from("carousel_settings").select("config").limit(1).single()
        if (!error && data && data.config) {
          setPages(buildPagesFromConfig(data.config))
        } else {
          // no config row yet — use defaults (all pages)
          setPages(allPages.map((p) => p.node))
        }
      } catch (e) {
        // on error (network etc) use defaults so UI still works
        setPages(allPages.map((p) => p.node))
      }

      // Subscribe to realtime changes on carousel_settings so all clients update
      try {
        channel = supabase
          .channel("realtime:carousel_settings")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "carousel_settings" },
            (payload) => {
              const cfg = payload?.new?.config
              if (cfg) {
                setPages(buildPagesFromConfig(cfg))
                setIndex(0)
              }
            }
          )
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "carousel_settings" },
            (payload) => {
              const cfg = payload?.new?.config
              if (cfg) {
                setPages(buildPagesFromConfig(cfg))
                setIndex(0)
              }
            }
          )
          .subscribe()
      } catch (e) {
        // ignore subscription errors; realtime might not be enabled
      }
    }

    fetchConfig()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    // auto advance using current pages length
    timeoutRef.current = setTimeout(() => {
      setDirection("right");
      setSliding(true);
      setTimeout(() => {
        setIndex((i) => (i + 1) % pages.length);
        setSliding(false);
      }, 500); // match CSS transition duration
    }, 10000);
    return () => clearTimeout(timeoutRef.current);
  }, [index, pages]);

  return (
    <div className="carousel">
      <div className={`carousel-content slide-${sliding ? direction : "none"}`}>
        {pages[index]}
      </div>
    </div>
  );
};
