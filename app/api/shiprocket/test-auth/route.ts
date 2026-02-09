import { NextResponse } from "next/server";

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

export async function GET() {
  try {
    console.log("=== SHIPROCKET CREDENTIALS TEST ===");
    console.log("Email exists:", !!process.env.SHIPROCKET_EMAIL);
    console.log("Password exists:", !!process.env.SHIPROCKET_PASSWORD);
    console.log("Email value:", process.env.SHIPROCKET_EMAIL);
    console.log("Password length:", process.env.SHIPROCKET_PASSWORD?.length);

    if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
      return NextResponse.json({
        success: false,
        error: "Shiprocket credentials not configured in environment variables",
        details: {
          emailConfigured: !!process.env.SHIPROCKET_EMAIL,
          passwordConfigured: !!process.env.SHIPROCKET_PASSWORD,
        },
      });
    }

    console.log("Attempting Shiprocket login...");

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

    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: "Shiprocket authentication failed",
        statusCode: response.status,
        response: data,
        credentials: {
          email: process.env.SHIPROCKET_EMAIL,
          passwordLength: process.env.SHIPROCKET_PASSWORD?.length,
        },
      });
    }

    if (!data.token) {
      return NextResponse.json({
        success: false,
        error: "No token received from Shiprocket",
        response: data,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Shiprocket authentication successful!",
      tokenReceived: true,
      tokenLength: data.token.length,
    });
  } catch (error: any) {
    console.error("Test error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
