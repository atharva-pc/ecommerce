import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      commissionId,
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !commissionId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Get commission details
    const { data: commission } = await supabase
      .from("commission_requests")
      .select("*")
      .eq("id", commissionId)
      .eq("customer_id", user.id)
      .single();

    if (!commission) {
      return NextResponse.json(
        { success: false, error: "Commission not found" },
        { status: 404 }
      );
    }

    // Update commission status to paid/in_progress
    const { error: updateError } = await supabase
      .from("commission_requests")
      .update({
        status: "in_progress",
        payment_id: razorpay_payment_id,
        payment_order_id: razorpay_order_id,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", commissionId);

    if (updateError) {
      console.error("Error updating commission:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update commission" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and commission started",
      data: {
        commissionId,
        status: "in_progress",
        payment_id: razorpay_payment_id,
      },
    });
  } catch (error) {
    console.error("Error verifying commission payment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
