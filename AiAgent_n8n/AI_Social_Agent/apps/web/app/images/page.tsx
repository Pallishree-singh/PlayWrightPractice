import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, type ContentEntry } from "@/lib/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "http://localhost:4000";

export default async function ImagesPage() {
  const result = await apiFetch<{ data: ContentEntry[] }>("/content/history");
  const withImages = result.data.filter((item) => item.imagePath);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Generated Images</h2>
      <div className="dashboard-grid">
        {withImages.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="text-base">{item.topic}</CardTitle>
            </CardHeader>
            <CardContent>
              <Image
                src={`${BASE_URL}${item.imagePath}`}
                alt={item.topic}
                width={1200}
                height={675}
                className="h-auto w-full rounded-xl object-cover"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
