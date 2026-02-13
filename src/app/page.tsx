"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import RosterUpload from "@/components/RosterUpload";
import { RosterOperator } from "@/lib/types";

export default function Home() {
  const router = useRouter();

  const handleRosterLoaded = useCallback(
    (roster: RosterOperator[]) => {
      sessionStorage.setItem("roster", JSON.stringify(roster));
      router.push("/dashboard");
    },
    [router]
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Import Your Roster</h2>
        <p className="text-muted text-sm">
          Upload your roster.json exported from Krooster, paste the JSON
          directly, or try the demo roster.
        </p>
      </div>

      <RosterUpload onRosterLoaded={handleRosterLoaded} />

      <div className="mt-10 bg-card border border-card-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-2">
          How to export from Krooster
        </h3>
        <ol className="text-sm text-muted space-y-1 list-decimal list-inside">
          <li>
            Go to{" "}
            <span className="text-accent">krooster.com</span> and log in
          </li>
          <li>Open Chrome DevTools (F12) → Console tab</li>
          <li>
            Paste the extraction script from{" "}
            <code className="bg-background px-1 rounded text-xs">
              scripts/krooster_extract.js
            </code>
          </li>
          <li>
            A <code className="bg-background px-1 rounded text-xs">roster.json</code>{" "}
            file will download automatically
          </li>
          <li>Upload it here</li>
        </ol>
      </div>
    </div>
  );
}
