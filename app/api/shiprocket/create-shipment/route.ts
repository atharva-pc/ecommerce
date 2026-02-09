import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

async function getShiprocketToken() {
  const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.token) {
    throw new Error("Shiprocket authentication failed");
  }
  return data.token;
}

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

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Fetch order details with customer and product info
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        profiles:user_id (
          full_name,
          email,
          shipping_full_name,
          shipping_address,
          shipping_city,
          shipping_state,
          shipping_postal_code,
          shipping_phone
        ),
        products:product_id (
          title,
          price,
          vendor_id
        )
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order fetch error:", orderError);
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Check if user is admin or vendor who owns this product
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const product = Array.isArray(order.products) ? order.products[0] : order.products;

    // Allow if user is admin OR if user is the vendor who owns the product
    const isAdmin = profile?.role === "admin";
    const isVendorOwner = product && product.vendor_id === user.id;

    if (!isAdmin && !isVendorOwner) {
      return NextResponse.json(
        { success: false, error: "Not authorized for this order" },
        { status: 403 }
      );
    }

    // Get Shiprocket token
    const token = await getShiprocketToken();

    // Get pickup locations to use the first available one
    let pickupLocationName = "Primary";
    try {
      const pickupLocationsResponse = await fetch(`${SHIPROCKET_BASE_URL}/settings/company/pickup`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (pickupLocationsResponse.ok) {
        const pickupData = await pickupLocationsResponse.json();
        console.log("Pickup locations:", pickupData);

        if (pickupData.data?.shipping_address?.length > 0) {
          // Use the first pickup location
          pickupLocationName = pickupData.data.shipping_address[0].pickup_location;
          console.log("Using pickup location:", pickupLocationName);
        }
      }
    } catch (error) {
      console.warn("Could not fetch pickup locations, using default:", error);
    }

    // Prepare shipment data
    const customerProfile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;

    const shipmentData = {
      order_id: order.id.substring(0, 20), // Shiprocket order ID (max 20 chars)
      order_date: new Date(order.created_at).toISOString().split('T')[0],
      pickup_location: pickupLocationName, // Use actual pickup location from account
      billing_customer_name: customerProfile?.full_name || "Customer",
      billing_last_name: "",
      billing_address: customerProfile?.shipping_address || "",
      billing_city: customerProfile?.shipping_city || "",
      billing_pincode: customerProfile?.shipping_postal_code || "",
      billing_state: customerProfile?.shipping_state || "",
      billing_country: "India",
      billing_email: customerProfile?.email || "",
      billing_phone: customerProfile?.shipping_phone || "",
      shipping_is_billing: true,
      order_items: [{
        name: product?.title || "Product",
        sku: `SKU${orderId.slice(0, 8)}`,
        units: order.quantity || 1,
        selling_price: order.total_price,
        discount: 0,
        tax: 0,
        hsn: 0,
      }],
      payment_method: order.payment_status === "paid" ? "Prepaid" : "COD",
      sub_total: order.total_price,
      length: 30, // Default A4 artwork dimensions (in cm)
      breadth: 21,
      height: 4,
      weight: 1.5, // Default weight (in kg)
    };

    console.log("Creating Shiprocket order:", shipmentData);

    // Create order in Shiprocket
    const shiprocketResponse = await fetch(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(shipmentData),
    });

    const shiprocketData = await shiprocketResponse.json();

    console.log("Full Shiprocket response:", JSON.stringify(shiprocketData, null, 2));

    if (!shiprocketResponse.ok) {
      console.error("Shiprocket error:", shiprocketData);
      return NextResponse.json(
        { success: false, error: shiprocketData.message || "Failed to create shipment" },
        { status: 400 }
      );
    }

    // Shiprocket returns IDs in different formats - check all possibilities
    const shipmentId = shiprocketData.shipment_id || shiprocketData.data?.shipment_id;
    const shiprocketOrderId = shiprocketData.order_id || shiprocketData.data?.order_id;

    console.log("Shiprocket order created:", { shipmentId, shiprocketOrderId, fullResponse: shiprocketData });

    if (!shipmentId && !shiprocketOrderId) {
      console.error("No shipment_id or order_id in response!");
      return NextResponse.json(
        {
          success: false,
          error: "Shiprocket order created but no IDs returned. Check Shiprocket settings or pickup location configuration.",
          details: shiprocketData
        },
        { status: 400 }
      );
    }

    // Step 2: Get courier recommendations for this shipment
    const courierResponse = await fetch(
      `${SHIPROCKET_BASE_URL}/courier/serviceability?pickup_postcode=400018&delivery_postcode=${customerProfile?.shipping_postal_code}&weight=${shipmentData.weight}&cod=0`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    let courierId = null;
    let awbCode = null;
    let courierName = null;

    if (courierResponse.ok) {
      const courierData = await courierResponse.json();
      console.log("Courier recommendations:", courierData);

      // Get the cheapest available courier
      if (courierData.data?.available_courier_companies?.length > 0) {
        const cheapestCourier = courierData.data.available_courier_companies.reduce((min: any, curr: any) => {
          const currRate = curr.freight_charge || curr.rate || Infinity;
          const minRate = min.freight_charge || min.rate || Infinity;
          return currRate < minRate ? curr : min;
        });

        courierId = cheapestCourier.courier_company_id;
        courierName = cheapestCourier.courier_name;

        console.log("Selected courier:", { courierId, courierName });

        // Step 3: Generate AWB (Airway Bill)
        try {
          const awbResponse = await fetch(`${SHIPROCKET_BASE_URL}/courier/assign/awb`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              shipment_id: shipmentId,
              courier_id: courierId,
            }),
          });

          const awbData = await awbResponse.json();
          console.log("AWB Response:", awbData);

          if (awbResponse.ok && awbData.response?.data?.awb_code) {
            awbCode = awbData.response.data.awb_code;
            console.log("AWB generated:", awbCode);

            // Step 4: Schedule pickup
            try {
              const pickupResponse = await fetch(`${SHIPROCKET_BASE_URL}/courier/generate/pickup`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  shipment_id: [shipmentId],
                }),
              });

              const pickupData = await pickupResponse.json();
              console.log("Pickup scheduled:", pickupData);
            } catch (pickupError) {
              console.warn("Pickup scheduling failed (non-critical):", pickupError);
            }
          }
        } catch (awbError) {
          console.warn("AWB generation failed (non-critical):", awbError);
        }
      }
    }

    // Update order with complete shipment details
    await supabase
      .from("orders")
      .update({
        shipment_id: shipmentId?.toString(),
        awb_code: awbCode,
        courier_name: courierName,
        courier_id: courierId,
        order_status: awbCode ? "shipped" : "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    return NextResponse.json({
      success: true,
      message: awbCode ? "Shipment created and AWB generated" : "Shipment created (AWB pending)",
      data: {
        shipment_id: shipmentId,
        order_id: shiprocketOrderId,
        awb_code: awbCode,
        courier_name: courierName,
        status: awbCode ? "shipped" : "processing",
      },
    });
  } catch (error) {
    console.error("Error creating shipment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create shipment" },
      { status: 500 }
    );
  }
}
