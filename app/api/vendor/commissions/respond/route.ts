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
    const { commissionId, action, quotedPrice, deliveryDays, vendorResponse } = body;

    if (!commissionId || !action) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify the commission belongs to this vendor
    const { data: commission } = await supabase
      .from("commission_requests")
      .select("vendor_id")
      .eq("id", commissionId)
      .single();

    if (!commission || commission.vendor_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Commission not found or unauthorized" },
        { status: 403 }
      );
    }

    let updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (action === "accept") {
      if (!quotedPrice) {
        return NextResponse.json(
          { success: false, error: "Quoted price is required" },
          { status: 400 }
        );
      }

      updateData = {
        ...updateData,
        status: "accepted",
        quoted_price: quotedPrice,
        vendor_response: vendorResponse || "Commission accepted! I will begin work once payment is received.",
      };

      if (deliveryDays) {
        updateData.vendor_response = `${updateData.vendor_response} Estimated delivery: ${deliveryDays} days.`;
      }
    } else if (action === "reject") {
      updateData = {
        ...updateData,
        status: "rejected",
        vendor_response: vendorResponse || "Sorry, I cannot take on this commission at this time.",
      };
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("commission_requests")
      .update(updateData)
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
      message: `Commission ${action}ed successfully`,
    });
  } catch (error) {
    console.error("Error in commission response:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
