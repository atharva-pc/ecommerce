"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function DebugCommissionsPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const supabase = createClient();

  useEffect(() => {
    const debug = async () => {
      const info: any = {};

      // Check user
      const { data: { user } } = await supabase.auth.getUser();
      info.user = user ? { id: user.id, email: user.email } : null;

      if (user) {
        // Check profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, vendor_status")
          .eq("id", user.id)
          .single();
        info.profile = profile;

        // Check commissions
        const { data: commissions, error } = await supabase
          .from("commission_requests")
          .select("*")
          .eq("vendor_id", user.id);

        info.commissions = commissions;
        info.commissionsError = error;
        info.commissionCount = commissions?.length || 0;

        // Test API
        try {
          const apiResponse = await fetch("/api/vendor/commissions");
          info.apiResponse = await apiResponse.json();
        } catch (e) {
          info.apiError = String(e);
        }
      }

      setDebugInfo(info);
    };

    debug();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-8">
      <h1 className="text-3xl font-bold mb-8">🔍 Commission Debug Info</h1>

      <div className="space-y-4">
        <div className="bg-gray-100 dark:bg-slate-900 p-4 rounded-lg">
          <h2 className="font-bold mb-2">Current User:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(debugInfo.user, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 dark:bg-slate-900 p-4 rounded-lg">
          <h2 className="font-bold mb-2">Profile:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(debugInfo.profile, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 dark:bg-slate-900 p-4 rounded-lg">
          <h2 className="font-bold mb-2">Direct DB Query (commission_requests):</h2>
          <p className="mb-2">Count: {debugInfo.commissionCount}</p>
          <pre className="text-sm overflow-auto max-h-64">
            {JSON.stringify(debugInfo.commissions, null, 2)}
          </pre>
          {debugInfo.commissionsError && (
            <div className="text-red-500 mt-2">
              Error: {JSON.stringify(debugInfo.commissionsError)}
            </div>
          )}
        </div>

        <div className="bg-gray-100 dark:bg-slate-900 p-4 rounded-lg">
          <h2 className="font-bold mb-2">API Response (/api/vendor/commissions):</h2>
          <pre className="text-sm overflow-auto max-h-64">
            {JSON.stringify(debugInfo.apiResponse, null, 2)}
          </pre>
          {debugInfo.apiError && (
            <div className="text-red-500 mt-2">
              Error: {debugInfo.apiError}
            </div>
          )}
        </div>

        <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-300">
          <h2 className="font-bold mb-2">✅ What Should Happen:</h2>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>User should be logged in</li>
            <li>Profile role = "vendor", vendor_status = "approved"</li>
            <li>Direct DB query should return commission(s)</li>
            <li>API response should return commission(s)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
