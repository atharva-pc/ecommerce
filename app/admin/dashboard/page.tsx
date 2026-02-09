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
  MessageSquare,
  Users,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  Truck,
  Eye,
  Trash2,
  Plus,
  X,
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({ orders: 0, revenue: 0, commissions: 0, vendors: 0, users: 0 });
  const [orders, setOrders] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [creatingShipment, setCreatingShipment] = useState<string | null>(null);
  const [showCreateCommission, setShowCreateCommission] = useState(false);
  const [newCommission, setNewCommission] = useState({
    customer_id: "",
    vendor_id: "",
    product_id: "",
    quantity: 1,
    budget: 0,
    description: "",
  });
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
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        showToast("Admin access required", "error");
        router.push("/");
        return;
      }

      await Promise.all([fetchOrders(), fetchCommissions(), fetchVendors(), fetchUsers(), fetchProducts(), fetchDemoMode()]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    // Fetch all orders
    const { data: orders } = await supabase
      .from("orders")
      .select("*");

    if (!orders) {
      setOrders([]);
      setStats(prev => ({ ...prev, orders: 0, revenue: 0 }));
      return;
    }

    // Manually fetch related user profiles and products for each order
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        // Fetch user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", order.user_id)
          .single();

        // Fetch product
        const { data: product } = await supabase
          .from("products")
          .select("title, preview_url")
          .eq("id", order.product_id)
          .single();

        return {
          ...order,
          profiles: profile || { full_name: null, email: "Unknown" },
          products: product || { title: "Unknown", preview_url: "" },
        };
      })
    );

    setOrders(ordersWithDetails);

    const revenue = ordersWithDetails.reduce((sum, o) => sum + o.total_price, 0);
    setStats(prev => ({ ...prev, orders: ordersWithDetails.length, revenue }));
  };

  const fetchCommissions = async () => {
    const { data: commissions, error } = await supabase
      .from("commission_requests")
      .select("*");

    if (error) {
      console.error("Error fetching commissions:", error);
      setCommissions([]);
      setStats(prev => ({ ...prev, commissions: 0 }));
      return;
    }

    // Manually fetch related customer profiles and products
    const commissionsWithDetails = await Promise.all(
      (commissions || []).map(async (commission) => {
        // Fetch customer profile
        const { data: customer } = await supabase
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
          profiles: customer || { full_name: null, email: "Unknown" },
          products: product || { title: "Unknown" },
        };
      })
    );

    console.log("Commissions fetched:", commissionsWithDetails?.length || 0, commissionsWithDetails);

    setCommissions(commissionsWithDetails || []);

    const total = (commissionsWithDetails || []).reduce((sum, c) => sum + (c.budget || 0), 0);
    setStats(prev => ({ ...prev, commissions: total }));
  };

  const fetchVendors = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "vendor");

    if (error) {
      console.error("Error fetching vendors:", error);
    } else {
      console.log("Vendors fetched:", data?.length || 0, data);
    }

    setVendors(data || []);
    setStats(prev => ({ ...prev, vendors: data?.length || 0 }));
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*");

    setUsers(data || []);
    setStats(prev => ({ ...prev, users: data?.length || 0 }));
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select(`
        *,
        profiles:vendor_id (
          full_name,
          email
        )
      `);

    setProducts(data || []);
  };

  const fetchDemoMode = async () => {
    try {
      const response = await fetch("/api/admin/demo-mode");
      const result = await response.json();
      if (result.success) setDemoMode(result.demoMode);
    } catch (error) {
      console.error("Error fetching demo mode:", error);
    }
  };

  const toggleDemoMode = async () => {
    try {
      const newMode = !demoMode;
      const response = await fetch("/api/admin/demo-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newMode }),
      });

      const result = await response.json();
      if (result.success) {
        setDemoMode(newMode);
        showToast(`Demo mode ${newMode ? "enabled" : "disabled"}`, "success");
      }
    } catch (error) {
      showToast("Failed to toggle demo mode", "error");
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
        fetchOrders();
      } else {
        showToast(result.error || "Failed to create shipment", "error");
      }
    } catch (error) {
      showToast("Failed to create shipment", "error");
    } finally {
      setCreatingShipment(null);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ order_status: status })
      .eq("id", orderId);

    if (!error) {
      showToast("Order updated", "success");
      fetchOrders();
    } else {
      showToast("Failed to update", "error");
    }
  };

  const updateVendorStatus = async (vendorId: string, status: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ vendor_status: status })
      .eq("id", vendorId);

    if (!error) {
      showToast(`Vendor ${status}`, "success");
      fetchVendors();
    } else {
      showToast("Failed to update", "error");
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (!error) {
      showToast("Product deleted successfully", "success");
      fetchProducts();
    } else {
      showToast("Failed to delete product", "error");
    }
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user: ${userEmail}?\n\nThis will permanently remove the user and all their data.`)) return;

    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (!error) {
      showToast("User deleted successfully", "success");
      fetchUsers();
      fetchVendors(); // Refresh vendors if deleted user was a vendor
    } else {
      showToast("Failed to delete user", "error");
      console.error("Delete user error:", error);
    }
  };

  const deleteCommission = async (commissionId: string) => {
    if (!confirm("Are you sure you want to delete this commission request?")) return;

    const { error } = await supabase
      .from("commission_requests")
      .delete()
      .eq("id", commissionId);

    if (!error) {
      showToast("Commission deleted successfully", "success");
      fetchCommissions();
    } else {
      showToast("Failed to delete commission", "error");
      console.error("Delete commission error:", error);
    }
  };

  const createCommission = async () => {
    if (!newCommission.customer_id || !newCommission.vendor_id || !newCommission.product_id) {
      showToast("Please fill all required fields", "error");
      return;
    }

    if (newCommission.quantity < 1) {
      showToast("Quantity must be at least 1", "error");
      return;
    }

    if (newCommission.budget <= 0) {
      showToast("Budget must be greater than 0", "error");
      return;
    }

    const { error } = await supabase
      .from("commission_requests")
      .insert([{
        customer_id: newCommission.customer_id,
        vendor_id: newCommission.vendor_id,
        product_id: newCommission.product_id,
        quantity: newCommission.quantity,
        budget: newCommission.budget,
        description: newCommission.description,
        status: "pending",
      }]);

    if (!error) {
      showToast("Commission created successfully", "success");
      setShowCreateCommission(false);
      setNewCommission({
        customer_id: "",
        vendor_id: "",
        product_id: "",
        quantity: 1,
        budget: 0,
        description: "",
      });
      fetchCommissions();
    } else {
      showToast("Failed to create commission", "error");
      console.error("Create commission error:", error);
    }
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
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

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
                  onClick={() => setActiveTab("orders")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    activeTab === "orders" ? "bg-primary text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Package className="h-5 w-5" />
                  <span>Orders</span>
                  <span className="ml-auto text-xs">{orders.length}</span>
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
                  onClick={() => setActiveTab("commissions")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    activeTab === "commissions" ? "bg-primary text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>Commissions</span>
                  <span className="ml-auto text-xs">{commissions.length}</span>
                </button>

                <button
                  onClick={() => setActiveTab("vendors")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    activeTab === "vendors" ? "bg-primary text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Users className="h-5 w-5" />
                  <span>Vendors</span>
                  {vendors.filter(v => v.vendor_status === "pending").length > 0 && (
                    <span className="ml-auto bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
                      {vendors.filter(v => v.vendor_status === "pending").length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("users")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    activeTab === "users" ? "bg-primary text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Users className="h-5 w-5" />
                  <span>All Users</span>
                  <span className="ml-auto text-xs">{users.length}</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div className="bg-white dark:bg-slate-900 border rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Orders</p>
                        <p className="text-3xl font-bold mt-2">{stats.orders}</p>
                      </div>
                      <Package className="h-8 w-8 text-primary" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">₹{stats.revenue.toLocaleString()}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Commissions</p>
                        <p className="text-3xl font-bold text-blue-600 mt-2">₹{stats.commissions.toLocaleString()}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Vendors</p>
                        <p className="text-3xl font-bold mt-2">{stats.vendors}</p>
                      </div>
                      <Users className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Users</p>
                        <p className="text-3xl font-bold mt-2">{stats.users}</p>
                      </div>
                      <Users className="h-8 w-8 text-orange-600" />
                    </div>
                  </div>
                </div>

                {/* Demo Mode */}
                <div className="bg-white dark:bg-slate-900 border rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Demo Mode</h3>
                      <p className="text-sm text-muted-foreground mt-1">Enable instant checkout for demo</p>
                    </div>
                    <Button
                      onClick={toggleDemoMode}
                      className={demoMode ? "bg-green-600 hover:bg-green-700" : "bg-slate-600 hover:bg-slate-700"}
                    >
                      {demoMode ? "✓ Enabled" : "Disabled"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="bg-white dark:bg-slate-900 border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">Order Management</h2>

                {orders.length === 0 ? (
                  <p className="text-center py-12 text-muted-foreground">No orders yet</p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          {order.products?.preview_url && (
                            <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0">
                              <Image src={order.products.preview_url} alt={order.products.title} fill className="object-cover" />
                            </div>
                          )}

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold">{order.products?.title}</h3>
                                <p className="text-sm text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">₹{order.total_price.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                              <div>
                                <p className="text-muted-foreground">Customer</p>
                                <p className="font-medium">{order.profiles?.full_name || "N/A"}</p>
                                <p className="text-xs text-muted-foreground">{order.profiles?.email}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Shipping</p>
                                <p className="text-xs">{order.shipping_address}</p>
                                <p className="text-xs">{order.shipping_city}, {order.shipping_state}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                order.order_status === "delivered" ? "bg-green-100 text-green-700" :
                                order.order_status === "shipped" ? "bg-blue-100 text-blue-700" :
                                "bg-yellow-100 text-yellow-700"
                              }`}>
                                {order.order_status}
                              </span>

                              {order.order_status === "processing" && !order.shipment_id && (
                                <Button
                                  size="sm"
                                  onClick={() => createShipment(order.id)}
                                  disabled={creatingShipment === order.id}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  <Truck className="h-4 w-4 mr-1" />
                                  {creatingShipment === order.id ? "Creating..." : "Create Shipment"}
                                </Button>
                              )}

                              {order.shipment_id && order.order_status === "processing" && (
                                <Button
                                  size="sm"
                                  onClick={() => updateOrderStatus(order.id, "shipped")}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  <Truck className="h-4 w-4 mr-1" />
                                  Mark Shipped
                                </Button>
                              )}

                              {order.order_status === "shipped" && (
                                <Button
                                  size="sm"
                                  onClick={() => updateOrderStatus(order.id, "delivered")}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Mark Delivered
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Products Tab */}
            {activeTab === "products" && (
              <div className="bg-white dark:bg-slate-900 border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">All Products</h2>

                {products.length === 0 ? (
                  <p className="text-center py-12 text-muted-foreground">No products yet</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                      <div key={product.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition">
                        <div className="relative h-48">
                          <Image
                            src={product.preview_url}
                            alt={product.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold mb-1 line-clamp-1">{product.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{product.description}</p>
                          <p className="text-lg font-bold text-primary mb-2">₹{product.price.toLocaleString()}</p>
                          <div className="text-xs text-muted-foreground mb-3">
                            <p>By: {product.profiles?.full_name || "Unknown"}</p>
                            <p className="text-xs">{product.profiles?.email}</p>
                          </div>
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
                              className="text-red-600 hover:bg-red-50"
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

            {/* Commissions Tab */}
            {activeTab === "commissions" && (
              <div className="bg-white dark:bg-slate-900 border rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Commission Requests</h2>
                  <Button
                    onClick={() => setShowCreateCommission(true)}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Commission
                  </Button>
                </div>

                {commissions.length === 0 ? (
                  <p className="text-center py-12 text-muted-foreground">No commissions yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 text-sm font-semibold">ID</th>
                          <th className="text-left p-3 text-sm font-semibold">Customer</th>
                          <th className="text-left p-3 text-sm font-semibold">Product</th>
                          <th className="text-left p-3 text-sm font-semibold">Quantity</th>
                          <th className="text-left p-3 text-sm font-semibold">Budget</th>
                          <th className="text-left p-3 text-sm font-semibold">Status</th>
                          <th className="text-left p-3 text-sm font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commissions.map((comm) => (
                          <tr key={comm.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                            <td className="p-3">
                              <span className="font-mono text-sm">{comm.id.slice(0, 8)}...</span>
                            </td>
                            <td className="p-3">
                              <div>
                                <p className="text-sm font-medium">{comm.profiles?.full_name || "N/A"}</p>
                                <p className="text-xs text-muted-foreground">{comm.profiles?.email}</p>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="text-sm">{comm.products?.title || "N/A"}</span>
                            </td>
                            <td className="p-3">
                              <span className="text-sm">{comm.quantity}</span>
                            </td>
                            <td className="p-3">
                              <span className="text-sm font-semibold">₹{comm.budget.toLocaleString()}</span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                comm.status === "accepted" ? "bg-green-100 text-green-700" :
                                comm.status === "rejected" ? "bg-red-100 text-red-700" :
                                "bg-yellow-100 text-yellow-700"
                              }`}>
                                {comm.status}
                              </span>
                            </td>
                            <td className="p-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteCommission(comm.id)}
                                className="text-red-600 hover:bg-red-50 border-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Vendors Tab */}
            {activeTab === "vendors" && (
              <div className="bg-white dark:bg-slate-900 border rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold">All Vendors</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total: {vendors.length} vendors ({vendors.filter(v => v.vendor_status === "pending").length} pending, {vendors.filter(v => v.vendor_status === "approved").length} approved, {vendors.filter(v => v.vendor_status === "rejected").length} rejected)
                    </p>
                  </div>
                </div>

                {vendors.length === 0 ? (
                  <p className="text-center py-12 text-muted-foreground">No vendors yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 text-sm font-semibold">Vendor</th>
                          <th className="text-left p-3 text-sm font-semibold">Email</th>
                          <th className="text-left p-3 text-sm font-semibold">Status</th>
                          <th className="text-left p-3 text-sm font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendors.map((vendor) => (
                          <tr key={vendor.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                {vendor.avatar_url ? (
                                  <div className="relative w-10 h-10 rounded-full overflow-hidden">
                                    <Image src={vendor.avatar_url} alt={vendor.full_name || "Vendor"} fill className="object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-primary" />
                                  </div>
                                )}
                                <span className="text-sm font-medium">{vendor.full_name || "N/A"}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="text-sm text-muted-foreground">{vendor.email}</span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                vendor.vendor_status === "approved" ? "bg-green-100 text-green-700" :
                                vendor.vendor_status === "rejected" ? "bg-red-100 text-red-700" :
                                "bg-yellow-100 text-yellow-700"
                              }`}>
                                {vendor.vendor_status || "pending"}
                              </span>
                            </td>
                            <td className="p-3">
                              {vendor.vendor_status === "pending" ? (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => updateVendorStatus(vendor.id, "approved")}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => updateVendorStatus(vendor.id, "rejected")}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              ) : vendor.vendor_status === "approved" ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-green-600">✓ Approved</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateVendorStatus(vendor.id, "rejected")}
                                    className="text-red-600 hover:bg-red-50 border-red-300"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Remove
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-red-600">✗ Rejected</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* All Users Tab */}
            {activeTab === "users" && (
              <div className="bg-white dark:bg-slate-900 border rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold">All Users</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total: {users.length} users
                    </p>
                  </div>
                </div>

                {users.length === 0 ? (
                  <p className="text-center py-12 text-muted-foreground">No users yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 text-sm font-semibold">User</th>
                          <th className="text-left p-3 text-sm font-semibold">Email</th>
                          <th className="text-left p-3 text-sm font-semibold">Role</th>
                          <th className="text-left p-3 text-sm font-semibold">Vendor Status</th>
                          <th className="text-left p-3 text-sm font-semibold">Shipping Info</th>
                          <th className="text-left p-3 text-sm font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                {user.avatar_url ? (
                                  <div className="relative w-10 h-10 rounded-full overflow-hidden">
                                    <Image src={user.avatar_url} alt={user.full_name || "User"} fill className="object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-primary" />
                                  </div>
                                )}
                                <span className="text-sm font-medium">{user.full_name || "N/A"}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="text-sm text-muted-foreground">{user.email}</span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                user.role === "admin" ? "bg-red-100 text-red-700" :
                                user.role === "vendor" ? "bg-purple-100 text-purple-700" :
                                "bg-blue-100 text-blue-700"
                              }`}>
                                {user.role || "customer"}
                              </span>
                            </td>
                            <td className="p-3">
                              {user.role === "vendor" ? (
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  user.vendor_status === "approved" ? "bg-green-100 text-green-700" :
                                  user.vendor_status === "rejected" ? "bg-red-100 text-red-700" :
                                  "bg-yellow-100 text-yellow-700"
                                }`}>
                                  {user.vendor_status || "pending"}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="p-3">
                              {user.shipping_address ? (
                                <div className="text-xs">
                                  <p className="text-muted-foreground">{user.shipping_full_name}</p>
                                  <p className="text-muted-foreground">{user.shipping_city}, {user.shipping_state}</p>
                                  <p className="text-muted-foreground">{user.shipping_postal_code}</p>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Not provided</span>
                              )}
                            </td>
                            <td className="p-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteUser(user.id, user.email)}
                                className="text-red-600 hover:bg-red-50 border-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Commission Dialog */}
      {showCreateCommission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Create Commission Request</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateCommission(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Customer Selection */}
              <div>
                <Label htmlFor="customer">Customer *</Label>
                <select
                  id="customer"
                  className="w-full mt-1 p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
                  value={newCommission.customer_id}
                  onChange={(e) => setNewCommission({ ...newCommission, customer_id: e.target.value })}
                >
                  <option value="">Select Customer</option>
                  {users.filter(u => u.role === "customer" || !u.role).map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.email} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Vendor Selection */}
              <div>
                <Label htmlFor="vendor">Vendor/Artist *</Label>
                <select
                  id="vendor"
                  className="w-full mt-1 p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
                  value={newCommission.vendor_id}
                  onChange={(e) => setNewCommission({ ...newCommission, vendor_id: e.target.value })}
                >
                  <option value="">Select Vendor</option>
                  {vendors.filter(v => v.vendor_status === "approved").map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.full_name || vendor.email} ({vendor.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Selection */}
              <div>
                <Label htmlFor="product">Product *</Label>
                <select
                  id="product"
                  className="w-full mt-1 p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
                  value={newCommission.product_id}
                  onChange={(e) => setNewCommission({ ...newCommission, product_id: e.target.value })}
                >
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title} - ₹{product.price.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={newCommission.quantity}
                  onChange={(e) => setNewCommission({ ...newCommission, quantity: parseInt(e.target.value) || 1 })}
                  className="mt-1"
                />
              </div>

              {/* Budget */}
              <div>
                <Label htmlFor="budget">Budget (₹) *</Label>
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  step="100"
                  value={newCommission.budget}
                  onChange={(e) => setNewCommission({ ...newCommission, budget: parseFloat(e.target.value) || 0 })}
                  className="mt-1"
                  placeholder="Enter budget amount"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <textarea
                  id="description"
                  className="w-full mt-1 p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
                  rows={4}
                  value={newCommission.description}
                  onChange={(e) => setNewCommission({ ...newCommission, description: e.target.value })}
                  placeholder="Enter commission details and requirements..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={createCommission}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white"
                >
                  Create Commission
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateCommission(false)}
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
