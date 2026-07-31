import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, type ContentEntry } from "@/lib/api";

export default async function PostsPage() {
  const result = await apiFetch<{ data: ContentEntry[] }>("/content/history");

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Generated Posts</h2>
      <div className="space-y-3">
        {result.data.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle>{item.topic}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
              <p className="mt-2 line-clamp-5 whitespace-pre-wrap text-sm text-slate-700">{item.linkedinPost ?? "Pending"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
