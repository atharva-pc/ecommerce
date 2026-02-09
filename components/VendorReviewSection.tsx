"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type VendorApplication = {
  id: string;
  name: string;
  store: string;
  category: string;
  submittedAt: string;
  message: string;
};

const SAMPLE_APPLICATIONS: VendorApplication[] = [
  {
    id: "req-001",
    name: "Marina Cole",
    store: "Aurora Craft",
    category: "Digital Artist",
    submittedAt: "2026-01-21",
    message: "High-contrast wallpaper drops, Adobe textures, and layered .psd assets ready to ship.",
  },
  {
    id: "req-002",
    name: "Luca Nguyen",
    store: "Pulse Grid",
    category: "Ai Artist",
    submittedAt: "2026-01-23",
    message: "Automated artwork generated with GPT-driven palettes for futuristic devices.",
  },
  {
    id: "req-003",
    name: "Sienna Kapoor",
    store: "Nightloom",
    category: "Photographer",
    submittedAt: "2026-01-27",
    message: "Editorial monochrome textures captured on film, ready to convert to wallpapers.",
  },
];

export default function VendorReviewSection() {
  const [applications] = useState(SAMPLE_APPLICATIONS);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const progress = useMemo(() => {
    const reviewed = Object.keys(feedback).length;
    return `${reviewed}/${applications.length} reviewed`;
  }, [applications.length, feedback]);

  const updateStatus = (id: string, action: "approved" | "rejected") => {
    setFeedback((prev) => ({ ...prev, [id]: action }));
  };

  return (
    <section className="space-y-6 rounded-3xl border border-white/20 bg-white/5 p-6 shadow-xl shadow-slate-900/40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Vendor review queue</h2>
          <p className="text-sm text-slate-300">Only admins can approve or reject pending vendors.</p>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-300">
          {progress}
        </span>
      </div>
      <div className="space-y-4">
        {applications.map((application) => (
          <article
            key={application.id}
            className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/60"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-slate-500">{application.category}</p>
                <h3 className="text-xl font-semibold text-white">{application.name}</h3>
                <p className="text-sm text-slate-400">{application.store}</p>
              </div>
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Submitted {application.submittedAt}</span>
            </div>
            <p className="mt-3 text-sm text-slate-300">{application.message}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={feedback[application.id] === "approved" ? "secondary" : "ghost"}
                onClick={() => updateStatus(application.id, "approved")}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant={feedback[application.id] === "rejected" ? "destructive" : "ghost"}
                onClick={() => updateStatus(application.id, "rejected")}
              >
                Reject
              </Button>
              {feedback[application.id] && (
                <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {feedback[application.id]} by you
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
