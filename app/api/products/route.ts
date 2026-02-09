import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    // If type=all, return all products
    if (type === "all") {
      const { data: products } = await supabase
        .from("products")
        .select("id, title, description, price, preview_url, category, created_at, is_limited_edition, vendor_id")
        .order("created_at", { ascending: false });

      return NextResponse.json({
        success: true,
        data: {
          products: products ?? [],
        },
      });
    }

    // Default: return stats for homepage
    const { data: products, count } = await supabase
      .from("products")
      .select("price", { count: "exact" })
      .order("created_at", { ascending: false });

    const productCount = count ?? 0;
    const prices = products?.map(p => p.price) ?? [];
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    // Fetch 3 random products for preview
    const { data: previewProducts } = await supabase
      .from("products")
      .select("preview_url")
      .limit(3);

    return NextResponse.json({
      success: true,
      data: {
        productCount,
        minPrice,
        maxPrice,
        previewProducts: previewProducts ?? [],
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
