export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  vendor: string;
  accent: string;
  tag: string;
  downloads: number;
};

export const products: Product[] = [
  {
    id: "aurora-lights",
    title: "Aurora Lights",
    description: "High-res neon gradient wallpaper tailored for deep black displays.",
    price: 449,
    category: "Wallpapers",
    vendor: "Lumen Studio",
    accent: "linear-gradient(135deg, #0f172a, #4338ca, #a855f7)",
    tag: "Premium",
    downloads: 120,
  },
  {
    id: "canvas-legacy",
    title: "Analog Canvas",
    description: "Soft grain texture wallpaper with editable mockup layers.",
    price: 349,
    category: "Templates",
    vendor: "Fable Design",
    accent: "linear-gradient(135deg, #1f2937, #4ade80)",
    tag: "New",
    downloads: 86,
  },
  {
    id: "moody-horizon",
    title: "Moody Horizon",
    description: "Atmospheric illustration built for hero banners and editorial spreads.",
    price: 529,
    category: "Illustrations",
    vendor: "Depth & Delta",
    accent: "linear-gradient(135deg, #0f172a, #1d4ed8)",
    tag: "Limited",
    downloads: 42,
  },
  {
    id: "paper-galaxy",
    title: "Paper Galaxy",
    description: "Modular starfield wallpaper that works with curve-based layouts.",
    price: 399,
    category: "Wallpapers",
    vendor: "Atlas Works",
    accent: "linear-gradient(135deg, #0f172a, #2563eb, #6366f1)",
    tag: "Editor",
    downloads: 210,
  },
  {
    id: "pulse-grid",
    title: "Pulse Grid",
    description: "Vector-friendly asset kit designed to pair with Razorpay receipts.",
    price: 299,
    category: "Templates",
    vendor: "Signal Studio",
    accent: "linear-gradient(135deg, #111827, #f97316)",
    tag: "Popular",
    downloads: 173,
  },
  {
    id: "halo-ink",
    title: "Halo Ink",
    description: "Monochromatic illustration ready for premium drops.",
    price: 579,
    category: "Illustrations",
    vendor: "Noir & Co.",
    accent: "linear-gradient(135deg, #0f172a, #e11d48)",
    tag: "Featured",
    downloads: 103,
  },
];
