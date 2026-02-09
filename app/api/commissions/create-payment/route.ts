import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

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

    const { commissionId } = await request.json();

    if (!commissionId) {
      return NextResponse.json(
        { success: false, error: "Commission ID is required" },
        { status: 400 }
      );
    }

    // Get commission details
    const { data: commission, error: commissionError } = await supabase
      .from("commission_requests")
      .select("*, products(title)")
      .eq("id", commissionId)
      .eq("customer_id", user.id)
      .single();

    if (commissionError || !commission) {
      return NextResponse.json(
        { success: false, error: "Commission not found" },
        { status: 404 }
      );
    }

    // Verify commission is accepted and has quoted price
    if (commission.status !== "accepted" || !commission.quoted_price) {
      return NextResponse.json(
        { success: false, error: "Commission not ready for payment" },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const amountInPaise = Math.round(commission.quoted_price * 100);

    // Razorpay receipt max length is 40 chars, so use shortened ID
    const shortReceipt = `comm_${commissionId.substring(0, 30)}`;

    console.log("Creating Razorpay order:", {
      amount: amountInPaise,
      receipt: shortReceipt,
      commissionId: commissionId,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: shortReceipt,
      notes: {
        commissionId: commissionId,
        customerId: user.id,
        vendorId: commission.vendor_id,
        quantity: commission.quantity.toString(),
        type: "commission_payment",
      },
    });

    console.log("Razorpay order created:", razorpayOrder.id);

    return NextResponse.json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: amountInPaise,
        currency: "INR",
        commission: {
          id: commission.id,
          quantity: commission.quantity,
          quoted_price: commission.quoted_price,
          product_title: commission.products?.title,
        },
      },
    });
  } catch (error) {
    console.error("Error creating commission payment order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}
