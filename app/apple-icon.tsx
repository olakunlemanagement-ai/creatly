import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const FOREST = "#1a3d2f";
const TERRACOTTA = "#c8732e";
const CREAM = "#f5f2ec";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: FOREST,
          borderRadius: 36,
        }}
      >
        {/* C aperture mark — simplified for small size */}
        <div
          style={{
            position: "relative",
            width: 110,
            height: 110,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Outer ring */}
          <div
            style={{
              position: "absolute",
              width: 110,
              height: 110,
              borderRadius: "50%",
              border: `22px solid ${CREAM}`,
              // Clip right side for the C aperture opening
              clipPath: "polygon(0% 0%, 72% 0%, 72% 100%, 0% 100%)",
            }}
          />
          {/* Top terracotta arc accent */}
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: TERRACOTTA,
            }}
          />
          {/* Bottom terracotta arc accent */}
          <div
            style={{
              position: "absolute",
              bottom: 8,
              right: 8,
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: TERRACOTTA,
            }}
          />
          {/* Centre dot */}
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: TERRACOTTA,
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
