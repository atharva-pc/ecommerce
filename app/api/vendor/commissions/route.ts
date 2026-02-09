import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch commission requests for this vendor
    const { data: commissions, error } = await supabase
      .from("commission_requests")
      .select("*")
      .eq("vendor_id", user.id);

    if (error) {
      console.error("Error fetching commissions:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch commissions" },
        { status: 500 }
      );
    }

    // Manually fetch customer profiles and products for each commission
    const commissionsWithDetails = await Promise.all(
      (commissions || []).map(async (commission) => {
        // Fetch customer profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("id", commission.customer_id)
          .single();

        // Fetch product
        const { data: product } = await supabase
          .from("products")
          .select("id, title, price, preview_url")
          .eq("id", commission.product_id)
          .single();

        return {
          ...commission,
          profiles: profile || { id: commission.customer_id, full_name: null, email: "Unknown" },
          products: product,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: { commissions: commissionsWithDetails },
    });
  } catch (error) {
    console.error("Error in commissions GET:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { commissionId, status, vendorResponse, quotedPrice } = await request.json();

    if (!commissionId || !status) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update commission request
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (vendorResponse) {
      updateData.vendor_response = vendorResponse;
    }

    if (quotedPrice) {
      updateData.quoted_price = quotedPrice;
    }

    const { data, error } = await supabase
      .from("commission_requests")
      .update(updateData)
      .eq("id", commissionId)
      .eq("vendor_id", user.id) // Ensure vendor owns this request
      .select()
      .single();

    if (error) {
      console.error("Error updating commission:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update commission" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error updating commission:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update commission" },
      { status: 500 }
    );
  }
}
