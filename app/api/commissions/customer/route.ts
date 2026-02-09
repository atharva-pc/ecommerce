import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

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

    // Fetch commission requests for this customer
    const { data: commissions, error } = await supabase
      .from("commission_requests")
      .select("*")
      .eq("customer_id", user.id);

    if (error) {
      console.error("Error fetching customer commissions:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch commissions" },
        { status: 500 }
      );
    }

    // Manually fetch vendor profiles and products for each commission
    const commissionsWithDetails = await Promise.all(
      (commissions || []).map(async (commission) => {
        // Fetch vendor profile
        const { data: vendor } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url")
          .eq("id", commission.vendor_id)
          .single();

        // Fetch product
        const { data: product } = await supabase
          .from("products")
          .select("id, title, price, preview_url")
          .eq("id", commission.product_id)
          .single();

        return {
          ...commission,
          vendor: vendor || { id: commission.vendor_id, full_name: null, email: "Unknown" },
          products: product,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: { commissions: commissionsWithDetails },
    });
  } catch (error) {
    console.error("Error in customer commissions GET:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
