"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Search, ShoppingCart, Sun, Moon, Menu, X, User } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "@/lib/cart-context";

const Navbar = () => {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [isVendor, setIsVendor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { cartCount } = useCart();

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || !mounted) return;
      setUser(user);

      // Check if user is an approved vendor or admin
      supabase
        .from("profiles")
        .select("role, vendor_status")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (!mounted) return;
          setIsVendor(data?.role === "vendor" && data?.vendor_status === "approved");
          setIsAdmin(data?.role === "admin");
        });
    });

    // Initialize theme from localStorage
    const initTheme = () => {
      const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
      if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.classList.toggle("dark", savedTheme === "dark");
      }
    };
    initTheme();

    return () => {
      mounted = false;
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white dark:bg-slate-900">
      <div className="container-custom">
        {/* Desktop Navbar */}
        <div className="hidden md:flex items-center justify-between h-16 gap-8">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-foreground hover:text-primary transition-colors">
            ArtVPP
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for art, artists, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Admin Dashboard */}
            {isAdmin && (
              <Link href="/admin/dashboard">
                <Button variant="ghost" className="text-foreground hover:text-primary">
                  Admin
                </Button>
              </Link>
            )}

            {/* Sell Your Art / Dashboard */}
            {isVendor ? (
              <Link href="/vendor/dashboard">
                <Button variant="ghost" className="text-foreground hover:text-primary">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/vendor-signup">
                <Button variant="ghost" className="text-foreground hover:text-primary">
                  Sell Your Art
                </Button>
              </Link>
            )}

            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Profile/Login */}
            {user ? (
              <Link href="/profile">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  Login
                </Button>
              </Link>
            )}

            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navbar */}
        <div className="md:hidden flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-foreground">
            ArtVPP
          </Link>

          {/* Mobile Right Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowSearch(!showSearch)}>
              <Search className="h-5 w-5" />
            </Button>

            {/* Cart on Mobile */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {user ? (
              <Link href="/profile">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="icon" className="bg-primary hover:bg-primary/90 text-white">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}

            <Button variant="ghost" size="icon" onClick={() => setShowMobileMenu(!showMobileMenu)}>
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        {showSearch && (
          <div className="md:hidden pb-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </form>
          </div>
        )}

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t py-4 space-y-2">
            {isAdmin && (
              <Link href="/admin/dashboard" className="block px-4 py-2 hover:bg-accent rounded-lg link-primary">
                Admin Dashboard
              </Link>
            )}
            {isVendor ? (
              <Link href="/vendor/dashboard" className="block px-4 py-2 hover:bg-accent rounded-lg link-primary">
                Vendor Dashboard
              </Link>
            ) : (
              <Link href="/vendor-signup" className="block px-4 py-2 hover:bg-accent rounded-lg link-primary">
                Sell Your Art
              </Link>
            )}
            <Link href="/products" className="block px-4 py-2 hover:bg-accent rounded-lg link-primary">
              Browse Art
            </Link>
            <Link href="/categories" className="block px-4 py-2 hover:bg-accent rounded-lg link-primary">
              Art Categories
            </Link>
            <Link href="/artists" className="block px-4 py-2 hover:bg-accent rounded-lg link-primary">
              Artists
            </Link>
            <Link href="/about" className="block px-4 py-2 hover:bg-accent rounded-lg link-primary">
              About
            </Link>
            <Link href="/contact" className="block px-4 py-2 hover:bg-accent rounded-lg link-primary">
              Contact for Sellers
            </Link>
            <button
              onClick={toggleTheme}
              className="w-full text-left px-4 py-2 hover:bg-accent rounded-lg link-primary"
            >
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
