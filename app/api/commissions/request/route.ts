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

    const body = await request.json();
    const { productId, quantity, description, budget } = body;

    if (!productId || !quantity) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get product details to find vendor
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, vendor_id, title, price")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Create commission request
    const { data: commission, error: commissionError } = await supabase
      .from("commission_requests")
      .insert({
        customer_id: user.id,
        vendor_id: product.vendor_id,
        product_id: productId,
        description: description || `Request for ${quantity} copies of ${product.title}`,
        budget: budget || product.price * quantity,
        quantity,
        status: "pending",
      })
      .select()
      .single();

    if (commissionError) {
      console.error("Error creating commission:", commissionError);
      return NextResponse.json(
        { success: false, error: "Failed to create commission request" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Commission request sent to artist",
      data: commission,
    });
  } catch (error) {
    console.error("Error in commission request:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
