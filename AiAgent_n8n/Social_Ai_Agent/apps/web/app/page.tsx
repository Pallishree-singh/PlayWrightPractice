import Image from "next/image";
import { TriggerButton } from "@/components/dashboard/trigger-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, type ContentEntry } from "@/lib/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "http://localhost:4000";

export default async function HomePage() {
  const result = await apiFetch<{ data: ContentEntry | null }>("/content/today");
  const entry = result.data;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Today's Content</h2>
        <TriggerButton />
      </div>

      {!entry ? (
        <Card>
          <CardContent className="py-10 text-center text-slate-600">No content generated yet for today.</CardContent>
        </Card>
      ) : (
        <div className="dashboard-grid">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>{entry.topic}</CardTitle>
              <div className="mt-2 flex gap-2">
                <Badge>{entry.category}</Badge>
                <Badge>{entry.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-[14] whitespace-pre-wrap text-sm text-slate-700">{entry.linkedinPost}</p>
              <p className="mt-4 text-xs text-slate-500">Generated: {new Date(entry.updatedAt).toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generated Image</CardTitle>
            </CardHeader>
            <CardContent>
              {entry.imagePath ? (
                <Image
                  src={`${BASE_URL}${entry.imagePath}`}
                  alt={entry.topic}
                  width={1600}
                  height={900}
                  className="h-auto w-full rounded-xl object-cover"
                />
              ) : (
                <p className="text-sm text-slate-500">No image yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
