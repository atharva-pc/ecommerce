"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  onSuccess: (product: {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    preview_url: string;
    created_at: string;
  }) => void;
};

export default function VendorProductUploadForm({ onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setError(null);

    const formData = new FormData(event.currentTarget);
    setLoading(true);

    const response = await fetch("/api/vendor/upload-product", {
      method: "POST",
      body: formData,
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(result.message ?? "Upload failed");
      setLoading(false);
      return;
    }

    setStatus("Product uploaded successfully");
    onSuccess(result.product);
    event.currentTarget.reset();
    setLoading(false);
  };

  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/60 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">New upload</p>
        <h2 className="text-2xl font-semibold">Add a digital product</h2>
        <p className="text-sm text-slate-400">Only approved vendors may upload.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            name="preview"
            type="file"
            accept="image/*"
            required
            className="rounded-2xl border border-slate-800/80 bg-slate-950/50 px-4 py-2 text-sm text-white"
          />
          <input
            name="digital"
            type="file"
            required
            className="rounded-2xl border border-slate-800/80 bg-slate-950/50 px-4 py-2 text-sm text-white"
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            name="title"
            type="text"
            placeholder="Title"
            required
            className="rounded-2xl border border-slate-800/80 bg-slate-950/50 px-4 py-2 text-sm text-white"
          />
          <input
            name="price"
            type="number"
            min="0"
            placeholder="Price (₹)"
            required
            className="rounded-2xl border border-slate-800/80 bg-slate-950/50 px-4 py-2 text-sm text-white"
          />
        </div>
        <div className="grid gap-3">
          <input
            name="category"
            type="text"
            placeholder="Category"
            required
            className="rounded-2xl border border-slate-800/80 bg-slate-950/50 px-4 py-2 text-sm text-white"
          />
          <textarea
            name="description"
            placeholder="Description"
            required
            className="min-h-[120px] rounded-2xl border border-slate-800/80 bg-slate-950/50 px-4 py-2 text-sm text-white"
          />
        </div>
        <div className="flex flex-col gap-2">
          {error && <p className="text-sm text-rose-400">{error}</p>}
          {status && <p className="text-sm text-emerald-300">{status}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Uploading…" : "Upload product"}
          </Button>
        </div>
      </form>
    </section>
  );
}
