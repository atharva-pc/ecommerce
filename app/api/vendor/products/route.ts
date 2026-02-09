import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is a vendor
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, vendor_status")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "vendor" || profile?.vendor_status !== "approved") {
      return NextResponse.json(
        { success: false, error: "Not an approved vendor" },
        { status: 403 }
      );
    }

    // Get vendor's products
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .eq("vendor_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        products: products || [],
      },
    });
  } catch (error) {
    console.error("Error in vendor products API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { id } = await request.json().catch(() => ({}));

  if (!id) {
    return NextResponse.json({ message: "Product id required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { data: product } = await supabase
    .from("products")
    .select("vendor_id")
    .eq("id", id)
    .maybeSingle();

  if (!product || product.vendor_id !== session.user.id) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Product deleted" });
}


