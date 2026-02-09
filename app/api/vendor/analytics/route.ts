import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

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

    // Get vendor's products count
    const { count: productsCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("vendor_id", user.id);

    // Get total earnings
    const { data: earnings } = await supabase
      .from("order_items")
      .select("vendor_earnings, products!inner(vendor_id)")
      .eq("products.vendor_id", user.id);

    const totalEarnings = earnings?.reduce((sum, item) => sum + (Number(item.vendor_earnings) || 0), 0) || 0;

    // Get orders with vendor's products
    const { data: orderItems } = await supabase
      .from("order_items")
      .select(`
        id,
        quantity,
        price,
        vendor_earnings,
        created_at,
        products!inner(id, title, preview_url, vendor_id),
        orders!inner(id, razorpay_payment_id, payment_status, order_status, created_at, shipping_full_name)
      `)
      .eq("products.vendor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    // Get earnings by month for chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: monthlyData } = await supabase
      .from("order_items")
      .select("vendor_earnings, created_at, products!inner(vendor_id)")
      .eq("products.vendor_id", user.id)
      .gte("created_at", sixMonthsAgo.toISOString());

    // Group by month
    const earningsByMonth: { [key: string]: number } = {};
    monthlyData?.forEach(item => {
      const month = new Date(item.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short" });
      earningsByMonth[month] = (earningsByMonth[month] || 0) + (Number(item.vendor_earnings) || 0);
    });

    const chartData = Object.entries(earningsByMonth).map(([month, earnings]) => ({
      month,
      earnings,
    }));

    // Get commission requests
    const { data: commissionRequests } = await supabase
      .from("commission_requests")
      .select("*")
      .eq("vendor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const pendingCommissions = commissionRequests?.filter(c => c.status === "pending").length || 0;

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalProducts: productsCount || 0,
          totalEarnings: Number(totalEarnings.toFixed(2)),
          totalOrders: orderItems?.length || 0,
          pendingCommissions,
        },
        recentOrders: orderItems || [],
        earningsChart: chartData,
        commissionRequests: commissionRequests || [],
      },
    });
  } catch (error) {
    console.error("Error fetching vendor analytics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
