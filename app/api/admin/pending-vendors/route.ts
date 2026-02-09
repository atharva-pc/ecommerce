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

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin only" },
        { status: 403 }
      );
    }

    // Fetch pending vendors
    const { data: pendingVendors } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, vendor_status")
      .eq("vendor_status", "pending")
      .eq("role", "vendor");

    return NextResponse.json({
      success: true,
      data: {
        pendingVendors: pendingVendors || [],
      },
    });
  } catch (error) {
    console.error("Error fetching admin data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch admin data" },
      { status: 500 }
    );
  }
}
