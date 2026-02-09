"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Button } from "./ui/button";

export default function BecomeVendorBanner() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || !mounted) {
        setLoading(false);
        return;
      }

      supabase
        .from("profiles")
        .select("role, vendor_status")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (!mounted) return;

          // Show banner only for customers (not vendors) who are logged in
          const shouldShow = data?.role === "customer";
          setShow(shouldShow);
          setLoading(false);
        });
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !show) return null;

  return (
    <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-blue-900/20 p-6 shadow-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white">Become a Vendor</h3>
          <p className="mt-1 text-sm text-slate-300">
            Share your digital art with the world. Upload wallpapers, templates, and illustrations to earn.
          </p>
        </div>
        <Link href="/vendor-signup">
          <Button
            variant="secondary"
            className="whitespace-nowrap"
          >
            Apply Now
          </Button>
        </Link>
      </div>
    </div>
  );
}
