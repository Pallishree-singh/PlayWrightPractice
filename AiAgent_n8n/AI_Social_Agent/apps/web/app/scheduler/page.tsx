import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";

type SchedulerStatus = {
  enabled: boolean;
  cron: string;
  timezone: string;
  lastRunAt: string | null;
};

export default async function SchedulerPage() {
  const result = await apiFetch<{ data: SchedulerStatus }>("/scheduler/status");

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Scheduler Monitor</h2>
      <Card>
        <CardHeader>
          <CardTitle>Cron Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Enabled: {result.data.enabled ? "Yes" : "No"}</p>
          <p>Cron: {result.data.cron}</p>
          <p>Timezone: {result.data.timezone}</p>
          <p>Last Run: {result.data.lastRunAt ? new Date(result.data.lastRunAt).toLocaleString() : "Not yet"}</p>
        </CardContent>
      </Card>
    </section>
  );
}
