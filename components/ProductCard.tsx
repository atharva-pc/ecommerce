"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/lib/toast-context";
import { createClient } from "@/utils/supabase/client";

interface ProductCardProps {
  id: string;
  title: string;
  preview_url: string;
  price: number;
  category: string;
  artist?: {
    name: string;
  };
  is_limited_edition?: boolean;
}

export default function ProductCard({ id, title, preview_url, price, category, artist, is_limited_edition }: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchLikes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchLikes = async () => {
    try {
      // Get total likes count
      const { count, error: countError } = await supabase
        .from("product_likes")
        .select("*", { count: "exact", head: true })
        .eq("product_id", id);

      if (countError) {
        // Table doesn't exist yet - silently ignore
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
          .eq("product_id", id)
          .eq("user_id", user.id)
          .maybeSingle();

        setIsLiked(!!data);
      }
    } catch {
      // Silently handle - likes feature requires database setup
      setLikesCount(0);
      setIsLiked(false);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Redirect to login if not authenticated
        window.location.href = "/login";
        return;
      }

      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from("product_likes")
          .delete()
          .eq("product_id", id)
          .eq("user_id", user.id);

        if (error) {
          console.warn("Likes feature requires database setup");
          showToast("Please run database setup first. Check DATABASE_SCHEMA.sql", "warning");
          return;
        }

        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
        showToast("Removed from favorites", "info");
      } else {
        // Like
        const { error } = await supabase
          .from("product_likes")
          .insert({ product_id: id, user_id: user.id });

        if (error) {
          console.warn("Likes feature requires database setup");
          showToast("Please run database setup first. Check DATABASE_SCHEMA.sql", "warning");
          return;
        }

        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        showToast("Added to favorites!", "success");
      }
    } catch {
      showToast("Something went wrong", "error");
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    try {
      await addToCart(id, 1);
      showToast("Added to cart!", "success");
    } catch (error) {
      console.error("Error adding to cart:", error);
      showToast("Cart requires database setup. Check DATABASE_SCHEMA.sql", "warning");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link href={`/products/${id}`}>
      <div className="group bg-white dark:bg-slate-800 rounded-lg overflow-hidden border hover:shadow-lg transition-shadow duration-300 cursor-pointer">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={preview_url}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {is_limited_edition && (
            <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 rounded-md text-xs font-bold shadow-lg">
              ⭐ Limited
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          {/* Title */}
          <h3 className="font-semibold text-lg line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>

          {/* Artist Name */}
          {artist && (
            <p className="text-sm text-muted-foreground">
              by <span className="link-primary">{artist.name}</span>
            </p>
          )}

          {/* Category */}
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{category}</p>

          {/* Price */}
          <p className="text-xl font-bold text-foreground">₹{price.toLocaleString()}</p>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleLike}
              className={`${
                isLiked ? "bg-red-50 border-primary text-primary dark:bg-red-950" : ""
              } hover:bg-red-50 hover:border-primary hover:text-primary dark:hover:bg-red-950 transition-colors relative`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              {likesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                  {likesCount}
                </span>
              )}
            </Button>

            <Button
              onClick={handleAddToCart}
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary/90 text-white gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              {loading ? "Adding..." : "Add to Cart"}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
