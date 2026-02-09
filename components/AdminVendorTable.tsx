"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export type VendorProfile = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  vendor_status: string | null;
};

type Props = {
  vendors: VendorProfile[];
};

export default function AdminVendorTable({ vendors }: Props) {
  const [localVendors, setLocalVendors] = useState(vendors);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleChangeStatus = async (id: string, status: "approved" | "rejected") => {
    setUpdatingId(id);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/vendor-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.message || "Unable to update status");
      }

      setLocalVendors((prev) => prev.filter((vendor) => vendor.id !== id));
      setMessage(`Vendor has been ${status}.`);
    } catch (error) {
      setMessage(`${error instanceof Error ? error.message : "Failed to update status"}`);
    } finally {
      setUpdatingId(null);
    }
  };

  if (!localVendors.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 text-sm text-slate-400">
        No vendors are pending review right now.
      </div>
    );
  }

  return (
    <section className="space-y-4 rounded-3xl border border-white/20 bg-white/5 p-4 shadow-xl shadow-slate-950/40">
      {message && (
        <div className="rounded-xl border border-emerald-500/70 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
          {message}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[24rem] table-fixed divide-y divide-slate-700 text-left text-sm">
          <thead>
            <tr className="text-[0.65rem] uppercase tracking-[0.4em] text-slate-400">
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {localVendors.map((vendor) => (
              <tr key={vendor.id}>
                <td className="px-3 py-4 font-semibold text-white">
                  {vendor.full_name ?? "Untitled"}
                </td>
                <td className="px-3 py-4 text-slate-300">{vendor.email}</td>
                <td className="px-3 py-4 text-slate-400">{vendor.vendor_status}</td>
                <td className="px-3 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={updatingId === vendor.id}
                      onClick={() => handleChangeStatus(vendor.id, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={updatingId === vendor.id}
                      onClick={() => handleChangeStatus(vendor.id, "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
