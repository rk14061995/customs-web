import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/data";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #082a68 0%, #0b3c91 60%, #1e5fd6 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 88,
            height: 88,
            borderRadius: 20,
            background: "rgba(255,255,255,0.12)",
            marginBottom: 40,
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
            <path d="M15 18H9" />
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
            <circle cx="17" cy="18" r="2" fill="#ff6b00" stroke="none" />
            <circle cx="7" cy="18" r="2" fill="#ff6b00" stroke="none" />
          </svg>
        </div>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 700, color: "#ffffff" }}>
          {siteConfig.name}
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#ff8534", marginTop: 16 }}>
          {siteConfig.tagline}
        </div>
      </div>
    ),
    { ...size }
  );
}
