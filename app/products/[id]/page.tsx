  "use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { Heart, Share2, ShoppingCart, Eye, MapPin, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/lib/toast-context";
import { createClient } from "@/utils/supabase/client";

interface Product {
  id: string;
  title: string;
  description: string;
  preview_url: string;
  price: number;
  category: string;
  created_at: string;
  vendor_id: string;
  size?: string;
}

interface Artist {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  store_name: string | null;
  category: string | null;
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const supabase = createClient();

  const [product, setProduct] = useState<Product | null>(null);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [views] = useState(Math.floor(Math.random() * 1000) + 100);
  const [likesCount, setLikesCount] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showCommissionDialog, setShowCommissionDialog] = useState(false);
  const [commissionData, setCommissionData] = useState({
    description: "",
    budget: "",
    quantity: 1,
  });

  useEffect(() => {
    fetchProductDetails();
    fetchLikes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const fetchArtistDetails = async (vendorId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, bio")
        .eq("id", vendorId)
        .single();

      if (error) {
        console.error("Error fetching artist:", error);
        return;
      }

      if (data) {
        // Map the data to include optional fields
        setArtist({
          ...data,
          store_name: null,
          category: null,
        });
      }
    } catch (error) {
      console.error("Error fetching artist:", error);
    }
  };

  const fetchLikes = async () => {
    try {
      // Get total likes count
      const { count, error: countError } = await supabase
        .from("product_likes")
        .select("*", { count: "exact", head: true })
        .eq("product_id", productId);

      if (countError) {
        // Table doesn't exist yet
        setLikesCount(0);
        return;
      }

      setLikesCount(count || 0);

      // Check if current user liked this product
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("product_likes")
          .select("id")
          .eq("product_id", productId)
          .eq("user_id", user.id)
          .maybeSingle();

        setIsLiked(!!data);
      }
    } catch {
      // Silently handle
      setLikesCount(0);
      setIsLiked(false);
    }
  };

  const handleLike = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      if (isLiked) {
        const { error } = await supabase
          .from("product_likes")
          .delete()
          .eq("product_id", productId)
          .eq("user_id", user.id);

        if (error) {
          showToast("Please run database setup first", "warning");
          return;
        }

        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
        showToast("Removed from favorites", "info");
      } else {
        const { error } = await supabase
          .from("product_likes")
          .insert({ product_id: productId, user_id: user.id });

        if (error) {
          showToast("Please run database setup first", "warning");
          return;
        }

        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        showToast("Added to favorites!", "success");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      showToast("Something went wrong", "error");
    }
  };

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      await addToCart(productId, 1);
      showToast("Added to cart!", "success");
    } catch (error) {
      console.error("Error adding to cart:", error);
      showToast("Cart requires database setup", "warning");
    } finally {
      setAddingToCart(false);
    }
  };

  const fetchProductDetails = async () => {
    try {
      // Fetch all products first (in real app, you'd have a single product endpoint)
      const response = await fetch("/api/products?type=all", {
        cache: "no-store",
      });

      const result = await response.json();
      if (result.success) {
        const allProducts = result.data.products || [];
        const currentProduct = allProducts.find((p: Product) => p.id === productId);

        if (currentProduct) {
          setProduct(currentProduct);

          // Fetch artist details
          fetchArtistDetails(currentProduct.vendor_id);

          // Get similar products from same category
          const similar = allProducts
            .filter((p: Product) => p.category === currentProduct.category && p.id !== productId)
            .slice(0, 4);
          setSimilarProducts(similar);
        }
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.title,
        text: `Check out this artwork: ${product?.title}`,
        url: window.location.href,
      });
    }
  };

  const handleCommissionRequest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        showToast("Please login to request a commission", "error");
        window.location.href = "/login";
        return;
      }

      if (!commissionData.description || !commissionData.budget) {
        showToast("Please fill in all required fields", "error");
        return;
      }

      const budget = parseFloat(commissionData.budget);
      if (isNaN(budget) || budget <= 0) {
        showToast("Please enter a valid budget", "error");
        return;
      }

      const response = await fetch("/api/commissions/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product?.id,
          vendorId: product?.vendor_id,
          description: commissionData.description,
          budget: budget,
          quantity: commissionData.quantity,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast("Commission request sent successfully!", "success");
        setShowCommissionDialog(false);
        setCommissionData({ description: "", budget: "", quantity: 1 });
      } else {
        showToast(result.error || "Failed to send commission request", "error");
      }
    } catch (error) {
      console.error("Error sending commission request:", error);
      showToast("Failed to send commission request", "error");
    }
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

  if (!product) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Navbar />
        <div className="container-custom py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link href="/products" className="link-primary">
            ← Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      <main className="container-custom py-8 space-y-12">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">Home</Link>
          {" / "}
          <Link href="/products" className="hover:text-primary">Products</Link>
          {" / "}
          <span className="text-foreground">{product.title}</span>
        </nav>

        {/* Product Section */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image */}
          <div className="relative aspect-square bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden">
            <Image
              src={product.preview_url}
              alt={product.title}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
              priority
            />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{product.title}</h1>
              <p className="text-4xl font-bold text-primary">₹{product.price.toLocaleString()}</p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{views} views</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className={`h-4 w-4 ${isLiked ? "fill-primary text-primary" : ""}`} />
                <span>{likesCount} likes</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleLike}
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                <Heart className={`h-5 w-5 ${isLiked ? "fill-primary text-primary" : ""}`} />
              </Button>

              <Button onClick={handleShare} variant="outline" size="icon" className="shrink-0">
                <Share2 className="h-5 w-5" />
              </Button>

              <Button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="flex-1 bg-primary hover:bg-primary/90 text-white gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                {addingToCart ? "Adding..." : "Add to Cart"}
              </Button>

              <Button className="flex-1 bg-foreground hover:bg-foreground/90 text-white">
                Buy Now
              </Button>
            </div>

            {/* Product Details */}
            <div className="border-t pt-6 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Size:</span>
                  <p className="font-medium">{product.size || "A4"} (8.3&quot; x 11.7&quot;)</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <p className="font-medium capitalize">{product.category}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <p className="font-medium">{new Date(product.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Medium:</span>
                  <p className="font-medium">Original {product.category}</p>
                </div>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Domestic Shipping</p>
                  <p className="text-muted-foreground">Delivered in 7-10 business days</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    International shipping not available at this time
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Artist */}
        <div className="grid lg:grid-cols-3 gap-8 border-t pt-8">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold text-foreground">About this Artwork</h2>
            <p className="text-muted-foreground leading-relaxed">
              {product.description || "No description available for this artwork."}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-6 space-y-4 h-fit">
            <h3 className="font-bold text-lg">About the Artist</h3>
            <div className="flex items-center gap-3">
              {artist?.avatar_url ? (
                <div className="relative h-12 w-12 rounded-full overflow-hidden">
                  <Image
                    src={artist.avatar_url}
                    alt={artist.full_name || "Artist"}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
                  {artist?.full_name?.[0]?.toUpperCase() || artist?.store_name?.[0]?.toUpperCase() || "A"}
                </div>
              )}
              <div>
                <p className="font-semibold">{artist?.full_name || artist?.store_name || "Artist"}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {artist?.category ? `${artist.category} Artist` : "India"}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {artist?.bio || "Professional artist passionate about creating unique pieces that inspire."}
            </p>
            <div className="space-y-2">
              <Link href={`/artists/${product.vendor_id}`}>
                <Button variant="outline" className="w-full">
                  View Profile
                </Button>
              </Link>
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white"
                onClick={() => setShowCommissionDialog(true)}
              >
                Request Custom Commission
              </Button>
            </div>
          </div>
        </div>

        {/* Similar Artworks */}
        {similarProducts.length > 0 && (
          <div className="border-t pt-8 space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Similar Artworks</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  title={p.title}
                  preview_url={p.preview_url}
                  price={p.price}
                  category={p.category}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Custom Commission Dialog */}
      {showCommissionDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Request Custom Commission</h2>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowCommissionDialog(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Request a custom artwork from <span className="font-semibold">{artist?.full_name || artist?.store_name || "this artist"}</span>
                </p>
                <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded-lg text-sm">
                  <p className="font-medium">Based on: {product.title}</p>
                  <p className="text-muted-foreground">₹{product.price.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="commission_description">What would you like the artist to create? *</Label>
                <textarea
                  id="commission_description"
                  value={commissionData.description}
                  onChange={(e) => setCommissionData({ ...commissionData, description: e.target.value })}
                  placeholder="Describe your custom artwork request..."
                  className="w-full min-h-[100px] px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-900 dark:border-slate-700 mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="commission_budget">Your Budget (₹) *</Label>
                <Input
                  id="commission_budget"
                  type="number"
                  min="1"
                  step="100"
                  value={commissionData.budget}
                  onChange={(e) => setCommissionData({ ...commissionData, budget: e.target.value })}
                  placeholder="Enter your budget"
                  className="mt-1"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The artist will review and may suggest a final price
                </p>
              </div>

              <div>
                <Label htmlFor="commission_quantity">Quantity</Label>
                <Input
                  id="commission_quantity"
                  type="number"
                  min="1"
                  value={commissionData.quantity}
                  onChange={(e) => setCommissionData({ ...commissionData, quantity: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-200 mb-1">How it works:</p>
                <ol className="list-decimal list-inside space-y-1 text-amber-800 dark:text-amber-300 text-xs">
                  <li>You send your commission request</li>
                  <li>Artist reviews and accepts/declines</li>
                  <li>If accepted, artist sets final price</li>
                  <li>You can pay and artist creates your artwork</li>
                </ol>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCommissionDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCommissionRequest}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white"
                >
                  Send Request
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t bg-gray-50 dark:bg-slate-900 mt-20">
        <div className="container-custom py-12">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 ArtVPP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
