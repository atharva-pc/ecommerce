import { NextResponse } from "next/server";

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

async function getShiprocketToken() {
  const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.token) {
    throw new Error("Shiprocket authentication failed");
  }
  return data.token;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shipmentId = searchParams.get("shipmentId");
    const awb = searchParams.get("awb"); // Air Waybill number

    if (!shipmentId && !awb) {
      return NextResponse.json(
        { success: false, error: "Shipment ID or AWB is required" },
        { status: 400 }
      );
    }

    const token = await getShiprocketToken();

    let trackingUrl;
    if (awb) {
      trackingUrl = `${SHIPROCKET_BASE_URL}/courier/track/awb/${awb}`;
    } else {
      trackingUrl = `${SHIPROCKET_BASE_URL}/courier/track/shipment/${shipmentId}`;
    }

    const response = await fetch(trackingUrl, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch tracking info" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Error tracking shipment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to track shipment" },
      { status: 500 }
    );
  }
}
