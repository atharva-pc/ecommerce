"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/lib/cart-context";
import { Minus, Plus, Trash2, ShoppingBag, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/lib/toast-context";

export default function CartPage() {
  const router = useRouter();
  const { cartItems, updateQuantity, removeFromCart, cartCount } = useCart();
  const { showToast } = useToast();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [hasShippingAddress, setHasShippingAddress] = useState(false);
  const [showCommissionDialog, setShowCommissionDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<typeof cartItems[0] | null>(null);
  const [commissionQuantity, setCommissionQuantity] = useState(2);
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [shippingPincode, setShippingPincode] = useState<string | null>(null);
  const supabase = createClient();

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      // Check if user has shipping address
      const { data: profile } = await supabase
        .from("profiles")
        .select("shipping_full_name, shipping_address, shipping_postal_code")
        .eq("id", user.id)
        .single();

      setHasShippingAddress(!!(profile?.shipping_full_name && profile?.shipping_address));
      setShippingPincode(profile?.shipping_postal_code || null);
    }
  };

  useEffect(() => {
    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Calculate shipping when user has address and cart has items
    if (shippingPincode && cartItems.length > 0) {
      calculateShipping();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingPincode, cartItems]);

  const calculateShipping = async () => {
    if (!shippingPincode) return;

    setCalculatingShipping(true);

    try {
      const totalWeight = cartItems.reduce((total, item) => {
        return total + (item.quantity * 1.5);
      }, 0);

      const orderValue = calculateTotal();

      const response = await fetch("/api/shiprocket/check-serviceability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupPincode: "400018",
          deliveryPincode: shippingPincode,
          weight: totalWeight,
          codAmount: 0,
          declaredValue: orderValue,
        }),
      });

      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        const cheapestCourier = result.data.reduce((min: any, courier: any) => {
          const courierRate = courier.freight_charge || courier.rate || 0;
          const minRate = min.freight_charge || min.rate || Infinity;
          return courierRate < minRate ? courier : min;
        });

        const shippingCharge = cheapestCourier.freight_charge || cheapestCourier.rate || 0;
        setShippingCost(Math.round(shippingCharge));
      } else {
        setShippingCost(100);
      }
    } catch (error) {
      console.error("Error calculating shipping:", error);
      setShippingCost(100);
    } finally {
      setCalculatingShipping(false);
    }
  };

  const calculateDeliveryDate = () => {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    return deliveryDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.product?.price || 0) * item.quantity;
    }, 0);
  };

  const handlePlaceOrder = () => {
    if (!user) {
      router.push("/login?redirect=/cart");
      return;
    }

    if (!hasShippingAddress) {
      router.push("/profile?tab=shipping");
      return;
    }

    // Proceed to checkout
    router.push("/checkout");
  };

  if (cartCount === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Navbar />
        <main className="container-custom py-20">
          <div className="text-center space-y-6">
            <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground" />
            <h1 className="text-3xl font-bold text-foreground">Your cart is empty</h1>
            <p className="text-muted-foreground">
              Add some amazing artworks to your cart!
            </p>
            <Link href="/products">
              <Button className="bg-primary hover:bg-primary/90 text-white">
                Browse Products
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      <main className="container-custom py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border rounded-lg p-4 flex gap-4"
              >
                {/* Product Image */}
                <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <Image
                    src={item.product?.preview_url || "/placeholder.jpg"}
                    alt={item.product?.title || "Product"}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">
                      {item.product?.title}
                    </h3>
                    {item.product?.is_limited_edition && (
                      <span className="inline-block mt-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded">
                        ⭐ Limited Edition
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.product?.description}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Delivered by {calculateDeliveryDate()}
                  </p>
                  <div className="flex items-center gap-4">
                    <p className="text-xl font-bold text-primary">
                      ₹{((item.product?.price || 0) * item.quantity).toLocaleString()}
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-sm text-muted-foreground">
                        ₹{item.product?.price.toLocaleString()} × {item.quantity}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quantity & Remove */}
                <div className="flex flex-col items-end justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromCart(item.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>

                  <div className="flex items-center gap-2 border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="h-8 w-8"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        // Don't allow commission for limited edition
                        if (item.product?.is_limited_edition) {
                          showToast("Cannot request commission for limited edition artwork", "error");
                          return;
                        }
                        // Show commission dialog for quantities > 1
                        setSelectedItem(item);
                        setShowCommissionDialog(true);
                      }}
                      className="h-8 w-8"
                      disabled={item.product?.is_limited_edition}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 border rounded-lg p-6 space-y-4 sticky top-4">
              <h2 className="text-xl font-bold text-foreground">Order Summary</h2>

              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({cartCount} items)</span>
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
                    <span className="text-green-600 dark:text-green-400">
                      {hasShippingAddress ? "Calculating..." : "Add address"}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold pt-4 border-t">
                <span>Total</span>
                <span className="text-primary">
                  ₹{(calculateTotal() + (shippingCost || 0)).toLocaleString()}
                </span>
              </div>

              {shippingCost !== null && !calculatingShipping && hasShippingAddress && (
                <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-blue-900 dark:text-blue-100 text-xs">
                    📦 Shipping to: {shippingPincode}
                  </p>
                </div>
              )}

              <Button
                onClick={handlePlaceOrder}
                className="w-full bg-primary hover:bg-primary/90 text-white"
              >
                {!user
                  ? "Login to Place Order"
                  : !hasShippingAddress
                  ? "Add Shipping Address"
                  : "Proceed to Checkout"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Delivery in 7-10 business days
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Commission Request Dialog */}
      {showCommissionDialog && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Commission Request</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This is an original artwork
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCommissionDialog(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="border-t pt-4 space-y-3">
              <p className="text-sm text-foreground">
                Each piece is <span className="font-semibold">handcrafted and unique</span>.
                For multiple copies, you can request a custom commission from the artist.
              </p>

              {/* Quantity Input */}
              <div>
                <Label htmlFor="commission_quantity">How many copies do you need?</Label>
                <Input
                  id="commission_quantity"
                  type="number"
                  min="2"
                  max="50"
                  value={commissionQuantity}
                  onChange={(e) => setCommissionQuantity(parseInt(e.target.value) || 2)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Estimated budget: ₹{((selectedItem?.product?.price || 0) * commissionQuantity).toLocaleString()}
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>How it works:</strong>
                </p>
                <ul className="text-xs text-blue-800 dark:text-blue-200 mt-2 space-y-1 list-disc list-inside">
                  <li>Purchase 1 artwork now (keep in cart)</li>
                  <li>Request commission for {commissionQuantity} copies</li>
                  <li>Artist reviews and quotes custom pricing</li>
                  <li>Pay only after artist accepts</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCommissionDialog(false);
                  setCommissionQuantity(2);
                }}
                className="flex-1"
              >
                Keep Quantity as 1
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedItem?.product) {
                    showToast("Product not found", "error");
                    return;
                  }

                  if (commissionQuantity < 2) {
                    showToast("Quantity must be at least 2", "warning");
                    return;
                  }

                  try {
                    const response = await fetch("/api/commissions/request", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        productId: selectedItem.product.id,
                        quantity: commissionQuantity,
                        description: `I would like ${commissionQuantity} copies of this artwork.`,
                        budget: selectedItem.product.price * commissionQuantity,
                      }),
                    });

                    const result = await response.json();

                    if (result.success) {
                      setShowCommissionDialog(false);
                      setCommissionQuantity(2);
                      showToast("Commission request sent to artist! Check your profile to track it.", "success");
                    } else {
                      showToast(result.error || "Failed to send request", "error");
                    }
                  } catch (error) {
                    console.error("Error sending commission request:", error);
                    showToast("Failed to send commission request", "error");
                  }
                }}
                className="flex-1 bg-primary hover:bg-primary/90 text-white"
              >
                Request Commission
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
