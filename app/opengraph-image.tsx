import { ImageResponse } from "next/og";
import { EveImageMark } from "./_components/eve-image-mark";

export const alt = "Eve Chat Template";

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
          alignItems: "center",
          background: "#050505",
          color: "white",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              alignItems: "center",
              border: "1px solid #2a2a2a",
              borderRadius: 48,
              display: "flex",
              height: 208,
              justifyContent: "center",
              marginBottom: 52,
              width: 208,
            }}
          >
            <EveImageMark size={142} />
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1,
              marginBottom: 26,
            }}
          >
            Eve Chat Template
          </div>
          <div
            style={{
              color: "#a1a1aa",
              fontSize: 36,
              lineHeight: 1.2,
            }}
          >
            Build your own chat agent with Eve.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
