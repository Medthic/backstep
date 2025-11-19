import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { AssignmentPage } from "./pages/AssignmentPage";
import { CalanderPage } from "./pages/CalanderPage";
import Information from "./pages/Information";
import { GoogleSlidePage } from "./pages/GoogleSlidePage";
import "./PageCarousel.css";

// Define pages with stable keys so admin can toggle them
// Replace SLIDE_EMBED_URL with the embed src you get from
// Google Slides -> File -> Publish to the web -> Embed (or share/embed URL)
const SLIDE_EMBED_URL = "" // e.g. "https://docs.google.com/presentation/d/e/<ID>/embed?start=false&loop=false&delayms=3000"

const allPages = [
  { key: "assignment", node: <AssignmentPage key="assignment" /> },
  { key: "calendar", node: <CalanderPage key="calendar" /> },
  { key: "information", node: <Information key="information" /> },
  { key: "slide", node: <GoogleSlidePage key="slide" src={SLIDE_EMBED_URL} /> },
];

export const PageCarousel = () => {
  const [index, setIndex] = useState(0);
  const [sliding, setSliding] = useState(false);
  const [pages, setPages] = useState(allPages.map((p) => p.node));
  const timeoutRef = useRef(null);
  const slideTimeoutRef = useRef(null);

  // animation timing (ms)
  const ANIM_DURATION = 700;
  const INTERVAL = 10000;

    // Build pages from a config object { assignment: boolean, calendar: boolean, information: boolean, slideUrl?: string }
    // If `slide` is enabled but `slideUrl` is not provided, the slide page will be skipped.
    const buildPagesFromConfig = (config) => {
      if (!config) return allPages.map((p) => p.node);
      // If slide enabled but no URL provided, ignore slide key so it won't be included
      const keys = Object.keys(config).filter((k) => config[k]);
      const enabledKeys = keys.filter((k) => !(k === "slide" && !(config && config.slideUrl)));

      const filtered = allPages.filter((p) => enabledKeys.includes(p.key));

      // Map pages to nodes, injecting dynamic slide src when present
      const mapped = filtered.map((p) => {
        if (p.key === "slide") {
          const src = (config && config.slideUrl) || ""
          return <GoogleSlidePage key="slide" src={src} />
        }
        return p.node
      })

      // if nothing enabled, fallback to all pages (use defaults)
      if (mapped.length) return mapped
      return allPages.map((p) => p.node)
    };

  useEffect(() => {
    // Load config from Supabase (strict Supabase-only behavior). If no config exists
    // we'll fall back to sensible defaults (all pages) but we do NOT use localStorage.
    let channel = null

    // declare fetchConfig as a function so it's available to the handler/cleanup
    async function fetchConfig() {
      try {
        const { data, error } = await supabase.from("carousel_settings").select("config").limit(1).single()
        if (!error && data && data.config) {
          setPages(buildPagesFromConfig(data.config))
        } else {
          // no config row yet — use defaults (all pages)
          setPages(allPages.map((p) => p.node))
        }
      } catch {
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
      } catch {
        // ignore subscription errors; realtime might not be enabled
      }
    }

    // Also listen for the custom event dispatched by the admin UI for clients
    // that don't have realtime enabled; re-run fetchConfig when triggered.
    const handleCarouselChanged = () => {
      try {
        fetchConfig()
      } catch {
        /* ignore */
      }
    }

    fetchConfig()
    window.addEventListener("carouselPagesChanged", handleCarouselChanged)

    return () => {
      if (channel) supabase.removeChannel(channel)
      window.removeEventListener("carouselPagesChanged", handleCarouselChanged)
    }
  }, [])

  useEffect(() => {
  // auto advance using current pages length
    const start = () => {
      timeoutRef.current = setTimeout(() => {
  if (pages.length <= 1) return;
        setSliding(true);
        // after animation completes, update index and stop sliding
        slideTimeoutRef.current = setTimeout(() => {
          setIndex((i) => (i + 1) % pages.length);
          setSliding(false);
        }, ANIM_DURATION);
      }, INTERVAL);
    };

    start();

    return () => {
      clearTimeout(timeoutRef.current);
      clearTimeout(slideTimeoutRef.current);
    };
  }, [index, pages]);

  // compute the next index for rendering the incoming page during a slide
  const nextIndex = (index + 1) % pages.length;

  // Note: intentionally do not pause on mouse hover. Carousel will continue
  // auto-advancing regardless of pointer presence.

  return (
  <div className="carousel">
      <div className="carousel-track">
        {/* Keep all pages mounted to avoid remount/data reload flicker. Toggle classes for animation. */}
        {pages.map((p, i) => {
          const isActive = i === index && !sliding;
          const isOutgoing = sliding && i === index;
          const isIncoming = sliding && i === nextIndex;
          const hidden = !isActive && !isOutgoing && !isIncoming;
          const className = ["carousel-page", isActive ? "active" : "", isOutgoing ? "outgoing" : "", isIncoming ? "incoming" : "", hidden ? "hidden" : ""].join(" ").trim();
          return (
            <div className={className} key={`page-${i}`}>
              {p}
            </div>
          );
        })}
      </div>
    </div>
  );
};
