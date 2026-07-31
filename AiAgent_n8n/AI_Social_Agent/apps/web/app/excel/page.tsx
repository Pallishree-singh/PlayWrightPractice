import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, type ContentEntry } from "@/lib/api";

export default async function ExcelPage() {
  const result = await apiFetch<{ data: ContentEntry[] }>("/content/history");

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Excel Archive Monitor</h2>
      <Card>
        <CardHeader>
          <CardTitle>Latest Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Category</th>
                  <th className="px-2 py-2">Topic</th>
                  <th className="px-2 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-2 py-2">{new Date(item.date).toLocaleDateString()}</td>
                    <td className="px-2 py-2">{item.category}</td>
                    <td className="px-2 py-2">{item.topic}</td>
                    <td className="px-2 py-2">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
