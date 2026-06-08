import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site"

export const alt = `${SITE_NAME} preview image`
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"
export const runtime = "nodejs"

const chips = ["API", "CLI", "MCP", "Browser", "Pricing"]

export default async function Image() {
  const iconData = await readFile(
    join(process.cwd(), "public/brand/can-agents-use-icon.png"),
    "base64"
  )
  const iconSrc = `data:image/png;base64,${iconData}`

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "linear-gradient(135deg, #06121f 0%, #0b1f2a 46%, #06251f 100%)",
          boxSizing: "border-box",
          color: "#f8fafc",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: "46px",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid rgba(148, 163, 184, 0.36)",
            borderRadius: "34px",
            boxShadow: "0 26px 80px rgba(2, 6, 23, 0.45)",
            boxSizing: "border-box",
            color: "#020617",
            display: "flex",
            gap: "42px",
            height: "538px",
            overflow: "hidden",
            padding: "44px",
            position: "relative",
            width: "1108px",
          }}
        >
          <div
            style={{
              alignItems: "center",
              alignSelf: "center",
              background: "#eafdf8",
              border: "1px solid #b8ded3",
              borderRadius: "38px",
              boxSizing: "border-box",
              boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.8)",
              display: "flex",
              flexShrink: 0,
              height: "260px",
              justifyContent: "center",
              padding: "20px",
              width: "260px",
            }}
          >
            <img
              src={iconSrc}
              alt=""
              height={224}
              width={224}
              style={{
                borderRadius: "32px",
                boxShadow: "0 18px 42px rgba(15, 23, 42, 0.18)",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              height: "100%",
              justifyContent: "space-between",
              minWidth: 0,
              position: "relative",
            }}
          >
            <div
              style={{
                alignItems: "center",
                display: "flex",
                gap: "16px",
                height: "34px",
              }}
            >
              <div
                style={{
                  background: "#009966",
                  borderRadius: "999px",
                  display: "flex",
                  height: "12px",
                  width: "12px",
                }}
              />
              <div
                style={{
                  color: "#047857",
                  fontSize: 30,
                  fontWeight: 800,
                  lineHeight: 1,
                }}
              >
                {SITE_NAME}
              </div>
              <div
                style={{
                  background: "#d9fbeb",
                  border: "1px solid #a7f3d0",
                  borderRadius: "999px",
                  color: "#065f46",
                  fontSize: 22,
                  fontWeight: 800,
                  lineHeight: 1,
                  padding: "8px 14px",
                }}
              >
                100-point agent score
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                width: "690px",
              }}
            >
              <div
                style={{
                  color: "#020617",
                  fontSize: 66,
                  fontWeight: 900,
                  lineHeight: 0.98,
                  maxWidth: "690px",
                }}
              >
                Search tools agents can actually use.
              </div>
              <div
                style={{
                  color: "#475569",
                  fontSize: 30,
                  fontWeight: 600,
                  lineHeight: 1.24,
                  maxWidth: "650px",
                }}
              >
                {SITE_DESCRIPTION}
              </div>
            </div>

            <div
              style={{
                alignItems: "center",
                display: "flex",
                gap: "13px",
                height: "54px",
              }}
            >
              {chips.map((item, index) => (
                <div
                  key={item}
                  style={{
                    background: index === 0 ? "#051017" : "#e6fffb",
                    border:
                      index === 0 ? "1px solid #051017" : "1px solid #99f6e4",
                    borderRadius: "12px",
                    color: index === 0 ? "#67e8f9" : "#0f766e",
                    fontSize: 23,
                    fontWeight: 800,
                    lineHeight: 1,
                    padding: "14px 17px",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    size
  )
}
