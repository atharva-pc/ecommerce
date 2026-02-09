import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch vendor profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, role, vendor_status")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "vendor") {
      return NextResponse.json(
        { success: false, error: "Not a vendor" },
        { status: 403 }
      );
    }

    // Fetch vendor's products
    const { data: products } = await supabase
      .from("products")
      .select("id, title, description, price, category, preview_url, created_at")
      .eq("vendor_id", profile.id)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          id: profile.id,
          full_name: profile.full_name,
          role: profile.role,
          vendor_status: profile.vendor_status,
        },
        products: products || [],
      },
    });
  } catch (error) {
    console.error("Error fetching vendor dashboard data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch vendor data" },
      { status: 500 }
    );
  }
}
