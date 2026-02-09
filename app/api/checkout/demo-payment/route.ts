import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

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

    const { cartItems, totalAmount } = await request.json();

    // Fetch customer's shipping address
    const { data: profile } = await supabase
      .from("profiles")
      .select("shipping_full_name, shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_phone")
      .eq("id", user.id)
      .single();

    if (!profile?.shipping_full_name || !profile?.shipping_address) {
      return NextResponse.json(
        { success: false, error: "Please add shipping address in your profile first" },
        { status: 400 }
      );
    }

    // Get first product (simplified - one order per product)
    const firstItem = cartItems[0];
    if (!firstItem || !firstItem.product_id) {
      return NextResponse.json(
        { success: false, error: "Invalid cart items" },
        { status: 400 }
      );
    }

    // Fetch product to get vendor_id
    const { data: product } = await supabase
      .from("products")
      .select("vendor_id")
      .eq("id", firstItem.product_id)
      .single();

    // Create order in database with product_id and vendor_id
    const orderData: any = {
      user_id: user.id,
      product_id: firstItem.product_id,
      vendor_id: product?.vendor_id || null,
      quantity: firstItem.quantity || 1,
      total_price: totalAmount,
      payment_status: "paid",
      order_status: "processing",
      shipping_full_name: profile.shipping_full_name,
      shipping_address: profile.shipping_address,
      shipping_city: profile.shipping_city || "",
      shipping_state: profile.shipping_state || "",
      shipping_postal_code: profile.shipping_postal_code || "",
      shipping_phone: profile.shipping_phone || "",
    };

    // Try to add payment method fields
    try {
      orderData.payment_method = "demo";
      orderData.razorpay_order_id = `demo_${Date.now()}`;
      orderData.razorpay_payment_id = `demo_pay_${Date.now()}`;
    } catch (e) {
      console.log("Payment method columns not yet added to orders table");
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);

      if (orderError.message?.includes("payment_method")) {
        return NextResponse.json(
          {
            success: false,
            error: "Database schema update required. Please run SIMPLIFY_ORDERS_TABLE.sql in Supabase SQL Editor",
            details: orderError.message
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Failed to create order", details: orderError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Demo order completed",
      data: {
        orderId: order.id,
      },
    });
  } catch (error) {
    console.error("Error processing demo order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process demo order" },
      { status: 500 }
    );
  }
}
