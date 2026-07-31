"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export function TriggerButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onClick = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const response = await fetch(`${API_URL}/content/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      if (!response.ok) {
        throw new Error("Failed to trigger generation");
      }
      setMessage("Content generation triggered successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button onClick={onClick} disabled={loading}>
        {loading ? "Generating..." : "Generate Now"}
      </Button>
      {message && <p className="text-sm text-slate-700">{message}</p>}
    </div>
  );
}
