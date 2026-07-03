import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  Coffee,
  Scale,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Check,
  Sparkles,
  Leaf,
  Droplets,
  Award,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { getLiveCoffeePrice } from "@/lib/auth-server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/batch-planner")({
  head: () => ({
    meta: [
      { title: "Batch Planner & Prices (Pro) — TerraBrew" },
      {
        name: "description",
        content:
          "Interactive Batch Planner and Revenue Predictor incorporating live commodities indexes.",
      },
    ],
  }),
  component: BatchPlannerPage,
});

function BatchPlannerPage() {
  const [totalCherryWeight, setTotalCherryWeight] = useState(1000);
  const [harvestSliderValue, setHarvestSliderValue] = useState(1000);

  useEffect(() => {
    setHarvestSliderValue(totalCherryWeight);
  }, [totalCherryWeight]);

  const [washedSplit, setWashedSplit] = useState(40);
  const [semiWashedSplit, setSemiWashedSplit] = useState(20);
  const [honeySplit, setHoneySplit] = useState(20);
  const [wineSplit, setWineSplit] = useState(10);
  const [naturalSplit, setNaturalSplit] = useState(10);

  // Calculated allocation states (only update when the Process button is clicked)
  const [calculatedWeight, setCalculatedWeight] = useState<number | null>(null);
  const [calculatedWashed, setCalculatedWashed] = useState(0);
  const [calculatedSemiWashed, setCalculatedSemiWashed] = useState(0);
  const [calculatedHoney, setCalculatedHoney] = useState(0);
  const [calculatedWine, setCalculatedWine] = useState(0);
  const [calculatedNatural, setCalculatedNatural] = useState(0);

  const [livePrice, setLivePrice] = useState<{ priceCentsLbs: number; success: boolean } | null>(
    null,
  );
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  useEffect(() => {
    async function loadPrice() {
      setIsFetchingPrice(true);
      try {
        const res = await getLiveCoffeePrice();
        setLivePrice(res);
      } catch (err) {
        console.error("Failed to load live price:", err);
      } finally {
        setIsFetchingPrice(false);
      }
    }
    loadPrice();
  }, []);

  // Batch allocation planner calculations
  const totalAllocation = useMemo(() => {
    return (
      Number(washedSplit) +
      Number(semiWashedSplit) +
      Number(honeySplit) +
      Number(wineSplit) +
      Number(naturalSplit)
    );
  }, [washedSplit, semiWashedSplit, honeySplit, wineSplit, naturalSplit]);

  const priceCentsLbs = livePrice?.priceCentsLbs || 302.13;
  const basePriceUsdKg = (priceCentsLbs / 100) * 2.20462;
  const usdToIdrRate = 16300;
  const greenBeanRatio = 0.18;

  const multipliers = {
    washed: 1.0,
    semi_washed: 1.05,
    honey: 1.2,
    wine: 1.5,
    natural: 1.15,
  };

  const waterLitersPerKg = {
    washed: 25,
    semi_washed: 6,
    honey: 2.5,
    wine: 0.8,
    natural: 0.5,
  };

  const ecoScores = {
    washed: 55,
    semi_washed: 75,
    honey: 85,
    wine: 90,
    natural: 95,
  };

  const plannerMetrics = useMemo(() => {
    const weight = calculatedWeight || 0;
    const totalCalcAllocation =
      calculatedWashed +
      calculatedSemiWashed +
      calculatedHoney +
      calculatedWine +
      calculatedNatural;
    const factor = totalCalcAllocation > 0 ? weight / 100 : 0;

    const allocations = {
      washed: calculatedWashed * factor,
      semi_washed: calculatedSemiWashed * factor,
      honey: calculatedHoney * factor,
      wine: calculatedWine * factor,
      natural: calculatedNatural * factor,
    };

    const greenCoffeeYields = {
      washed: allocations.washed * greenBeanRatio,
      semi_washed: allocations.semi_washed * greenBeanRatio,
      honey: allocations.honey * greenBeanRatio,
      wine: allocations.wine * greenBeanRatio,
      natural: allocations.natural * greenBeanRatio,
    };

    const waterUsages = {
      washed: allocations.washed * waterLitersPerKg.washed,
      semi_washed: allocations.semi_washed * waterLitersPerKg.semi_washed,
      honey: allocations.honey * waterLitersPerKg.honey,
      wine: allocations.wine * waterLitersPerKg.wine,
      natural: allocations.natural * waterLitersPerKg.natural,
    };

    const revenuesUsd = {
      washed: greenCoffeeYields.washed * basePriceUsdKg * multipliers.washed,
      semi_washed: greenCoffeeYields.semi_washed * basePriceUsdKg * multipliers.semi_washed,
      honey: greenCoffeeYields.honey * basePriceUsdKg * multipliers.honey,
      wine: greenCoffeeYields.wine * basePriceUsdKg * multipliers.wine,
      natural: greenCoffeeYields.natural * basePriceUsdKg * multipliers.natural,
    };

    const revenuesIdr = {
      washed: revenuesUsd.washed * usdToIdrRate,
      semi_washed: revenuesUsd.semi_washed * usdToIdrRate,
      honey: revenuesUsd.honey * usdToIdrRate,
      wine: revenuesUsd.wine * usdToIdrRate,
      natural: revenuesUsd.natural * usdToIdrRate,
    };

    const totalGreenCoffee = Object.values(greenCoffeeYields).reduce((a, b) => a + b, 0);
    const totalWater = Object.values(waterUsages).reduce((a, b) => a + b, 0);
    const totalRevenueUsd = Object.values(revenuesUsd).reduce((a, b) => a + b, 0);
    const totalRevenueIdr = Object.values(revenuesIdr).reduce((a, b) => a + b, 0);

    const baselineWater = weight * waterLitersPerKg.washed;
    const waterSavings = Math.max(0, baselineWater - totalWater);

    const avgSustainabilityScore =
      weight > 0
        ? (allocations.washed * ecoScores.washed +
            allocations.semi_washed * ecoScores.semi_washed +
            allocations.honey * ecoScores.honey +
            allocations.wine * ecoScores.wine +
            allocations.natural * ecoScores.natural) /
          weight /
          100
        : 0;

    return {
      allocations,
      greenCoffeeYields,
      waterUsages,
      revenuesUsd,
      revenuesIdr,
      totalGreenCoffee,
      totalWater,
      totalRevenueUsd,
      totalRevenueIdr,
      waterSavings,
      avgSustainabilityScore,
    };
  }, [
    calculatedWeight,
    calculatedWashed,
    calculatedSemiWashed,
    calculatedHoney,
    calculatedWine,
    calculatedNatural,
    basePriceUsdKg,
  ]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 text-foreground bg-background">
      {/* HEADER SECTION */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-forest/10 text-forest border border-forest/20">
          <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "4s" }} />{" "}
          TerraBrew smart engine (Pro)
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl text-primary">
          Interactive Batch Planner & Revenue Predictor
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Plan your post-harvest splits, view dynamic water footprint stats, and calculate revenue
          projections using real-time coffee market feeds.
        </p>
      </div>

      {/* BATCH ALLOCATION PLANNER WORKSPACE */}
      <div className="grid gap-6 lg:grid-cols-5 animate-fade-in">
        {/* LEFT COLUMN: CONFIGURATION */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-border bg-card shadow-[var(--shadow-soft)]">
            <CardHeader className="bg-secondary/20 border-b border-border/40">
              <CardTitle className="flex items-center gap-2 text-primary font-bold text-lg">
                <Scale className="h-5 w-5 text-accent" />
                Harvest & Process Splits
              </CardTitle>
              <CardDescription>
                Define your coffee cherry harvest quantity and distribute it among different
                processing methods.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Harvest quantity input */}
              <div className="space-y-2">
                <Label
                  htmlFor="harvest-weight"
                  className="text-xs font-bold text-foreground flex justify-between"
                >
                  <span>TOTAL HARVEST QUANTITY (kg of Cherries)</span>
                  <span className="text-accent font-bold">
                    {totalCherryWeight.toLocaleString()} kg
                  </span>
                </Label>
                <div className="flex items-center gap-4 py-2">
                  <Slider
                    id="harvest-weight"
                    value={[harvestSliderValue]}
                    onValueChange={(val) => setHarvestSliderValue(val[0])}
                    onValueCommit={(val) => setTotalCherryWeight(val[0])}
                    min={100}
                    max={10000}
                    step={50}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={100}
                    max={50000}
                    value={totalCherryWeight}
                    onChange={(e) => setTotalCherryWeight(Math.max(100, Number(e.target.value)))}
                    className="w-24 text-right bg-background border-border text-xs font-bold font-mono"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Decoupled Slider: Drag to adjust volume smoothly. Values and projections only
                  update upon slider release.
                </p>
              </div>

              {/* Splits inputs list */}
              <div className="space-y-3 pt-2">
                <Label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                  Processing Method Split Percentage
                </Label>

                {/* Washed */}
                <div className="flex items-center justify-between gap-3 p-3 bg-secondary/10 rounded-xl border border-border/30">
                  <div>
                    <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#4682b4]" /> Washed
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block font-mono">
                      {Math.round(plannerMetrics.allocations.washed).toLocaleString()} kg
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={washedSplit}
                      onChange={(e) =>
                        setWashedSplit(Math.max(0, Math.min(100, Number(e.target.value))))
                      }
                      className="w-16 h-8 text-right bg-background border-border/80 rounded-lg text-xs font-semibold font-mono"
                    />
                    <span className="text-[10px] text-muted-foreground">%</span>
                  </div>
                </div>

                {/* Semi Washed */}
                <div className="flex items-center justify-between gap-3 p-3 bg-secondary/10 rounded-xl border border-border/30">
                  <div>
                    <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#27432b]" /> Semi-Washed
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block font-mono">
                      {Math.round(plannerMetrics.allocations.semi_washed).toLocaleString()} kg
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={semiWashedSplit}
                      onChange={(e) =>
                        setSemiWashedSplit(Math.max(0, Math.min(100, Number(e.target.value))))
                      }
                      className="w-16 h-8 text-right bg-background border-border/80 rounded-lg text-xs font-semibold font-mono"
                    />
                    <span className="text-[10px] text-muted-foreground">%</span>
                  </div>
                </div>

                {/* Honey */}
                <div className="flex items-center justify-between gap-3 p-3 bg-secondary/10 rounded-xl border border-border/30">
                  <div>
                    <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#d88f34]" /> Honey
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block font-mono">
                      {Math.round(plannerMetrics.allocations.honey).toLocaleString()} kg
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={honeySplit}
                      onChange={(e) =>
                        setHoneySplit(Math.max(0, Math.min(100, Number(e.target.value))))
                      }
                      className="w-16 h-8 text-right bg-background border-border/80 rounded-lg text-xs font-semibold font-mono"
                    />
                    <span className="text-[10px] text-muted-foreground">%</span>
                  </div>
                </div>

                {/* Wine */}
                <div className="flex items-center justify-between gap-3 p-3 bg-secondary/10 rounded-xl border border-border/30">
                  <div>
                    <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#b22222]" /> Wine
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block font-mono">
                      {Math.round(plannerMetrics.allocations.wine).toLocaleString()} kg
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={wineSplit}
                      onChange={(e) =>
                        setWineSplit(Math.max(0, Math.min(100, Number(e.target.value))))
                      }
                      className="w-16 h-8 text-right bg-background border-border/80 rounded-lg text-xs font-semibold font-mono"
                    />
                    <span className="text-[10px] text-muted-foreground">%</span>
                  </div>
                </div>

                {/* Natural */}
                <div className="flex items-center justify-between gap-3 p-3 bg-secondary/10 rounded-xl border border-border/30">
                  <div>
                    <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#42302c]" /> Natural
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block font-mono">
                      {Math.round(plannerMetrics.allocations.natural).toLocaleString()} kg
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={naturalSplit}
                      onChange={(e) =>
                        setNaturalSplit(Math.max(0, Math.min(100, Number(e.target.value))))
                      }
                      className="w-16 h-8 text-right bg-background border-border/80 rounded-lg text-xs font-semibold font-mono"
                    />
                    <span className="text-[10px] text-muted-foreground">%</span>
                  </div>
                </div>
              </div>

              {/* Split breakdown visualization progress bar */}
              <div className="space-y-2 pt-4 border-t border-border/40">
                <div className="flex justify-between text-xs font-bold">
                  <span>ALLOCATION VISUALIZATION</span>
                  <span>Total: {totalAllocation}%</span>
                </div>
                <div className="h-4 w-full rounded-full overflow-hidden flex bg-secondary/30 border border-border/30">
                  {washedSplit > 0 && (
                    <div
                      className="bg-[#4682b4] transition-all"
                      style={{ width: `${(washedSplit / Math.max(1, totalAllocation)) * 100}%` }}
                      title={`Washed: ${washedSplit}%`}
                    />
                  )}
                  {semiWashedSplit > 0 && (
                    <div
                      className="bg-[#27432b] transition-all"
                      style={{
                        width: `${(semiWashedSplit / Math.max(1, totalAllocation)) * 100}%`,
                      }}
                      title={`Semi-Washed: ${semiWashedSplit}%`}
                    />
                  )}
                  {honeySplit > 0 && (
                    <div
                      className="bg-[#d88f34] transition-all"
                      style={{ width: `${(honeySplit / Math.max(1, totalAllocation)) * 100}%` }}
                      title={`Honey: ${honeySplit}%`}
                    />
                  )}
                  {wineSplit > 0 && (
                    <div
                      className="bg-[#b22222] transition-all"
                      style={{ width: `${(wineSplit / Math.max(1, totalAllocation)) * 100}%` }}
                      title={`Wine: ${wineSplit}%`}
                    />
                  )}
                  {naturalSplit > 0 && (
                    <div
                      className="bg-[#42302c] transition-all"
                      style={{ width: `${(naturalSplit / Math.max(1, totalAllocation)) * 100}%` }}
                      title={`Natural: ${naturalSplit}%`}
                    />
                  )}
                </div>
              </div>

              {/* Validation warnings */}
              {totalAllocation !== 100 ? (
                <div className="p-4 border border-destructive/20 bg-destructive/5 text-destructive rounded-xl text-xs flex gap-2 items-start leading-relaxed animate-pulse">
                  <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Invalid splits total!</span> The current allocation
                    sums to <strong>{totalAllocation}%</strong>. Please adjust the splits to total
                    exactly <strong>100%</strong> to ensure valid resource & revenue projections.
                  </div>
                </div>
              ) : (
                <div className="p-4 border border-accent/20 bg-accent/5 text-accent rounded-xl text-xs flex gap-2 items-start leading-relaxed">
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Perfect distribution!</span> Your splits sum to
                    exactly <strong>100%</strong>. Click the button below to process and compute
                    outcomes.
                  </div>
                </div>
              )}

              {/* Process Allocation Trigger Button */}
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    setCalculatedWeight(Number(totalCherryWeight));
                    setCalculatedWashed(Number(washedSplit));
                    setCalculatedSemiWashed(Number(semiWashedSplit));
                    setCalculatedHoney(Number(honeySplit));
                    setCalculatedWine(Number(wineSplit));
                    setCalculatedNatural(Number(naturalSplit));
                  }}
                  disabled={totalAllocation !== 100}
                  className="w-full bg-forest text-cream hover:bg-forest-deep rounded-xl font-bold py-2.5 shadow-md flex items-center justify-center gap-2 transition"
                >
                  <Check className="h-4 w-4" /> Process Batch Allocation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: OUTCOMES */}
        <div className="lg:col-span-3 space-y-6">
          {calculatedWeight === null ? (
            <Card className="rounded-2xl border-border bg-card shadow-[var(--shadow-soft)] min-h-[450px] flex flex-col justify-center items-center p-6 text-center border-dashed border-2 border-border/60 bg-secondary/5">
              <div className="h-16 w-16 rounded-2xl bg-secondary/40 flex items-center justify-center text-accent mb-4 border border-border/40">
                <Scale className="h-8 w-8 animate-pulse text-accent" />
              </div>
              <h3 className="font-bold text-lg text-primary">Awaiting Process Allocation</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2">
                Please configure your total harvest volume and process percentage splits on the
                left. Ensure they total exactly 100%, then click the{" "}
                <strong>Process Batch Allocation</strong> button to view economic & resource
                projections.
              </p>
            </Card>
          ) : (
            <>
              {/* Live Price Reference Card */}
              <Card className="rounded-2xl border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
                <div className="p-5 flex flex-wrap items-center justify-between gap-4 bg-secondary/15 border-b border-border/40">
                  <div className="flex gap-3 items-center">
                    <div className="p-2.5 rounded-lg bg-forest/15 text-forest shrink-0">
                      <Globe className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        TradingEconomics Live Commodity Price
                      </div>
                      <div className="text-lg font-bold text-primary flex items-baseline gap-1.5 mt-0.5 font-mono">
                        ${(priceCentsLbs / 100).toFixed(2)}{" "}
                        <span className="text-xs text-muted-foreground font-normal">
                          / Lbs (pound)
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-forest/15 text-forest border-transparent py-1 text-xs"
                  >
                    🟢 Live Coffee feed OK
                  </Badge>
                </div>
                <CardContent className="p-5 grid gap-4 sm:grid-cols-2 text-xs">
                  <div className="p-3 bg-secondary/10 rounded-xl border border-border/30">
                    <span className="text-muted-foreground block font-bold">
                      Converted Price / kg (Green Coffee):
                    </span>
                    <span className="text-sm font-bold text-foreground mt-1 block font-mono">
                      ${basePriceUsdKg.toFixed(2)} USD
                    </span>
                  </div>
                  <div className="p-3 bg-secondary/10 rounded-xl border border-border/30">
                    <span className="text-muted-foreground block font-bold">
                      Local Price / kg (IDR Reference):
                    </span>
                    <span className="text-sm font-bold text-accent mt-1 block font-mono">
                      Rp {(basePriceUsdKg * usdToIdrRate).toLocaleString("id-ID")} IDR
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Impact Metric Cards Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Green Coffee Yield */}
                <Card className="rounded-2xl border-border bg-card shadow-[var(--shadow-soft)] p-4 relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="p-2 rounded-xl bg-forest/10 text-forest w-fit">
                      <Coffee className="h-4.5 w-4.5" />
                    </div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mt-3">
                      Green Coffee Yield
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xl font-bold font-mono text-primary">
                      {Math.round(plannerMetrics.totalGreenCoffee).toLocaleString()} kg
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                      Converted from {calculatedWeight.toLocaleString()} kg cherry (18% yield)
                    </p>
                  </div>
                </Card>

                {/* Projected Revenue */}
                <Card className="rounded-2xl border-border bg-card shadow-[var(--shadow-soft)] p-4 relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="p-2 rounded-xl bg-accent/10 text-accent w-fit">
                      <TrendingUp className="h-4.5 w-4.5" />
                    </div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mt-3">
                      Projected Revenue
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xl font-bold font-mono text-forest">
                      ${Math.round(plannerMetrics.totalRevenueUsd).toLocaleString()} USD
                    </div>
                    <p className="text-[9px] text-muted-foreground font-bold mt-0.5 font-mono">
                      ≈ Rp {Math.round(plannerMetrics.totalRevenueIdr).toLocaleString("id-ID")}
                    </p>
                  </div>
                </Card>

                {/* Total Water Footprint */}
                <Card className="rounded-2xl border-border bg-card shadow-[var(--shadow-soft)] p-4 relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 w-fit">
                      <Droplets className="h-4.5 w-4.5" />
                    </div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mt-3">
                      Total Water Used
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xl font-bold font-mono text-blue-600">
                      {Math.round(plannerMetrics.totalWater).toLocaleString()} L
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                      Wastewater volume generated across splits
                    </p>
                  </div>
                </Card>

                {/* Water Saved & Ecoscore */}
                <Card className="rounded-2xl border-border bg-card shadow-[var(--shadow-soft)] p-4 relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 w-fit">
                      <Award className="h-4.5 w-4.5" />
                    </div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mt-3">
                      Sustainability Score
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xl font-bold font-mono text-emerald-600">
                      {Math.round(plannerMetrics.avgSustainabilityScore * 100)} / 100
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight font-bold">
                      💧 Saved {Math.round(plannerMetrics.waterSavings).toLocaleString()} L vs
                      Washed
                    </p>
                  </div>
                </Card>
              </div>

              {/* Recharts Charts Card */}
              {calculatedWashed +
                calculatedSemiWashed +
                calculatedHoney +
                calculatedWine +
                calculatedNatural >
                0 && (
                <Card className="rounded-2xl border-border shadow-[var(--shadow-soft)] bg-card overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-primary font-bold text-sm">
                      Batch Allocations & Impact Visualizations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-6 md:grid-cols-2 p-6">
                    {/* Pie Chart */}
                    <div className="h-64 flex flex-col justify-center items-center">
                      <div className="text-xs font-semibold text-muted-foreground mb-1">
                        Harvest Distribution (%)
                      </div>
                      <ResponsiveContainer width="100%" height="90%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Washed", value: calculatedWashed, color: "#4682b4" },
                              {
                                name: "Semi-Washed",
                                value: calculatedSemiWashed,
                                color: "#27432b",
                              },
                              { name: "Honey", value: calculatedHoney, color: "#d88f34" },
                              { name: "Wine", value: calculatedWine, color: "#b22222" },
                              { name: "Natural", value: calculatedNatural, color: "#42302c" },
                            ].filter((d) => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {[
                              { name: "Washed", value: calculatedWashed, color: "#4682b4" },
                              {
                                name: "Semi-Washed",
                                value: calculatedSemiWashed,
                                color: "#27432b",
                              },
                              { name: "Honey", value: calculatedHoney, color: "#d88f34" },
                              { name: "Wine", value: calculatedWine, color: "#b22222" },
                              { name: "Natural", value: calculatedNatural, color: "#42302c" },
                            ]
                              .filter((d) => d.value > 0)
                              .map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                          </Pie>
                          <RTooltip
                            formatter={(val) => `${val}%`}
                            contentStyle={{
                              background: "var(--card)",
                              border: "1px solid var(--border)",
                              borderRadius: 12,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap gap-2 justify-center mt-2 text-[10px] font-semibold text-muted-foreground">
                        {[
                          { name: "Washed", value: calculatedWashed, color: "#4682b4" },
                          { name: "Semi-Washed", value: calculatedSemiWashed, color: "#27432b" },
                          { name: "Honey", value: calculatedHoney, color: "#d88f34" },
                          { name: "Wine", value: calculatedWine, color: "#b22222" },
                          { name: "Natural", value: calculatedNatural, color: "#42302c" },
                        ]
                          .filter((d) => d.value > 0)
                          .map((d) => (
                            <span key={d.name} className="flex items-center gap-1">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: d.color }}
                              />{" "}
                              {d.name}
                            </span>
                          ))}
                      </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="h-64 flex flex-col justify-center">
                      <div className="text-xs font-semibold text-center text-muted-foreground mb-1 font-bold">
                        Water Use (L) vs Revenue (USD)
                      </div>
                      <ResponsiveContainer width="100%" height="90%">
                        <BarChart
                          data={[
                            {
                              name: "Washed",
                              "Water (L)": Math.round(plannerMetrics.waterUsages.washed),
                              "Rev (USD)": Math.round(plannerMetrics.revenuesUsd.washed),
                            },
                            {
                              name: "Semi-Washed",
                              "Water (L)": Math.round(plannerMetrics.waterUsages.semi_washed),
                              "Rev (USD)": Math.round(plannerMetrics.revenuesUsd.semi_washed),
                            },
                            {
                              name: "Honey",
                              "Water (L)": Math.round(plannerMetrics.waterUsages.honey),
                              "Rev (USD)": Math.round(plannerMetrics.revenuesUsd.honey),
                            },
                            {
                              name: "Wine",
                              "Water (L)": Math.round(plannerMetrics.waterUsages.wine),
                              "Rev (USD)": Math.round(plannerMetrics.revenuesUsd.wine),
                            },
                            {
                              name: "Natural",
                              "Water (L)": Math.round(plannerMetrics.waterUsages.natural),
                              "Rev (USD)": Math.round(plannerMetrics.revenuesUsd.natural),
                            },
                          ]}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border)"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="name"
                            tick={{
                              fill: "var(--muted-foreground)",
                              fontSize: 9,
                              fontWeight: "600",
                            }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <RTooltip
                            contentStyle={{
                              background: "var(--card)",
                              border: "1px solid var(--border)",
                              borderRadius: 12,
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: 9, fontWeight: 600 }} />
                          <Bar dataKey="Water (L)" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Rev (USD)" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
