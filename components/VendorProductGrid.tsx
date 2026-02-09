"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { VendorProduct } from "@/types/vendor";

type Props = {
  products: VendorProduct[];
  onDelete: (id: string) => void;
};

export default function VendorProductGrid({ products, onDelete }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);

    const response = await fetch("/api/vendor/products", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(result.message ?? "Unable to delete product");
      setDeletingId(null);
      return;
    }

    onDelete(id);
    setDeletingId(null);
  };

  if (!products.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 text-sm text-slate-400">
        No products found. Upload your first asset to see it here.
      </div>
    );
  }

  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
      {error && <p className="text-xs text-rose-400">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {products.map((product) => (
          <article
            key={product.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4"
          >
            <div
              className="h-48 w-full rounded-2xl bg-cover bg-center"
              style={{ backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0) 20%, rgba(15,23,42,1)), url(${product.preview_url})` }}
            />
            <div className="flex flex-col gap-2 text-sm text-slate-200">
              <span className="text-xs uppercase tracking-[0.4em] text-slate-400">
                {product.category}
              </span>
              <h3 className="text-lg font-semibold text-white">{product.title}</h3>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                ₹{product.price}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="ghost">
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={deletingId === product.id}
                  onClick={() => handleDelete(product.id)}
                >
                  {deletingId === product.id ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
