"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/lib/toast-context";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";


export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, clearCart } = useCart();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    checkUser();
    loadRazorpayScript();
    fetchDemoMode();
  }, []);

  useEffect(() => {
    // Redirect to cart if no items
    if (!loading && cartItems.length === 0) {
      router.push("/cart");
    }
  }, [loading, cartItems.length, router]);

  useEffect(() => {
    // Calculate shipping when profile is loaded
    if (profile?.shipping_postal_code && cartItems.length > 0) {
      calculateShipping();
    }
  }, [profile, cartItems]);

  const loadRazorpayScript = () => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  };

  const fetchDemoMode = async () => {
    try {
      const response = await fetch("/api/admin/demo-mode");
      const result = await response.json();
      if (result.success) {
        setDemoMode(result.demoMode);
      }
    } catch (error) {
      console.error("Error fetching demo mode:", error);
    }
  };

  const handleDemoPayment = async () => {
    setProcessing(true);

    try {
      const totalAmount = calculateTotal() + (shippingCost || 0);

      const response = await fetch("/api/checkout/demo-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems,
          totalAmount,
          shippingCost: shippingCost || 0,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast("Demo order completed successfully!", "success");
        clearCart();
        router.push(`/order-success?orderId=${result.data.orderId}&demo=true`);
      } else {
        showToast(result.error || "Failed to complete demo order", "error");
      }
    } catch (error) {
      console.error("Demo payment error:", error);
      showToast("Failed to process demo order", "error");
    } finally {
      setProcessing(false);
    }
  };

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login?redirect=/checkout");
        return;
      }

      setUser(user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profile?.shipping_full_name || !profile?.shipping_address) {
        showToast("Please add shipping address first", "warning");
        router.push("/profile?tab=shipping");
        return;
      }

      setProfile(profile);
    } catch (error) {
      console.error("Error checking user:", error);
      showToast("Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  const calculateShipping = async () => {
    if (!profile?.shipping_postal_code) return;

    setCalculatingShipping(true);

    try {
      // Calculate total weight (1.5kg per item by default)
      const totalWeight = cartItems.reduce((total, item) => {
        return total + (item.quantity * 1.5); // 1.5kg per product
      }, 0);

      // Calculate total order value for COD (if needed)
      const orderValue = calculateTotal();

      console.log("Calculating shipping for:", {
        pickupPincode: "400018",
        deliveryPincode: profile.shipping_postal_code,
        weight: totalWeight,
        orderValue,
      });

      const response = await fetch("/api/shiprocket/check-serviceability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupPincode: "400018", // Your pickup pincode
          deliveryPincode: profile.shipping_postal_code,
          weight: totalWeight,
          codAmount: 0, // Prepaid order
          declaredValue: orderValue,
        }),
      });

      const result = await response.json();

      console.log("Shipping API response:", result);

      if (result.success && result.data && result.data.length > 0) {
        // Get the cheapest courier option
        const cheapestCourier = result.data.reduce((min: any, courier: any) => {
          const courierRate = courier.freight_charge || courier.rate || 0;
          const minRate = min.freight_charge || min.rate || Infinity;
          return courierRate < minRate ? courier : min;
        });

        const shippingCharge = cheapestCourier.freight_charge || cheapestCourier.rate || 0;
        setShippingCost(Math.round(shippingCharge));
        console.log("Shipping cost calculated:", Math.round(shippingCharge));
      } else {
        // Fallback to flat rate if API fails
        console.warn("No courier data, using fallback rate");
        setShippingCost(100);
      }
    } catch (error) {
      console.error("Error calculating shipping:", error);
      // Fallback to flat rate on error
      console.warn("Using fallback shipping rate due to error");
      setShippingCost(100);
      showToast("Using standard shipping rate", "info");
    } finally {
      setCalculatingShipping(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.product?.price || 0) * item.quantity;
    }, 0);
  };

  const handlePayment = async (): Promise<void> => {
    if (typeof window === 'undefined' || !(window as any).Razorpay) {
      showToast("Payment system not loaded. Please refresh.", "error");
      return;
    }

    setProcessing(true);

    try {
      const subtotal = calculateTotal();
      const shipping = shippingCost || 0;
      const totalAmount = subtotal + shipping;

      // Create Razorpay order
      const orderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalAmount }),
      });

      const orderResult = await orderResponse.json();

      if (!orderResult.success) {
        showToast(orderResult.error || "Failed to create order", "error");
        setProcessing(false);
        return;
      }

      const { orderId, amount, currency } = orderResult.data;

      // Prepare order data for verification
      const orderData = {
        totalPrice: totalAmount,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.product?.price || 0,
        })),
      };

      // Razorpay options
       
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: "ArtVPP",
        description: "Purchase Original Artwork",
        order_id: orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderData,
              }),
            });

            const verifyResult = await verifyResponse.json();

            if (verifyResult.success) {
              await clearCart();
              showToast("Payment successful! Order placed.", "success");
              router.push(`/order-success?orderId=${verifyResult.data.orderId}`);
            } else {
              showToast("Payment verification failed", "error");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            showToast("Payment verification failed", "error");
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: profile?.shipping_full_name || "",
          email: user?.email || "",
          contact: profile?.shipping_phone || "",
        },
        theme: {
          color: "#dc2626",
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            showToast("Payment cancelled", "info");
          },
        },
      };
       

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      showToast("Failed to initiate payment", "error");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Navbar />
        <div className="container-custom py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Navbar />
        <div className="container-custom py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-4">Redirecting to cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      <main className="container-custom py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border rounded-lg p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Order Items</h2>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={item.product?.preview_url || "/placeholder.jpg"}
                        alt={item.product?.title || "Product"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{item.product?.title}</h3>
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                      <p className="text-primary font-semibold mt-1">
                        ₹{((item.product?.price || 0) * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border rounded-lg p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Shipping Address</h2>
              <div className="text-sm text-foreground space-y-1">
                <p className="font-semibold">{profile?.shipping_full_name}</p>
                <p>{profile?.shipping_address}</p>
                <p>{profile?.shipping_city}, {profile?.shipping_state} - {profile?.shipping_postal_code}</p>
                <p>Phone: {profile?.shipping_phone}</p>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 border rounded-lg p-6 space-y-4 sticky top-4">
              <h2 className="text-xl font-bold text-foreground">Payment Summary</h2>

              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{calculateTotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  {calculatingShipping ? (
                    <span className="text-sm">Calculating...</span>
                  ) : shippingCost !== null ? (
                    <span className={shippingCost === 0 ? "text-green-600 dark:text-green-400" : ""}>
                      {shippingCost === 0 ? "FREE" : `₹${shippingCost.toLocaleString()}`}
                    </span>
                  ) : (
                    <span className="text-sm">---</span>
                  )}
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold pt-4 border-t">
                <span>Total</span>
                <span className="text-primary">
                  ₹{(calculateTotal() + (shippingCost || 0)).toLocaleString()}
                </span>
              </div>

              {shippingCost !== null && !calculatingShipping && (
                <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    📦 Shipping Details:
                  </p>
                  <p className="text-blue-800 dark:text-blue-200">
                    • Domestic shipping (7-10 days)
                  </p>
                  <p className="text-blue-800 dark:text-blue-200">
                    • Calculated via Shiprocket
                  </p>
                  <p className="text-blue-800 dark:text-blue-200">
                    • To: {profile?.shipping_postal_code}
                  </p>
                </div>
              )}

              <Button
                onClick={handlePayment}
                disabled={processing || calculatingShipping}
                className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : calculatingShipping ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Calculating Shipping...
                  </>
                ) : (
                  "Pay Now"
                )}
              </Button>

              {demoMode && (
                <Button
                  onClick={handleDemoPayment}
                  disabled={processing || calculatingShipping}
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Processing Demo...
                    </>
                  ) : (
                    "🎬 Complete Demo Payment (Instant)"
                  )}
                </Button>
              )}

              <div className="text-xs text-center text-muted-foreground space-y-1">
                <p>🔒 Secure payment powered by Razorpay</p>
                <p>We accept UPI, Cards, Net Banking & Wallets</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
