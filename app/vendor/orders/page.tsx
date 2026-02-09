"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/lib/toast-context";
import { Package, Truck, ExternalLink, CheckCircle } from "lucide-react";

interface Order {
  id: string;
  user_id: string;
  product_id: string;
  vendor_id: string;
  quantity: number;
  total_price: number;
  payment_status: string;
  order_status: string;
  shipment_id: string | null;
  awb_code: string | null;
  courier_name: string | null;
  tracking_url: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
    shipping_address: string | null;
    shipping_city: string | null;
    shipping_state: string | null;
    shipping_postal_code: string | null;
  } | null;
  products: {
    title: string;
    preview_url: string;
  } | null;
}

export default function VendorOrdersPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [creatingShipment, setCreatingShipment] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    checkVendorAccess();
  }, []);

  const checkVendorAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, vendor_status")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "vendor" || profile?.vendor_status !== "approved") {
        showToast("Access denied", "warning");
        router.push("/");
        return;
      }

      await fetchOrders(user.id);
    } catch (error) {
      console.error("Error checking access:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (vendorId: string) => {
    try {
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            shipping_address,
            shipping_city,
            shipping_state,
            shipping_postal_code
          ),
          products:product_id (
            title,
            preview_url
          )
        `)
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
      }

      setOrders(ordersData || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };


  const createShipment = async (orderId: string) => {
    setCreatingShipment(orderId);

    try {
      const response = await fetch("/api/shiprocket/create-shipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const result = await response.json();

      if (result.success) {
        showToast("Shipment created successfully!", "success");
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await fetchOrders(user.id);
      } else {
        showToast(result.error || "Failed to create shipment", "error");
      }
    } catch (error) {
      console.error("Error creating shipment:", error);
      showToast("Failed to create shipment", "error");
    } finally {
      setCreatingShipment(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Navbar />
        <div className="container-custom py-20 text-center">
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      <main className="container-custom py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Order Management</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No orders yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const customer = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;

              return (
                <div key={order.id} className="bg-white dark:bg-slate-900 border rounded-lg p-6">
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b">
                    <div>
                      <p className="text-sm text-muted-foreground">Order ID</p>
                      <p className="font-mono font-semibold text-foreground">
                        {order.id.substring(0, 8)}...
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="text-xl font-bold text-primary">
                        ₹{order.total_price.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        order.order_status === "shipped"
                          ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                          : order.order_status === "processing"
                          ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"
                          : "bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400"
                      }`}>
                        {order.order_status || "Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Customer Info - Limited for vendor privacy */}
                  {customer ? (
                    <div className="mb-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                      <h3 className="font-semibold text-foreground mb-2">Shipping Details:</h3>
                      {customer.shipping_address && (
                        <>
                          <p className="text-sm text-muted-foreground">{customer.shipping_address}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.shipping_city}, {customer.shipping_state} - {customer.shipping_postal_code}
                          </p>
                        </>
                      )}
                      {!customer.shipping_address && (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                          ⚠️ Shipping address not available
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-900 dark:text-yellow-100">
                        ⚠️ Shipping information will be provided after shipment creation
                      </p>
                    </div>
                  )}

                  {/* Product */}
                  <div className="mb-4">
                    {order.products ? (
                      <div className="flex gap-3">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image
                            src={order.products.preview_url || "/placeholder.jpg"}
                            alt={order.products.title || "Product"}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{order.products.title}</p>
                          <p className="text-sm text-muted-foreground">Quantity: {order.quantity || 1}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Product information not available</p>
                    )}
                  </div>

                  {/* Shipment Actions */}
                  <div className="pt-4 border-t">
                    {order.shipment_id ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-semibold">Shipment Created</span>
                        </div>
                        {order.awb_code && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">AWB: </span>
                            <span className="font-mono font-semibold">{order.awb_code}</span>
                          </div>
                        )}
                        {order.tracking_url && (
                          <Button
                            variant="outline"
                            onClick={() => window.open(order.tracking_url || "", "_blank")}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Track Shipment
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button
                        onClick={() => createShipment(order.id)}
                        disabled={creatingShipment === order.id}
                        className="bg-primary hover:bg-primary/90 text-white"
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        {creatingShipment === order.id ? "Creating..." : "Create Shipment"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
