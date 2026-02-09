"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import DatabaseSetupNotice from "@/components/DatabaseSetupNotice";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  title: string;
  preview_url: string;
  price: number;
  category: string;
  description?: string;
  is_limited_edition?: boolean;
}

const categories = [
  { name: "Paintings", image: "/assets/products/1.jpg", slug: "painting" },
  { name: "Drawings", image: "/assets/products/2.jpg", slug: "drawing" },
  { name: "Sketches", image: "/assets/products/3.jpg", slug: "sketch" },
  { name: "Digital Art", image: "/assets/products/4.jpg", slug: "digital" },
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [limitedEdition, setLimitedEdition] = useState<Product[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products?type=all", {
        cache: "no-store",
      });

      const result = await response.json();
      if (result.success) {
        const allProducts = result.data.products || [];
        console.log("Total products fetched:", allProducts.length);
        setProducts(allProducts);

        // Filter only limited edition products for the carousel
        const limitedOnly = allProducts.filter((p: any) => p.is_limited_edition === true);
        console.log("Limited edition products found:", limitedOnly.length, limitedOnly);
        setLimitedEdition(limitedOnly);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % limitedEdition.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + limitedEdition.length) % limitedEdition.length);
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

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      <main className="container-custom py-8 space-y-16">
        {/* Database Setup Notice */}
        <DatabaseSetupNotice />

        {/* Limited Edition Carousel */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-foreground">Limited Edition</h2>
            <Link href="/products?filter=limited" className="link-primary text-sm">
              View All →
            </Link>
          </div>

          {limitedEdition.length === 0 ? (
            <div className="bg-gray-100 dark:bg-slate-800 rounded-xl p-12 text-center">
              <p className="text-muted-foreground mb-4">
                No limited edition artworks available yet.
              </p>
              <p className="text-sm text-muted-foreground">
                Vendors can mark their artworks as limited edition when uploading.
              </p>
            </div>
          ) : (
            <div className="relative bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden aspect-[16/9] md:aspect-[21/9]">
              {limitedEdition.map((product, index) => (
                <div
                  key={product.id}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === currentSlide ? "opacity-100 z-10" : "opacity-0 pointer-events-none"
                  }`}
                >
                  <Image
                    src={product.preview_url}
                    alt={product.title}
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <h3 className="text-2xl md:text-4xl font-bold mb-2">{product.title}</h3>
                    <p className="text-lg md:text-xl mb-4">₹{product.price.toLocaleString()}</p>
                    <Link href={`/products/${product.id}`}>
                      <Button className="bg-primary hover:bg-primary/90 text-white">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}

              {/* Navigation Buttons */}
              {limitedEdition.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-800/90 hover:bg-white p-2 rounded-full shadow-lg transition-colors z-20"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="h-6 w-6 text-foreground" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-800/90 hover:bg-white p-2 rounded-full shadow-lg transition-colors z-20"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="h-6 w-6 text-foreground" />
                  </button>
                </>
              )}

              {/* Dots */}
              {limitedEdition.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                  {limitedEdition.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentSlide ? "w-8 bg-primary" : "w-2 bg-white/50"
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Explore Categories */}
        <section className="space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Explore Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/products?category=${category.slug}`}
                className="group"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <h3 className="text-white text-xl font-bold">{category.name}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* All Products */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-foreground">All Artworks</h2>
            <Link href="/products" className="link-primary text-sm">
              View All →
            </Link>
          </div>

          {products.length === 0 ? (
            <p className="text-center text-muted-foreground py-20">
              No products available at the moment.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  title={product.title}
                  preview_url={product.preview_url}
                  price={product.price}
                  category={product.category}
                  is_limited_edition={product.is_limited_edition}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 dark:bg-slate-900 mt-20">
        <div className="container-custom py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">ArtVPP</h3>
              <p className="text-sm text-muted-foreground">
                Discover and collect unique artworks from talented artists around the world.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/products" className="hover:text-primary">All Artworks</Link></li>
                <li><Link href="/products?category=painting" className="hover:text-primary">Paintings</Link></li>
                <li><Link href="/products?category=drawing" className="hover:text-primary">Drawings</Link></li>
                <li><Link href="/products?category=sketch" className="hover:text-primary">Sketches</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Artists</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/vendor-signup" className="hover:text-primary">Sell Your Art</Link></li>
                <li><Link href="/artists" className="hover:text-primary">Artist Directory</Link></li>
                <li><Link href="/contact" className="hover:text-primary">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">About</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-primary">About ArtVPP</Link></li>
                <li><Link href="/shipping" className="hover:text-primary">Shipping Info</Link></li>
                <li><Link href="/terms" className="hover:text-primary">Terms &amp; Conditions</Link></li>
                <li><Link href="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2024 ArtVPP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
