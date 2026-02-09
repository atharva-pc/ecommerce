"use client";

import { useState } from "react";
import Image from "next/image";

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  preview_url: string;
  category: string;
  created_at: string;
};

type Props = {
  products: Product[];
};

export default function ProductsGrid({ products }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", "painting", "drawing", "sketch"];

  const filteredProducts = selectedCategory === "all"
    ? products
    : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="space-y-8">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-3">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`rounded-full px-6 py-2 text-sm font-medium uppercase tracking-wider transition ${
              selectedCategory === category
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                : "border border-white/20 text-slate-300 hover:border-white/40"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Products Count */}
      <p className="text-sm text-slate-400">
        Showing {filteredProducts.length} {filteredProducts.length === 1 ? "artwork" : "artworks"}
      </p>

      {/* Products Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product) => (
          <article
            key={product.id}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm transition hover:border-purple-500/50"
          >
            {/* Image */}
            <div className="relative overflow-hidden bg-slate-800">
              <Image
                src={product.preview_url}
                alt={product.title}
                width={400}
                height={500}
                className="w-full h-auto object-cover transition duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              {/* Category Badge */}
              <div className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white backdrop-blur-sm">
                {product.category}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3 p-4">
              <h3 className="line-clamp-2 text-lg font-semibold text-white">
                {product.title}
              </h3>
              <p className="line-clamp-2 text-sm text-slate-400">
                {product.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                  ₹{product.price}
                </span>
                <button className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
                  View
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-xl text-slate-400">No artworks found in this category.</p>
        </div>
      )}
    </div>
  );
}
