"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Database } from "lucide-react";

export default function DatabaseSetupNotice() {
  const [showNotice, setShowNotice] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    try {
      const supabase = createClient();

      // Try to query cart_items table
      const { error } = await supabase
        .from("cart_items")
        .select("id")
        .limit(1);

      if (error) {
        // Table doesn't exist
        setShowNotice(true);
      }
    } catch {
      setShowNotice(true);
    } finally {
      setChecking(false);
    }
  };

  if (checking || !showNotice) {
    return null;
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-8">
      <div className="flex items-start gap-3">
        <Database className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
            Database Setup Required
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
            Cart and Likes features require database tables to be created.
          </p>
          <div className="text-xs text-yellow-600 dark:text-yellow-400 space-y-1">
            <p><strong>Steps to set up:</strong></p>
            <ol className="list-decimal list-inside space-y-0.5 ml-2">
              <li>Open your Supabase project dashboard</li>
              <li>Go to <strong>SQL Editor</strong></li>
              <li>Copy the contents of <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">DATABASE_SCHEMA.sql</code></li>
              <li>Paste and run the SQL commands</li>
              <li>Refresh this page</li>
            </ol>
            <p className="mt-2">
              📄 See <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">QUICK_START.md</code> for detailed instructions.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowNotice(false)}
          className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
