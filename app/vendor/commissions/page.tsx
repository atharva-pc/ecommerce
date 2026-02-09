"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/lib/toast-context";
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Package
} from "lucide-react";

interface Commission {
  id: string;
  customer_id: string;
  product_id: string;
  description: string;
  budget: number;
  quantity: number;
  status: string;
  vendor_response: string | null;
  quoted_price: number | null;
  profiles: {
    id: string;
    full_name: string | null;
    email: string;
  };
  products: {
    id: string;
    title: string;
    price: number;
    preview_url: string;
  } | null;
}

export default function VendorCommissionsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [responding, setResponding] = useState(false);
  const [quotedPrice, setQuotedPrice] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [responseMessage, setResponseMessage] = useState("");

  useEffect(() => {
    checkVendorAccess();
  }, []);

  const checkVendorAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      console.log("Current user:", user?.email || "Not logged in");

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, vendor_status")
        .eq("id", user.id)
        .single();

      console.log("Profile data:", profile);

      if (profile?.role !== "vendor" || profile?.vendor_status !== "approved") {
        console.warn("Access denied - not an approved vendor");
        showToast("Access denied", "warning");
        router.push("/");
        return;
      }

      console.log("Vendor access granted, fetching commissions...");
      await fetchCommissions();
    } catch (error) {
      console.error("Error checking access:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissions = async () => {
    try {
      console.log("Fetching commissions from API...");
      const response = await fetch("/api/vendor/commissions");
      const result = await response.json();

      console.log("API Response:", result);
      console.log("Commissions count:", result.data?.commissions?.length || 0);

      if (result.success) {
        setCommissions(result.data.commissions || []);
      } else {
        console.error("API returned error:", result.error);
        showToast(result.error || "Failed to load commissions", "error");
      }
    } catch (error) {
      console.error("Error fetching commissions:", error);
      showToast("Failed to load commissions", "error");
    }
  };

  const handleRespond = async (action: "accept" | "reject") => {
    if (!selectedCommission) return;

    if (action === "accept" && !quotedPrice) {
      showToast("Please enter a quoted price", "warning");
      return;
    }

    setResponding(true);

    try {
      const response = await fetch("/api/vendor/commissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commissionId: selectedCommission.id,
          status: action === "accept" ? "accepted" : "rejected",
          quotedPrice: action === "accept" ? parseFloat(quotedPrice) : null,
          vendorResponse: responseMessage || (action === "accept"
            ? `Commission accepted! Estimated delivery: ${deliveryDays || "14"} days.`
            : "Sorry, I cannot take on this commission at this time."
          ),
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(
          action === "accept" ? "Commission accepted!" : "Commission rejected",
          "success"
        );
        setSelectedCommission(null);
        setQuotedPrice("");
        setDeliveryDays("");
        setResponseMessage("");
        await fetchCommissions();
      } else {
        showToast(result.error || "Failed to respond", "error");
      }
    } catch (error) {
      console.error("Error responding to commission:", error);
      showToast("Failed to respond to commission", "error");
    } finally {
      setResponding(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400", icon: Clock },
      accepted: { color: "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400", icon: CheckCircle },
      rejected: { color: "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400", icon: XCircle },
      completed: { color: "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400", icon: Package },
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 w-fit ${badge.color}`}>
        <Icon className="h-4 w-4" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Navbar />
        <div className="container-custom py-20 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      <main className="container-custom py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Commission Requests</h1>
          <p className="text-muted-foreground">
            Manage custom artwork requests from customers
          </p>
        </div>

        {commissions.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No commission requests yet
            </h2>
            <p className="text-muted-foreground">
              When customers request custom work, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {commissions.map((commission) => (
              <div
                key={commission.id}
                className="bg-white dark:bg-slate-900 border rounded-lg p-6 space-y-4"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Product Image */}
                  {commission.products && (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={commission.products.preview_url}
                        alt={commission.products.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* Commission Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">
                          {commission.products?.title || "Custom Commission Request"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Requested by {commission.profiles.full_name || commission.profiles.email}
                        </p>
                      </div>
                      {getStatusBadge(commission.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Quantity:</span>
                        <p className="font-semibold text-foreground">{commission.quantity}</p>
                      </div>
                      {commission.budget && (
                        <div>
                          <span className="text-muted-foreground">Customer Budget:</span>
                          <p className="font-semibold text-foreground">₹{commission.budget.toLocaleString()}</p>
                        </div>
                      )}
                      {commission.products && (
                        <div>
                          <span className="text-muted-foreground">Original Price:</span>
                          <p className="font-semibold text-foreground">₹{commission.products.price.toLocaleString()}</p>
                        </div>
                      )}
                    </div>

                    {commission.description && (
                      <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                        <p className="text-sm text-muted-foreground mb-1">Request Details:</p>
                        <p className="text-sm text-foreground">{commission.description}</p>
                      </div>
                    )}

                    {commission.vendor_response && (
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-sm text-blue-900 dark:text-blue-100 mb-1 font-semibold">
                          Your Response:
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          {commission.vendor_response}
                        </p>
                        {commission.quoted_price && (
                          <p className="text-sm text-blue-800 dark:text-blue-200 mt-2 font-semibold">
                            Quoted Price: ₹{commission.quoted_price.toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}

                    {commission.status === "pending" && (
                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={() => setSelectedCommission(commission)}
                          className="bg-primary hover:bg-primary/90 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept & Quote
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedCommission(commission);
                            setResponseMessage("Sorry, I cannot take on this commission at this time.");
                          }}
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Response Dialog */}
        {selectedCommission && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full p-6 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {responseMessage.includes("cannot") ? "Decline Commission" : "Accept Commission"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedCommission.products?.title || "Custom Request"}
                </p>
              </div>

              <div className="border-t pt-4 space-y-4">
                {!responseMessage.includes("cannot") && (
                  <>
                    <div>
                      <Label htmlFor="quoted_price">
                        Quoted Price (₹) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="quoted_price"
                        type="number"
                        placeholder="Enter your price"
                        value={quotedPrice}
                        onChange={(e) => setQuotedPrice(e.target.value)}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Customer budget: ₹{selectedCommission.budget?.toLocaleString() || "Not specified"}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="delivery_days">Estimated Delivery (days)</Label>
                      <Input
                        id="delivery_days"
                        type="number"
                        placeholder="e.g., 14"
                        value={deliveryDays}
                        onChange={(e) => setDeliveryDays(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="response_message">Message to Customer</Label>
                  <textarea
                    id="response_message"
                    placeholder="Optional message..."
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-lg resize-none h-24 bg-white dark:bg-slate-800 text-foreground"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCommission(null);
                    setQuotedPrice("");
                    setDeliveryDays("");
                    setResponseMessage("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleRespond(responseMessage.includes("cannot") ? "reject" : "accept")}
                  disabled={responding}
                  className={`flex-1 ${
                    responseMessage.includes("cannot")
                      ? "bg-destructive hover:bg-destructive/90"
                      : "bg-primary hover:bg-primary/90"
                  } text-white`}
                >
                  {responding ? "Processing..." : responseMessage.includes("cannot") ? "Decline" : "Accept & Send Quote"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
