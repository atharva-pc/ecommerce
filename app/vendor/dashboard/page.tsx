"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/lib/toast-context";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";

export default function VendorDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({ products: 0, earnings: 0, orders: 0, sold: 0 });
  const [products, setProducts] = useState<any[]>([]);
  const [soldArtworks, setSoldArtworks] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<any>(null);
  const [quotedPrice, setQuotedPrice] = useState("");
  const supabase = createClient();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
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
        showToast("Vendor access required", "error");
        router.push("/");
        return;
      }

      await Promise.all([fetchProducts(), fetchSoldArtworks(), fetchCommissions()]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("vendor_id", user.id);

    setProducts(data || []);

    const earnings = (data || []).reduce((sum, p) => sum + (p.price * 0.7), 0);
    setStats(prev => ({ ...prev, products: data?.length || 0, earnings }));
  };

  const fetchSoldArtworks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch orders for this vendor
    const { data: orders } = await supabase
      .from("orders")
      .select("*")
      .eq("vendor_id", user.id);

    if (!orders) {
      setSoldArtworks([]);
      return;
    }

    // Manually fetch product details for each order
    const ordersWithProducts = await Promise.all(
      orders.map(async (order) => {
        const { data: product } = await supabase
          .from("products")
          .select("title, preview_url")
          .eq("id", order.product_id)
          .single();

        return {
          ...order,
          products: product || { title: "Unknown", preview_url: "" },
        };
      })
    );

    setSoldArtworks(ordersWithProducts);

    const totalOrders = ordersWithProducts.length;
    const actualEarnings = ordersWithProducts.reduce((sum, o) => sum + (o.total_price * 0.7), 0);

    setStats(prev => ({ ...prev, orders: totalOrders, sold: totalOrders, earnings: actualEarnings }));
  };

  const fetchCommissions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch commissions for this vendor
    const { data: commissions } = await supabase
      .from("commission_requests")
      .select("*")
      .eq("vendor_id", user.id);

    if (!commissions) {
      setCommissions([]);
      return;
    }

    // Manually fetch customer profiles and products for each commission
    const commissionsWithDetails = await Promise.all(
      commissions.map(async (commission) => {
        // Fetch customer profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", commission.customer_id)
          .single();

        // Fetch product
        const { data: product } = await supabase
          .from("products")
          .select("title")
          .eq("id", commission.product_id)
          .single();

        return {
          ...commission,
          profiles: profile || { full_name: null, email: "Unknown" },
          products: product || { title: "Unknown" },
        };
      })
    );

    setCommissions(commissionsWithDetails);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (!error) {
      showToast("Product deleted", "success");
      fetchProducts();
    } else {
      showToast("Failed to delete", "error");
    }
  };

  const respondToCommission = async (id: string, status: string, price?: number) => {
    try {
      const response = await fetch("/api/vendor/commissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commissionId: id,
          status,
          quotedPrice: price,
          vendorResponse: status === "accepted"
            ? "Commission accepted! Will start working on it soon."
            : "Sorry, cannot take this commission at the moment."
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(`Commission ${status}`, "success");
        fetchCommissions();
      } else {
        showToast(result.error || "Failed to respond", "error");
      }
    } catch (error) {
      showToast("Failed to update", "error");
    }
  };

  const handleAcceptCommission = (commission: any) => {
    setSelectedCommission(commission);
    setQuotedPrice("");
    setShowPriceDialog(true);
  };

  const confirmAcceptCommission = async () => {
    if (!selectedCommission) return;

    const price = parseFloat(quotedPrice);
    if (isNaN(price) || price <= 0) {
      showToast("Please enter a valid price", "error");
      return;
    }

    await respondToCommission(selectedCommission.id, "accepted", price);
    setShowPriceDialog(false);
    setSelectedCommission(null);
    setQuotedPrice("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />

      <div className="container-custom py-8">
        <h1 className="text-3xl font-bold mb-8">Vendor Dashboard</h1>

        <div className="flex gap-6">
          {/* Left Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white dark:bg-slate-900 border rounded-lg p-4 sticky top-24">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    activeTab === "dashboard" ? "bg-primary text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => setActiveTab("products")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    activeTab === "products" ? "bg-primary text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Package className="h-5 w-5" />
                  <span>Products</span>
                </button>

                <button
                  onClick={() => setActiveTab("sold")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    activeTab === "sold" ? "bg-primary text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Sold Artworks</span>
                </button>

                <button
                  onClick={() => setActiveTab("commissions")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    activeTab === "commissions" ? "bg-primary text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>Commissions</span>
                  {commissions.filter(c => c.status === "pending").length > 0 && (
                    <span className="ml-auto bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
                      {commissions.filter(c => c.status === "pending").length}
                    </span>
                  )}
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-slate-900 border rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Products</p>
                        <p className="text-3xl font-bold mt-2">{stats.products}</p>
                      </div>
                      <Package className="h-8 w-8 text-primary" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Earnings</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">₹{Math.round(stats.earnings).toLocaleString()}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Orders</p>
                        <p className="text-3xl font-bold mt-2">{stats.orders}</p>
                      </div>
                      <ShoppingCart className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Sold</p>
                        <p className="text-3xl font-bold mt-2">{stats.sold}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-slate-900 border rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                  <Link href="/vendor/upload">
                    <Button className="bg-primary hover:bg-primary/90 text-white">
                      <Package className="h-4 w-4 mr-2" />
                      Upload New Artwork
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === "products" && (
              <div className="bg-white dark:bg-slate-900 border rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Your Products</h2>
                  <Link href="/vendor/upload">
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">
                      Upload New
                    </Button>
                  </Link>
                </div>

                {products.length === 0 ? (
                  <p className="text-center py-12 text-muted-foreground">No products yet</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <div key={product.id} className="border rounded-lg overflow-hidden">
                        <div className="relative h-48">
                          <Image src={product.preview_url} alt={product.title} fill className="object-cover" />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold mb-1">{product.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{product.description}</p>
                          <p className="text-lg font-bold text-primary mb-3">₹{product.price.toLocaleString()}</p>
                          <div className="flex gap-2">
                            <Link href={`/products/${product.id}`} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteProduct(product.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sold Artworks Tab */}
            {activeTab === "sold" && (
              <div className="bg-white dark:bg-slate-900 border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">Sold Artworks</h2>

                {soldArtworks.length === 0 ? (
                  <p className="text-center py-12 text-muted-foreground">No sales yet</p>
                ) : (
                  <div className="space-y-4">
                    {soldArtworks.map((order) => (
                      <div key={order.id} className="flex items-start gap-4 p-4 border rounded-lg">
                        {order.products?.preview_url && (
                          <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0">
                            <Image src={order.products.preview_url} alt={order.products.title} fill className="object-cover" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold">{order.products?.title}</h3>
                          <p className="text-sm text-muted-foreground">Quantity: {order.quantity}</p>
                          <p className="text-sm text-muted-foreground">Date: {new Date(order.created_at).toLocaleDateString()}</p>
                          <p className="text-sm">
                            Status: <span className={`font-semibold ${
                              order.order_status === "delivered" ? "text-green-600" :
                              order.order_status === "shipped" ? "text-blue-600" : "text-yellow-600"
                            }`}>{order.order_status}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Sale Price</p>
                          <p className="text-lg font-semibold">₹{order.total_price.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground mt-1">Your 70%</p>
                          <p className="text-xl font-bold text-primary">₹{Math.round(order.total_price * 0.7).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Commissions Tab */}
            {activeTab === "commissions" && (
              <div className="bg-white dark:bg-slate-900 border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">Commission Requests</h2>

                {commissions.length === 0 ? (
                  <p className="text-center py-12 text-muted-foreground">No commission requests</p>
                ) : (
                  <div className="space-y-4">
                    {commissions.map((comm) => (
                      <div key={comm.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">Custom Commission</h3>
                            <p className="text-sm text-muted-foreground">
                              From: {comm.profiles?.full_name || "Customer"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(comm.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            comm.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                            comm.status === "accepted" ? "bg-green-100 text-green-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {comm.status}
                          </span>
                        </div>

                        <p className="text-sm mb-2">{comm.description}</p>
                        <p className="text-sm text-muted-foreground">Budget: ₹{comm.budget.toLocaleString()} • Qty: {comm.quantity}</p>

                        {comm.status === "pending" && (
                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              onClick={() => handleAcceptCommission(comm)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => respondToCommission(comm.id, "rejected")}
                              className="text-red-600"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}

                        {comm.status === "accepted" && comm.quoted_price && (
                          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/10 rounded">
                            <p className="text-sm font-semibold text-green-700">
                              Quoted: ₹{comm.quoted_price.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Accept Commission Price Dialog */}
      {showPriceDialog && selectedCommission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Accept Commission</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPriceDialog(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                Customer: {selectedCommission.profiles?.full_name || "Unknown"}
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                Budget: ₹{selectedCommission.budget.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Quantity: {selectedCommission.quantity}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="quotedPrice">Your Quoted Price (₹) *</Label>
                <Input
                  id="quotedPrice"
                  type="number"
                  min="0"
                  step="100"
                  value={quotedPrice}
                  onChange={(e) => setQuotedPrice(e.target.value)}
                  placeholder="Enter your price"
                  className="mt-1"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={confirmAcceptCommission}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Commission
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPriceDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
