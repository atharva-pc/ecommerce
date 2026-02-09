import { NextResponse } from "next/server";

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

async function getShiprocketToken() {
  try {
    console.log("Attempting Shiprocket authentication...");
    console.log("Email configured:", !!process.env.SHIPROCKET_EMAIL);
    console.log("Password configured:", !!process.env.SHIPROCKET_PASSWORD);

    const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }),
    });

    const data = await response.json();

    console.log("Shiprocket auth response status:", response.status);
    console.log("Shiprocket auth response:", data);

    if (!response.ok || !data.token) {
      console.error("Shiprocket authentication failed:", data);
      throw new Error(`Shiprocket authentication failed: ${data.message || 'Unknown error'}`);
    }

    console.log("Shiprocket authentication successful");
    return data.token;
  } catch (error) {
    console.error("Shiprocket auth error:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pickupPincode, deliveryPincode, weight, codAmount, declaredValue } = body;

    if (!pickupPincode || !deliveryPincode || !weight) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const token = await getShiprocketToken();

    // Get available couriers with proper parameters
    const queryParams = new URLSearchParams({
      pickup_postcode: pickupPincode,
      delivery_postcode: deliveryPincode,
      weight: weight.toString(),
      cod: codAmount && codAmount > 0 ? "1" : "0",
    });

    const response = await fetch(
      `${SHIPROCKET_BASE_URL}/courier/serviceability/?${queryParams.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Shiprocket serviceability error:", data);
      return NextResponse.json(
        { success: false, error: data.message || "Failed to fetch courier services" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.data?.available_courier_companies || [],
    });
  } catch (error) {
    console.error("Error fetching courier services:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch courier services" },
      { status: 500 }
    );
  }
}
