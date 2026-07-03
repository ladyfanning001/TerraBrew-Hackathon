import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db/db";
import { recommendationHistory } from "@/db/schema";
import { desc } from "drizzle-orm";
import { History, Droplets, Thermometer, CloudRain, Leaf, Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Server function to fetch history logs from PostgreSQL
const getRecommendationHistoryFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const results = await db
      .select()
      .from(recommendationHistory)
      .orderBy(desc(recommendationHistory.createdAt))
      .limit(20);
    return results;
  } catch (e) {
    console.error("Failed to query history from PostgreSQL database:", e);
    return [];
  }
});

export const Route = createFileRoute("/dashboard/history")({
  loader: async () => {
    const historyData = await getRecommendationHistoryFn();
    return { historyData };
  },
  head: () => ({
    meta: [
      { title: "Processing History — TerraBrew" },
      {
        name: "description",
        content: "Past recommendations, environmental conditions, and chosen processing methods.",
      },
    ],
  }),
  component: HistoryPage,
});

// Map method names to standard UI color variables
const colorMap: Record<string, string> = {
  washed: "var(--chart-4)", // blue
  semi_washed: "var(--forest)", // green
  honey: "var(--honey)", // yellow
  wine: "var(--chart-5)", // red
  natural: "var(--coffee)", // brown
};

const defaultRows = [
  {
    id: 99,
    location: "Medellín, Antioquia (Colombia)",
    rainfall: 12,
    temperature: 23,
    humidity: 70,
    score: 85,
    recommendedMethod: "honey",
    createdAt: new Date("2026-05-09T08:00:00Z").toISOString(),
  },
  {
    id: 98,
    location: "Aceh Gayo (Indonesia)",
    rainfall: 48,
    temperature: 22,
    humidity: 84,
    score: 55,
    recommendedMethod: "washed",
    createdAt: new Date("2026-05-06T10:30:00Z").toISOString(),
  },
  {
    id: 97,
    location: "Kintamani, Bali",
    rainfall: 4,
    temperature: 26,
    humidity: 62,
    score: 95,
    recommendedMethod: "natural",
    createdAt: new Date("2026-05-03T15:00:00Z").toISOString(),
  },
  {
    id: 96,
    location: "Wamena, Papua",
    rainfall: 22,
    temperature: 24,
    humidity: 75,
    score: 75,
    recommendedMethod: "semi_washed",
    createdAt: new Date("2026-04-29T09:15:00Z").toISOString(),
  },
  {
    id: 95,
    location: "Nyeri Highlands (Kenya)",
    rainfall: 8,
    temperature: 25,
    humidity: 55,
    score: 90,
    recommendedMethod: "wine",
    createdAt: new Date("2026-04-25T11:00:00Z").toISOString(),
  },
];

function HistoryPage() {
  const { historyData } = Route.useLoaderData();

  // If the database has no records (e.g. fresh setup), display fallback mock historical data
  const isDemo = historyData.length === 0;
  const rows = isDemo ? defaultRows : historyData;

  const formatDate = (isoString: string | Date) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 text-foreground bg-background">
      {/* Title section */}
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          <History className="h-3 w-3 text-forest animate-pulse" /> Processing History
        </div>
        <h1 className="mt-1 text-2xl font-bold md:text-3xl text-primary font-bold">
          Your past harvests
        </h1>
        <p className="text-sm text-muted-foreground">
          A live log of TerraBrew recommendations queried directly from PostgreSQL.
        </p>
      </div>

      {/* Connection Indicator Badge */}
      <Card className="rounded-2xl border-border bg-card shadow-[var(--shadow-soft)] p-4">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex gap-2 items-center">
            <Database className="h-4 w-4 text-accent shrink-0" />
            <span className="font-semibold text-muted-foreground">
              Status:{" "}
              {isDemo ? (
                <span className="text-amber-600 font-bold">Database Empty (Showing Demo Logs)</span>
              ) : (
                <span className="text-forest font-bold">Active PostgreSQL Connection Live</span>
              )}
            </span>
          </div>
          {!isDemo && (
            <Badge
              variant="secondary"
              className="bg-forest/15 text-forest border-transparent py-0.5"
            >
              Synced: {historyData.length} records loaded
            </Badge>
          )}
        </div>
      </Card>

      {/* Recent runs table */}
      <Card className="rounded-2xl border-border shadow-[var(--shadow-soft)] overflow-hidden">
        <CardHeader>
          <CardTitle className="text-primary font-bold text-lg">Recent runs</CardTitle>
          <CardDescription>Compare conditions to learn what works on your farm.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                  <th className="py-3">Timestamp</th>
                  <th className="py-3">Location</th>
                  <th className="py-3">Method</th>
                  <th className="py-3">
                    <CloudRain className="inline h-3.5 w-3.5 mr-1" /> Rain
                  </th>
                  <th className="py-3">
                    <Thermometer className="inline h-3.5 w-3.5 mr-1" /> Temp
                  </th>
                  <th className="py-3">
                    <Droplets className="inline h-3.5 w-3.5 mr-1" /> Humidity
                  </th>
                  <th className="py-3">
                    <Leaf className="inline h-3.5 w-3.5 mr-1" /> Match Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const methodColor = colorMap[r.recommendedMethod] || "var(--muted)";
                  const formattedMethodName = r.recommendedMethod
                    .replace("_", " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase());

                  return (
                    <tr
                      key={r.id}
                      className="border-t border-border/60 hover:bg-secondary/10 transition-colors"
                    >
                      <td className="py-4 font-semibold text-muted-foreground text-xs">
                        {formatDate(r.createdAt)}
                      </td>
                      <td
                        className="py-4 font-bold text-foreground max-w-[200px] truncate"
                        title={r.location}
                      >
                        {r.location}
                      </td>
                      <td className="py-4">
                        <span className="inline-flex items-center gap-2 font-semibold text-xs">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: methodColor }}
                          />
                          {formattedMethodName}
                        </span>
                      </td>
                      <td className="py-4 text-muted-foreground">{r.rainfall} mm</td>
                      <td className="py-4 text-muted-foreground">{r.temperature}°C</td>
                      <td className="py-4 text-muted-foreground">{r.humidity}%</td>
                      <td className="py-4">
                        <Badge className="rounded-full bg-forest/15 text-forest border-transparent hover:bg-forest/15">
                          {r.score}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Season timeline */}
      <Card className="rounded-2xl border-border shadow-[var(--shadow-soft)]">
        <CardHeader>
          <CardTitle className="text-primary font-bold text-lg">Season timeline</CardTitle>
          <CardDescription>How your processing choices evolved with the climate.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="relative ml-3 space-y-6 border-l border-border pl-6">
            {rows.map((r) => {
              const methodColor = colorMap[r.recommendedMethod] || "var(--muted)";
              const formattedMethodName = r.recommendedMethod
                .replace("_", " ")
                .replace(/\b\w/g, (c) => c.toUpperCase());

              return (
                <li key={r.id} className="relative">
                  <span
                    className="absolute -left-[1.85rem] top-1.5 h-3.5 w-3.5 rounded-full ring-4 ring-background"
                    style={{ backgroundColor: methodColor }}
                  />
                  <div className="text-[10px] text-muted-foreground font-semibold">
                    {formatDate(r.createdAt)}
                  </div>
                  <div className="font-bold text-foreground mt-0.5 text-xs">
                    {formattedMethodName} Process @{" "}
                    <span className="text-accent">{r.location}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {r.rainfall} mm rain · {r.temperature}°C · {r.humidity}% humidity · Match Score{" "}
                    {r.score}%
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
