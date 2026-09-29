import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createHash } from "crypto";

const VALID_ISPS = ["Globe", "PLDT", "Smart", "DITO", "Converge", "Sky", "Bayan", "Other"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      isp,
      plan_type,
      promised_mbps,
      download_mbps,
      upload_mbps,
      ping_ms,
      street,
      purok,
      barangay,
      latitude,
      longitude,
      device_fingerprint,
    } = body;

    if (!isp || !plan_type || promised_mbps == null || download_mbps == null || upload_mbps == null) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!VALID_ISPS.includes(isp)) {
      return NextResponse.json(
        { error: "Invalid ISP value" },
        { status: 400 }
      );
    }

    const promised = Number(promised_mbps);
    const dl = Number(download_mbps);
    const ul = Number(upload_mbps);
    const ping = ping_ms != null ? Number(ping_ms) : null;

    if (isNaN(promised) || promised < 0 || isNaN(dl) || dl < 0 || isNaN(ul) || ul < 0) {
      return NextResponse.json(
        { error: "Speeds must be non-negative numbers" },
        { status: 400 }
      );
    }

    if (ping != null && (isNaN(ping) || ping < 0)) {
      return NextResponse.json(
        { error: "Ping must be a non-negative number" },
        { status: 400 }
      );
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    const ipHash = createHash("sha256").update(realIp).digest("hex").slice(0, 16);

    const { data, error } = await supabaseAdmin
      .from("speed_tests")
      .insert({
        isp,
        plan_type,
        promised_mbps: promised,
        download_mbps: dl,
        upload_mbps: ul,
        ping_ms: ping,
        street: street || null,
        purok: purok || null,
        barangay: barangay || "Bagbag",
        latitude: latitude || null,
        longitude: longitude || null,
        device_fingerprint: device_fingerprint || null,
        ip_hash: ipHash,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to save speed test" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
