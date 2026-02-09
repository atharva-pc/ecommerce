import { NextResponse } from "next/server";

// Shiprocket API base URL
const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

// Generate Shiprocket auth token
async function getShiprocketToken() {
  try {
    const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.token) {
      throw new Error("Failed to authenticate with Shiprocket");
    }

    return data.token;
  } catch (error) {
    console.error("Shiprocket auth error:", error);
    throw error;
  }
}

// Create shipment order
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Get Shiprocket token
    const token = await getShiprocketToken();

    // Here you would fetch order details from your database
    // and create a shipment with Shiprocket
    // This is a placeholder - you'll need to integrate with your orders table

    return NextResponse.json({
      success: true,
      message: "Shiprocket integration ready",
      token: token ? "Token obtained" : "Failed",
    });
  } catch (error) {
    console.error("Shiprocket shipment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create shipment" },
      { status: 500 }
    );
  }
}

// Get shipment tracking
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shipmentId = searchParams.get("shipmentId");

    if (!shipmentId) {
      return NextResponse.json(
        { success: false, error: "Shipment ID is required" },
        { status: 400 }
      );
    }

    const token = await getShiprocketToken();

    const response = await fetch(
      `${SHIPROCKET_BASE_URL}/courier/track/shipment/${shipmentId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Shiprocket tracking error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get tracking info" },
      { status: 500 }
    );
  }
}
