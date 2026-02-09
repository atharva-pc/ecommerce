"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/products";
import { Button } from "./ui/button";

type MarketplaceSectionProps = {
  products: Product[];
};

const MarketplaceSection = ({ products }: MarketplaceSectionProps) => {
  const [category, setCategory] = useState("All");
  const categories = useMemo(
    () => ["All", ...new Set(products.map((product) => product.category))],
    [products],
  );
  const filteredProducts = useMemo(
    () =>
      category === "All"
        ? products
        : products.filter((product) => product.category === category),
    [category, products],
  );

  return (
    <section
      id="product"
      className="rounded-3xl border border-white/40 bg-white/90 px-6 py-10 shadow-xl shadow-slate-900/10 dark:border-slate-800/60 dark:bg-slate-900/80"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">
            Product lineup
          </p>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Curated wallpapers, templates, and illustrations
          </h2>
          <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Preview a premium experience that only unlocks downloads once Razorpay
            confirms payment status, keeping every digital asset protected.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
            Secure payments powered by Razorpay
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {categories.map((name) => (
          <Button
            key={name}
            size="sm"
            variant={name === category ? "default" : "ghost"}
            className="rounded-full text-[0.65rem] uppercase tracking-[0.4em]"
            type="button"
            onClick={() => setCategory(name)}
          >
            {name}
          </Button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {filteredProducts.map((product) => (
          <article
            key={product.id}
            className="flex flex-col gap-5 rounded-3xl border border-slate-200 px-5 py-6 shadow-lg shadow-slate-900/5 dark:border-slate-800/60 dark:bg-slate-950/70"
          >
            <div
              className="relative h-44 rounded-2xl border border-white/20 bg-slate-900/10"
              style={{
                backgroundImage: product.accent,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-black/30 via-black/10 to-black/50" />
              <span className="absolute bottom-4 left-4 rounded-full border border-white/40 bg-white/20 px-3 py-1 text-[0.6rem] uppercase tracking-[0.4em] text-white">
                {product.tag}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                {product.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                {product.description}
              </p>
            </div>
            <div className="mt-auto flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                  ₹{product.price}
                </p>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">
                  {product.vendor}
                </p>
              </div>
              <Button variant="secondary" size="sm" type="button">
                Add to cart
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default MarketplaceSection;
