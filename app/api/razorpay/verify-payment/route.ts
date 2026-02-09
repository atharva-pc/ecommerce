import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData
    } = await request.json();

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Get user's shipping address
    const { data: profile } = await supabase
      .from("profiles")
      .select("shipping_full_name, shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_phone")
      .eq("id", user.id)
      .single();

    if (!profile?.shipping_full_name || !profile?.shipping_address) {
      return NextResponse.json(
        { success: false, error: "Shipping address required" },
        { status: 400 }
      );
    }

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        total_price: orderData.totalPrice,
        razorpay_order_id,
        razorpay_payment_id,
        payment_status: "success",
        shipping_full_name: profile.shipping_full_name,
        shipping_address: profile.shipping_address,
        shipping_city: profile.shipping_city,
        shipping_state: profile.shipping_state,
        shipping_postal_code: profile.shipping_postal_code,
        shipping_phone: profile.shipping_phone,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      return NextResponse.json(
        { success: false, error: "Failed to create order" },
        { status: 500 }
      );
    }

    // Create order items
    const orderItems = orderData.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      vendor_earnings: Number((item.price * item.quantity * 0.70).toFixed(2)), // 70% to vendor
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
    }

    // Clear cart after successful order
    await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id);

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        message: "Payment verified and order created successfully",
      },
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
