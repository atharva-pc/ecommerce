"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import AdminVendorTable from "@/components/AdminVendorTable";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<any[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    checkAccess();
    fetchDemoMode();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", user.id)
        .single();

      if (!profile?.role || profile.role !== "admin") {
        router.push("/");
        return;
      }

      await fetchVendors();
    } catch (error) {
      console.error("Error checking access:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, vendor_status")
      .eq("vendor_status", "pending")
      .eq("role", "vendor");

    if (error) {
      console.error("Error fetching vendors:", error);
    } else {
      setVendors(data || []);
    }
  };

  const fetchDemoMode = async () => {
    try {
      const response = await fetch("/api/admin/demo-mode");
      const result = await response.json();
      if (result.success) {
        setDemoMode(result.demoMode);
      }
    } catch (error) {
      console.error("Error fetching demo mode:", error);
    }
  };

  const toggleDemoMode = async () => {
    try {
      const newMode = !demoMode;
      const response = await fetch("/api/admin/demo-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newMode }),
      });

      const result = await response.json();
      if (result.success) {
        setDemoMode(newMode);
        showToast(`Demo mode ${newMode ? 'enabled' : 'disabled'}`, "success");
      }
    } catch (error) {
      console.error("Error toggling demo mode:", error);
      showToast("Failed to toggle demo mode", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Admin control</p>
          <h1 className="text-3xl font-semibold">Vendor review dashboard</h1>
          <p className="text-sm text-slate-400">
            Only staff with the <span className="font-bold">admin</span> role can access this page.
          </p>
        </header>

        {/* Demo Mode Toggle */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Demo Mode</h3>
              <p className="text-sm text-slate-400 mt-1">
                Enable demo mode to show instant checkout flow with demo payment button
              </p>
            </div>
            <Button
              onClick={toggleDemoMode}
              className={`${
                demoMode
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-slate-700 hover:bg-slate-600"
              } text-white`}
            >
              {demoMode ? "✓ Enabled" : "Disabled"}
            </Button>
          </div>
          {demoMode && (
            <div className="mt-4 p-3 bg-green-950/30 border border-green-800 rounded-lg">
              <p className="text-sm text-green-400">
                🎬 Demo mode active! Checkout page will show "Complete Demo Payment" button.
              </p>
            </div>
          )}
        </div>

        <AdminVendorTable vendors={vendors} />
      </main>
    </div>
  );
}
