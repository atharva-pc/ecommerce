import React, { useState } from 'react';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { toggleLike } from '../utils/api';
import { toast } from 'sonner';

export interface Product {
  id: string;
  title: string;
  artist?: string;
  artistAvatar?: string;
  price: number;
  image: string;
  category?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  isDigital?: boolean;
  isLiked?: boolean;
  slug?: string;
  rating?: number;
  reviews?: number;
  stock?: number;
}

interface ProductCardProps {
  product: Product;
  onViewDetails?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onViewDetails, onAddToCart }: ProductCardProps) {
  const { user, addToCart } = useApp();
  const [isLiked, setIsLiked] = useState(product.isLiked || false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (!user) {
        toast.error('Please login to like products');
        return;
      }
      await toggleLike(product.id);
      setIsLiked(!isLiked);
      toast.success(isLiked ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      toast.error('Failed to update favorite');
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAddingToCart(true);
    try {
      if (onAddToCart) {
        onAddToCart(product);
      } else {
        await addToCart({
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.image
        });
        toast.success('Added to cart');
      }
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const displayRating = typeof product.rating === 'number' && !isNaN(product.rating) && product.rating > 0
    ? product.rating
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8, transition: { duration: 0.3, ease: 'easeOut' } }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <div
        className="group h-full flex flex-col overflow-hidden bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 cursor-pointer"
        onClick={() => onViewDetails?.(product)}
        style={{ borderRadius: '16px' }}
      >
        {/* Image Container */}
        <div className="relative overflow-hidden bg-white shrink-0" style={{ aspectRatio: '3/4', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={product.image || '/placeholder.jpg'}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-110"
            style={{ maxHeight: '240px', background: 'white' }}
          />

          {/* Premium Gradient Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/0 via-black/0 to-black/0 group-hover:from-black/10 group-hover:to-transparent transition-all duration-500" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.isFeatured && (
              <Badge className="bg-[#b30452] hover:bg-[#b30452] text-white text-[10px] uppercase font-bold tracking-wider shadow-md border-0 rounded-md px-2 py-0.5">Featured</Badge>
            )}
            {product.isNew && (
              <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white text-[10px] uppercase font-bold tracking-wider shadow-md border-0 rounded-md px-2 py-0.5">New</Badge>
            )}
          </div>

          {/* Category badge */}
          {product.category && (
            <div className="absolute top-2 right-10">
              <Badge className="bg-white/90 text-gray-700 text-[10px] shadow-sm border-0 rounded-md px-1.5 py-0.5 backdrop-blur-sm capitalize">
                {product.category}
              </Badge>
            </div>
          )}

          {/* Like Button */}
          <button
            className={`absolute top-2 right-2 p-1.5 rounded-full shadow-md transition-all hover:scale-110 active:scale-95 ${isLiked ? 'bg-white text-red-500' : 'bg-white/90 text-gray-400 hover:text-red-400'
              }`}
            onClick={handleLike}
          >
            <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-current' : ''}`} />
          </button>

          {/* Stock indicator */}
          {product.stock !== undefined && product.stock === 1 && (
            <div className="absolute bottom-2 left-2">
              <span className="text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded-sm font-medium">
                Only {product.stock} left
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col flex-1">
          {/* Artist */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-4 h-4 rounded-full overflow-hidden bg-gray-200 shrink-0">
              {product.artistAvatar ? (
                <img src={product.artistAvatar} alt={product.artist || 'Artist'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#b30452]/10 flex items-center justify-center text-[8px] text-[#b30452] font-semibold">
                  {(product.artist || 'A').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-500 truncate font-medium">{product.artist || 'Unknown Artist'}</p>
          </div>

          <h3 className="line-clamp-1 text-gray-900 group-hover:text-[#b30452] transition-colors font-medium text-sm mb-1 leading-snug" style={{ fontFamily: 'Inter, sans-serif' }}>
            {product.title}
          </h3>

          {/* Rating */}
          {displayRating !== null && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-semibold text-gray-700">{displayRating.toFixed(1)}</span>
              {product.reviews !== undefined && product.reviews > 0 && (
                <span className="text-[10px] text-gray-400">({product.reviews})</span>
              )}
            </div>
          )}

          {/* Price and Cart */}
          <div className="mt-auto pt-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-900 font-bold text-base" style={{ fontFamily: 'Inter, sans-serif' }}>
                ₹{Number(product.price).toLocaleString('en-IN')}
              </p>
              {product.stock !== undefined && product.stock === 1 ? (
                <p className="text-[10px] text-orange-500 font-medium">Only {product.stock} left</p>
              ) : null}
            </div>

            <Button
              className="w-full bg-gradient-to-r from-[#a73f2b] to-[#b30452] hover:brightness-110 text-white h-8 text-xs font-semibold shadow-sm hover:shadow-[0px_4px_12px_rgba(179,4,82,0.3)] transition-all duration-300 flex items-center gap-1.5 border-0 rounded-lg"
              onClick={handleAddToCart}
              disabled={isAddingToCart || (product.stock !== undefined && product.stock === 0)}
            >
              <ShoppingCart className="w-3 h-3" />
              {isAddingToCart ? 'Adding...' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}