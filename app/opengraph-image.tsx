import { ImageResponse } from "next/og";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";

export const runtime = "edge";
export const alt = `${APP_NAME} — ${APP_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand colours — must be literal hex here (ImageResponse doesn't resolve CSS vars)
const FOREST = "#1a3d2f";
const TERRACOTTA = "#c8732e";
const CREAM = "#f5f2ec";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          background: FOREST,
          padding: "64px 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle background arc decoration */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 600,
            height: 600,
            borderRadius: "50%",
            border: `80px solid ${TERRACOTTA}`,
            opacity: 0.12,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 60,
            right: 60,
            width: 340,
            height: 340,
            borderRadius: "50%",
            border: `40px solid ${CREAM}`,
            opacity: 0.06,
          }}
        />

        {/* Mark — inline SVG paths re-implemented as div shapes */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 48,
          }}
        >
          {/* Wordmark */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: CREAM,
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            {APP_NAME}
          </div>
          {/* Terracotta accent dot */}
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: TERRACOTTA,
              marginLeft: 4,
              marginTop: 40,
            }}
          />
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 36,
            fontWeight: 400,
            color: CREAM,
            opacity: 0.75,
            maxWidth: 680,
            lineHeight: 1.3,
            marginBottom: 32,
          }}
        >
          {APP_TAGLINE}
        </div>

        {/* Terracotta accent line */}
        <div
          style={{
            width: 80,
            height: 4,
            background: TERRACOTTA,
            borderRadius: 2,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
