import { ImageResponse } from "next/og";
import { siteConfig } from "@/content/site";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          background: "#131315",
          color: "#e5e1e4",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: 24,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#4fdbc8",
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: "#4fdbc8",
              boxShadow: "0 0 22px rgba(79,219,200,0.5)",
            }}
          />
          {siteConfig.shortName}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 104,
              lineHeight: 0.9,
              fontWeight: 800,
              letterSpacing: "-0.08em",
              textTransform: "uppercase",
              maxWidth: "900px",
            }}
          >
            Authority Through Intelligence
          </div>
          <div style={{ fontSize: 32, lineHeight: 1.4, color: "#bbcac6", maxWidth: "920px" }}>
            Autonomous multi-agent systems, premium AI positioning, and production-ready execution.
          </div>
        </div>

        <div
          style={{
            width: "100%",
            height: 2,
            background: "linear-gradient(90deg, transparent 0%, #4fdbc8 50%, transparent 100%)",
          }}
        />
      </div>
    ),
    size,
  );
}
