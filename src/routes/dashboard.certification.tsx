import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { submitCertification, getFarmerCertifications } from "@/lib/auth-server";
import { CertificateModal } from "@/components/CertificateModal";
import { toast } from "sonner";
import {
  Award,
  ShieldCheck,
  Leaf,
  Flame,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Send,
  CheckCircle,
  FileText,
  Download,
  CloudSun,
  Calendar,
  HelpCircle,
  Camera,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard/certification")({
  head: () => ({
    meta: [
      { title: "Speciality Coffee Certification — TerraBrew" },
      {
        name: "description",
        content: "Apply for speciality and sustainability certification validated by SEA.",
      },
    ],
  }),
  component: CertificationPage,
});

function CertificationPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isApplying, setIsApplying] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedCert, setSelectedCert] = useState<any>(null);

  // General details
  const [farmName, setFarmName] = useState(user?.farm_name || "");
  const [coffeeVariety, setCoffeeVariety] = useState("Arabica Gayo");
  const [country, setCountry] = useState(user?.country || "Indonesia");
  const [region, setRegion] = useState(user?.region || "");

  // Environmental conditions (continuous floats)
  const [envSuhu, setEnvSuhu] = useState(25.0);
  const [envRh, setEnvRh] = useState(70.0);
  const [envCurahHujan, setEnvCurahHujan] = useState(30.0);

  // Step 1: Environmental Metrics (binary)
  const [envMetode, setEnvMetode] = useState(0); // 0=washed, 1=honey/natural/semi-washed
  const [envEnergi, setEnvEnergi] = useState(0); // 0=fosil, 1=terbarukan
  const [envPestisida, setEnvPestisida] = useState(0); // 0=kimia, 1=tidak
  const [envKonservasi, setEnvKonservasi] = useState(0); // 0=monokultur, 1=agroforestri

  // env_kesesuaian = calculated:
  // Washed (0): suitable if rainfall >= 30 and temperature is between 20-30
  // Honey/Natural (1): suitable if rainfall < 50 and humidity < 75
  const envKesesuaian =
    envMetode === 0
      ? envCurahHujan >= 30 && envSuhu >= 20 && envSuhu <= 30
        ? 1
        : 0
      : envCurahHujan < 50 && envRh < 75
        ? 1
        : 0;

  // Step 2: Economic Metrics
  const [ecoKualitas, setEcoKualitas] = useState(1); // 0=grade rendah, 1=grade 1/specialty
  const [ecoPendapatan, setEcoPendapatan] = useState(45000000); // Rp/tahun continuous
  const [ecoLuasLahan, setEcoLuasLahan] = useState(2.5); // ha continuous
  const [ecoProduksi, setEcoProduksi] = useState(1.2); // ton/ha continuous
  const [ecoKredit, setEcoKredit] = useState(1); // 0=tidak ada, 1=ada

  // Economic Normalization Min-Max constants
  const MIN_PENDAPATAN = 0;
  const MAX_PENDAPATAN = 150000000;
  const MIN_LUAS_LAHAN = 0;
  const MAX_LUAS_LAHAN = 10;
  const MIN_PRODUKSI = 0;
  const MAX_PRODUKSI = 3;

  const ecoPendapatanNorm = Math.min(
    1,
    Math.max(0, (ecoPendapatan - MIN_PENDAPATAN) / (MAX_PENDAPATAN - MIN_PENDAPATAN)),
  );
  const ecoLuasLahanNorm = Math.min(
    1,
    Math.max(0, (ecoLuasLahan - MIN_LUAS_LAHAN) / (MAX_LUAS_LAHAN - MIN_LUAS_LAHAN)),
  );
  const ecoProduksiNorm = Math.min(
    1,
    Math.max(0, (ecoProduksi - MIN_PRODUKSI) / (MAX_PRODUKSI - MIN_PRODUKSI)),
  );

  // Step 3: Social Metrics
  const [sosKelompok, setSosKelompok] = useState(1); // 0=tidak aktif, 1=aktif
  const [sosGender, setSosGender] = useState(1); // 0=tidak, 1=setara
  const [sosPendidikan, setSosPendidikan] = useState(1); // 0=SD, 1=SMA+
  const [sosHp, setSosHp] = useState(1); // 0=tidak ada, 1=ada
  const [sosInternet, setSosInternet] = useState(1); // 0=tidak ada, 1=ada (mensyaratkan sosHp=1)

  const actualSosInternet = sosHp === 0 ? 0 : sosInternet;

  // Calculations (decimal floats 0.0 - 1.0)
  const envScore = (envKesesuaian + envMetode + envEnergi + envPestisida + envKonservasi) / 5;
  const ecoScore =
    (ecoKualitas + ecoPendapatanNorm + ecoLuasLahanNorm + ecoProduksiNorm + ecoKredit) / 5;
  const sosScore = (sosKelompok + sosGender + sosPendidikan + sosHp + actualSosInternet) / 5;
  const ecoscore = (envScore + ecoScore + sosScore) / 3;

  // Fetch farmer's past certifications
  const { data: certifications, isLoading } = useQuery({
    queryKey: ["certifications", user?.id],
    queryFn: () => getFarmerCertifications({ data: { farmerId: user!.id } }),
    enabled: !!user,
  });

  // Submit certification mutation
  const submitMutation = useMutation({
    mutationFn: submitCertification,
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Certification application successfully submitted to SEA!");
        queryClient.invalidateQueries({ queryKey: ["certifications", user?.id] });
        setIsApplying(false);
        setStep(1);
      } else {
        toast.error("Failed to submit application: " + res.error);
      }
    },
    onError: (err: any) => {
      toast.error("Submission error: " + err.message);
    },
  });

  const handleNextStep = () => {
    if (step === 1) {
      if (!farmName.trim()) {
        toast.error("Farm name cannot be empty.");
        return;
      }
      if (!country.trim()) {
        toast.error("Country cannot be empty.");
        return;
      }
      if (!region.trim()) {
        toast.error("Region/Province cannot be empty.");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmitApplication = () => {
    if (!user) return;
    submitMutation.mutate({
      data: {
        farmerId: user.id,
        farmName,
        coffeeVariety,
        country,
        region,
        envSuhu,
        envRh,
        envCurahHujan,
        ecoPendapatan,
        ecoLuasLahan,
        ecoProduksi,
        envKesesuaian,
        envMetode,
        envEnergi,
        envPestisida,
        envKonservasi,
        envScore,
        ecoKualitas,
        ecoPendapatanNorm,
        ecoLuasLahanNorm,
        ecoProduksiNorm,
        ecoKredit,
        ecoScore,
        sosKelompok,
        sosGender,
        sosPendidikan,
        sosHp,
        sosInternet,
        sosScore,
        ecoscore,
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="rounded-full bg-forest/15 text-forest border-transparent">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="rounded-full bg-destructive/15 text-destructive border-transparent">
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="rounded-full bg-honey/15 text-honey border-transparent">Pending</Badge>
        );
    }
  };

  const getAwardLevel = (score: number) => {
    if (score >= 0.66)
      return { name: "High Sustainability", color: "text-[#10b981] bg-[#10b981]/15" };
    if (score >= 0.33)
      return { name: "Medium Sustainability", color: "text-[#f59e0b] bg-[#f59e0b]/15" };
    return { name: "Low Sustainability", color: "text-[#ef4444] bg-[#ef4444]/15" };
  };

  const pendingCertifications = useMemo(
    () => certifications?.filter((cert: any) => cert.status === "pending") ?? [],
    [certifications],
  );
  const approvedCertifications = useMemo(
    () => certifications?.filter((cert: any) => cert.status === "approved") ?? [],
    [certifications],
  );
  const rejectedCertifications = useMemo(
    () => certifications?.filter((cert: any) => cert.status === "rejected") ?? [],
    [certifications],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-honey font-bold">
            <Award className="h-4 w-4" /> Specialty Coffee Pro Feature
          </div>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl text-primary">
            Specialty Coffee & Sustainability Certification
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Conduct a self-audit to verify your coffee quality and sustainability metrics with SEA
            validators.
          </p>
        </div>
        {!isApplying && (
          <Button
            onClick={() => setIsApplying(true)}
            className="rounded-full bg-forest text-cream hover:bg-forest-deep px-5 shadow-sm font-bold"
          >
            <Sparkles className="mr-2 h-4 w-4" /> Start New Audit
          </Button>
        )}
      </div>

      {isApplying ? (
        /* WIZARD CARD */
        <Card
          className="rounded-3xl border-border/80 overflow-hidden bg-card"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <CardHeader className="bg-secondary/15 border-b border-border/40 p-6">
            <div className="flex justify-between items-center text-xs text-muted-foreground mb-4">
              <span className="font-bold text-forest uppercase tracking-widest">
                STEP {step} OF 4
              </span>
              <span className="font-bold">
                {step === 1
                  ? "Farm & Environment"
                  : step === 2
                    ? "Economy & Quality"
                    : step === 3
                      ? "Social Responsibility"
                      : "Review & Ecoscore"}
              </span>
            </div>
            <Progress value={(step / 4) * 100} className="h-1.5 bg-border" />
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-6">
            {/* STEP 1: General Info & Environmental Sustainability */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 pb-6 border-b border-border/40">
                  <div className="space-y-2">
                    <Label htmlFor="farm-name" className="text-sm font-bold text-foreground">
                      FARM NAME / COOPERATIVE
                    </Label>
                    <Input
                      id="farm-name"
                      placeholder="Enter your farm name"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      className="bg-secondary/20 border-border/80 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="variety" className="text-sm font-bold text-foreground">
                      MAIN COFFEE VARIETY
                    </Label>
                    <Input
                      id="variety"
                      placeholder="e.g. Arabica Gayo, Robusta Temanggung"
                      value={coffeeVariety}
                      onChange={(e) => setCoffeeVariety(e.target.value)}
                      className="bg-secondary/20 border-border/80 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-bold text-foreground">
                      COUNTRY
                    </Label>
                    <Input
                      id="country"
                      placeholder="e.g. Indonesia"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="bg-secondary/20 border-border/80 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region" className="text-sm font-bold text-foreground">
                      REGION / PROVINCE
                    </Label>
                    <Input
                      id="region"
                      placeholder="e.g. Aceh"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="bg-secondary/20 border-border/80 rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-forest" />
                    Pillar 1: Environmental Sustainability
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Measure ecological efficiency, soil conservation, water-saving processing, and
                    clean energy use.
                  </p>
                </div>{" "}
                <div className="space-y-6">
                  {/* Climate Conditions */}
                  <div className="bg-secondary/10 p-5 rounded-2xl border border-border/60 space-y-4">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Environmental Conditions (BMKG Parameters)
                    </h4>
                    <div className="grid gap-6 md:grid-cols-3">
                      {/* Temperature */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold flex justify-between">
                          <span>TEMPERATURE</span>
                          <span className="text-forest font-semibold">{envSuhu.toFixed(1)} °C</span>
                        </Label>
                        <Slider
                          value={[envSuhu]}
                          onValueChange={(v) => setEnvSuhu(v[0])}
                          min={20}
                          max={35}
                          step={0.5}
                        />
                      </div>
                      {/* Relative Humidity */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold flex justify-between">
                          <span>RELATIVE HUMIDITY</span>
                          <span className="text-forest font-semibold">{envRh.toFixed(1)} %</span>
                        </Label>
                        <Slider
                          value={[envRh]}
                          onValueChange={(v) => setEnvRh(v[0])}
                          min={40}
                          max={90}
                          step={1}
                        />
                      </div>
                      {/* Rainfall */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold flex justify-between">
                          <span>DAILY RAINFALL</span>
                          <span className="text-forest font-semibold">
                            {envCurahHujan.toFixed(1)} mm/day
                          </span>
                        </Label>
                        <Slider
                          value={[envCurahHujan]}
                          onValueChange={(v) => setEnvCurahHujan(v[0])}
                          min={0}
                          max={100}
                          step={1}
                        />
                      </div>
                    </div>
                  </div>

                  {/* env_metode */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">PROCESSING METHOD</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={envMetode === 0 ? "default" : "outline"}
                        className={`flex-1 rounded-xl h-11 font-semibold ${envMetode === 0 ? "bg-forest text-cream hover:bg-forest-deep" : "border-border/80 text-foreground"}`}
                        onClick={() => setEnvMetode(0)}
                      >
                        Washed Processing (0)
                      </Button>
                      <Button
                        type="button"
                        variant={envMetode === 1 ? "default" : "outline"}
                        className={`flex-1 rounded-xl h-11 font-semibold ${envMetode === 1 ? "bg-forest text-cream hover:bg-forest-deep" : "border-border/80 text-foreground"}`}
                        onClick={() => setEnvMetode(1)}
                      >
                        Honey / Natural / Semi-Washed (1)
                      </Button>
                    </div>
                  </div>

                  {/* env_kesesuaian */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">METHOD CLIMATE SUITABILITY</Label>
                    <div className="flex items-center gap-3 bg-secondary/15 border border-border p-3.5 rounded-xl">
                      {envKesesuaian === 1 ? (
                        <Badge className="bg-forest/15 text-forest border-transparent rounded-full px-3 py-1 font-bold">
                          SUITABLE (1)
                        </Badge>
                      ) : (
                        <Badge className="bg-destructive/15 text-destructive border-transparent rounded-full px-3 py-1 font-bold">
                          UNSUITABLE (0)
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {envMetode === 0
                          ? "Washed needs Rainfall >= 30 mm/day and Temperature 20-30°C."
                          : "Honey/Natural needs Rainfall < 50 mm/day and Humidity < 75%."}
                      </span>
                    </div>
                  </div>

                  {/* env_energi */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">ENERGY TYPE</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={envEnergi === 0 ? "default" : "outline"}
                        className={`flex-1 rounded-xl h-11 font-semibold ${envEnergi === 0 ? "bg-forest text-cream hover:bg-forest-deep" : "border-border/80 text-foreground"}`}
                        onClick={() => setEnvEnergi(0)}
                      >
                        Fossil Fuel (0)
                      </Button>
                      <Button
                        type="button"
                        variant={envEnergi === 1 ? "default" : "outline"}
                        className={`flex-1 rounded-xl h-11 font-semibold ${envEnergi === 1 ? "bg-forest text-cream hover:bg-forest-deep" : "border-border/80 text-foreground"}`}
                        onClick={() => setEnvEnergi(1)}
                      >
                        Renewable / Solar Bed (1)
                      </Button>
                    </div>
                  </div>

                  {/* env_pestisida */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">PESTICIDE USAGE</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={envPestisida === 0 ? "default" : "outline"}
                        className={`flex-1 rounded-xl h-11 font-semibold ${envPestisida === 0 ? "bg-forest text-cream hover:bg-forest-deep" : "border-border/80 text-foreground"}`}
                        onClick={() => setEnvPestisida(0)}
                      >
                        Chemical Pesticides (0)
                      </Button>
                      <Button
                        type="button"
                        variant={envPestisida === 1 ? "default" : "outline"}
                        className={`flex-1 rounded-xl h-11 font-semibold ${envPestisida === 1 ? "bg-forest text-cream hover:bg-forest-deep" : "border-border/80 text-foreground"}`}
                        onClick={() => setEnvPestisida(1)}
                      >
                        No Chemical / Organic Only (1)
                      </Button>
                    </div>
                  </div>

                  {/* env_konservasi */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">SOIL CONSERVATION</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={envKonservasi === 0 ? "default" : "outline"}
                        className={`flex-1 rounded-xl h-11 font-semibold ${envKonservasi === 0 ? "bg-forest text-cream hover:bg-forest-deep" : "border-border/80 text-foreground"}`}
                        onClick={() => setEnvKonservasi(0)}
                      >
                        Monoculture (0)
                      </Button>
                      <Button
                        type="button"
                        variant={envKonservasi === 1 ? "default" : "outline"}
                        className={`flex-1 rounded-xl h-11 font-semibold ${envKonservasi === 1 ? "bg-forest text-cream hover:bg-forest-deep" : "border-border/80 text-foreground"}`}
                        onClick={() => setEnvKonservasi(1)}
                      >
                        Agroforestry / Shade Trees (1)
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end p-4 bg-forest/5 rounded-xl border border-forest/15">
                  <div className="text-sm font-bold text-primary">
                    Sub-Total Environmental Score:{" "}
                    <span className="text-forest text-lg ml-2">{envScore.toFixed(2)} / 1.00</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Economic Viability */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                    <Flame className="h-5 w-5 text-honey" />
                    Pillar 2: Economic Viability
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Measure physical/cupping quality, premium income stability, productive land
                    area, and access to finance.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* eco_kualitas */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">COFFEE QUALITY</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={ecoKualitas === 0 ? "default" : "outline"}
                        className={`flex-1 rounded-xl h-11 font-semibold ${ecoKualitas === 0 ? "bg-honey text-primary-foreground hover:bg-honey/95" : "border-border/80 text-foreground"}`}
                        onClick={() => setEcoKualitas(0)}
                      >
                        Low Grade (0)
                      </Button>
                      <Button
                        type="button"
                        variant={ecoKualitas === 1 ? "default" : "outline"}
                        className={`flex-1 rounded-xl h-11 font-semibold ${ecoKualitas === 1 ? "bg-honey text-primary-foreground hover:bg-honey/95" : "border-border/80 text-foreground"}`}
                        onClick={() => setEcoKualitas(1)}
                      >
                        Grade 1 / Specialty (1)
                      </Button>
                    </div>
                  </div>

                  {/* eco_pendapatan */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="eco-pendapatan"
                      className="text-xs font-bold flex justify-between"
                    >
                      <span>ANNUAL HOUSEHOLD INCOME (Rp/year)</span>
                      <span className="text-honey font-bold">
                        Normalized: {ecoPendapatanNorm.toFixed(2)}
                      </span>
                    </Label>
                    <Input
                      id="eco-pendapatan"
                      type="number"
                      min={0}
                      max={150000000}
                      placeholder="e.g. 45000000"
                      value={ecoPendapatan}
                      onChange={(e) => setEcoPendapatan(Number(e.target.value))}
                      className="bg-secondary/20 border-border/80 rounded-xl"
                    />
                    <span className="text-[10px] text-muted-foreground block">
                      Scale: Min Rp 0, Max Rp 150,000,000 / year
                    </span>
                  </div>

                  {/* eco_luas_lahan */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="eco-luas-lahan"
                      className="text-xs font-bold flex justify-between"
                    >
                      <span>COFFEE LAND ACREAGE (hectares)</span>
                      <span className="text-honey font-bold">
                        Normalized: {ecoLuasLahanNorm.toFixed(2)}
                      </span>
                    </Label>
                    <Input
                      id="eco-luas-lahan"
                      type="number"
                      step={0.1}
                      min={0}
                      max={10}
                      placeholder="e.g. 2.5"
                      value={ecoLuasLahan}
                      onChange={(e) => setEcoLuasLahan(Number(e.target.value))}
                      className="bg-secondary/20 border-border/80 rounded-xl"
                    />
                    <span className="text-[10px] text-muted-foreground block">
                      Scale: Min 0 ha, Max 10 ha
                    </span>
                  </div>

                  {/* eco_produksi */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="eco-produksi"
                      className="text-xs font-bold flex justify-between"
                    >
                      <span>COFFEE PRODUCTIVITY (ton/hectare/year)</span>
                      <span className="text-honey font-bold">
                        Normalized: {ecoProduksiNorm.toFixed(2)}
                      </span>
                    </Label>
                    <Input
                      id="eco-produksi"
                      type="number"
                      step={0.1}
                      min={0}
                      max={3}
                      placeholder="e.g. 1.2"
                      value={ecoProduksi}
                      onChange={(e) => setEcoProduksi(Number(e.target.value))}
                      className="bg-secondary/20 border-border/80 rounded-xl"
                    />
                    <span className="text-[10px] text-muted-foreground block">
                      Scale: Min 0 ton/ha, Max 3 ton/ha
                    </span>
                  </div>

                  {/* eco_kredit */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">BANK CREDIT / KUR ACCESS</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={ecoKredit === 0 ? "default" : "outline"}
                        className={`flex-1 rounded-xl h-11 font-semibold ${ecoKredit === 0 ? "bg-honey text-primary-foreground hover:bg-honey/95" : "border-border/80 text-foreground"}`}
                        onClick={() => setEcoKredit(0)}
                      >
                        No Credit Access (0)
                      </Button>
                      <Button
                        type="button"
                        variant={ecoKredit === 1 ? "default" : "outline"}
                        className={`flex-1 rounded-xl h-11 font-semibold ${ecoKredit === 1 ? "bg-honey text-primary-foreground hover:bg-honey/95" : "border-border/80 text-foreground"}`}
                        onClick={() => setEcoKredit(1)}
                      >
                        Active KUR Credit / Finance (1)
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end p-4 bg-honey/5 rounded-xl border border-honey/15">
                  <div className="text-sm font-bold text-primary">
                    Sub-Total Economic Score:{" "}
                    <span className="text-honey text-lg ml-2">{ecoScore.toFixed(2)} / 1.00</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Social Responsibility */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-chart-4" />
                    Pillar 3: Social Responsibility
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Measure farmer cooperative participation, gender inclusion, worker training, and
                    digital literacy.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* sos_kelompok */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">COOPERATIVE / FARMER GROUP ACTIVE</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={sosKelompok === 0 ? "default" : "outline"}
                        className={`flex-1 rounded-xl h-11 font-semibold ${sosKelompok === 0 ? "bg-chart-4 text-cream hover:bg-chart-4/95" : "border-border/80 text-foreground"}`}
                        onClick={() => setSosKelompok(0)}
                      >
                        Inactive (0)
                      </Button>
                      <Button
                        type="button"
                        variant={sosKelompok === 1 ? "default" : "outline"}
                        className={`flex-1 rounded-xl h-11 font-semibold ${sosKelompok === 1 ? "bg-chart-4 text-cream hover:bg-chart-4/95" : "border-border/80 text-foreground"}`}
                        onClick={() => setSosKelompok(1)}
                      >
                        Active Member (1)
                      </Button>
                    </div>
                  </div>

                  {/* sos_gender */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">GENDER EQUALITY & INCLUSION</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={sosGender === 0 ? "default" : "outline"}
                        className={`flex-1 rounded-xl h-11 font-semibold ${sosGender === 0 ? "bg-chart-4 text-cream hover:bg-chart-4/95" : "border-border/80 text-foreground"}`}
                        onClick={() => setSosGender(0)}
                      >
                        No / Unequal Roles (0)
                      </Button>
                      <Button
                        type="button"
                        variant={sosGender === 1 ? "default" : "outline"}
                        className={`flex-1 rounded-xl h-11 font-semibold ${sosGender === 1 ? "bg-chart-4 text-cream hover:bg-chart-4/95" : "border-border/80 text-foreground"}`}
                        onClick={() => setSosGender(1)}
                      >
                        Equal / Fair Roles (1)
                      </Button>
                    </div>
                  </div>

                  {/* sos_pendidikan */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">FARMER EDUCATION LEVEL</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={sosPendidikan === 0 ? "default" : "outline"}
                        className={`flex-1 rounded-xl h-11 font-semibold ${sosPendidikan === 0 ? "bg-chart-4 text-cream hover:bg-chart-4/95" : "border-border/80 text-foreground"}`}
                        onClick={() => setSosPendidikan(0)}
                      >
                        Primary School / SD (0)
                      </Button>
                      <Button
                        type="button"
                        variant={sosPendidikan === 1 ? "default" : "outline"}
                        className={`flex-1 rounded-xl h-11 font-semibold ${sosPendidikan === 1 ? "bg-chart-4 text-cream hover:bg-chart-4/95" : "border-border/80 text-foreground"}`}
                        onClick={() => setSosPendidikan(1)}
                      >
                        High School or Above / SMA+ (1)
                      </Button>
                    </div>
                  </div>

                  {/* sos_hp */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">MOBILE PHONE & SIGNAL ACCESS</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={sosHp === 0 ? "default" : "outline"}
                        className={`flex-1 rounded-xl h-11 font-semibold ${sosHp === 0 ? "bg-chart-4 text-cream hover:bg-chart-4/95" : "border-border/80 text-foreground"}`}
                        onClick={() => {
                          setSosHp(0);
                          setSosInternet(0);
                        }}
                      >
                        No Signal/Phone (0)
                      </Button>
                      <Button
                        type="button"
                        variant={sosHp === 1 ? "default" : "outline"}
                        className={`flex-1 rounded-xl h-11 font-semibold ${sosHp === 1 ? "bg-chart-4 text-cream hover:bg-chart-4/95" : "border-border/80 text-foreground"}`}
                        onClick={() => setSosHp(1)}
                      >
                        Has Signal & Phone (1)
                      </Button>
                    </div>
                  </div>

                  {/* sos_internet */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold flex justify-between">
                      <span>INTERNET ACCESS</span>
                      {sosHp === 0 && (
                        <span className="text-[10px] text-destructive font-semibold">
                          Requires Phone/Signal Access
                        </span>
                      )}
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        disabled={sosHp === 0}
                        variant={actualSosInternet === 0 ? "default" : "outline"}
                        className={`flex-1 rounded-xl h-11 font-semibold ${actualSosInternet === 0 ? "bg-chart-4 text-cream hover:bg-chart-4/95" : "border-border/80 text-foreground"}`}
                        onClick={() => setSosInternet(0)}
                      >
                        No Access (0)
                      </Button>
                      <Button
                        type="button"
                        disabled={sosHp === 0}
                        variant={actualSosInternet === 1 ? "default" : "outline"}
                        className={`flex-1 rounded-xl h-11 font-semibold ${actualSosInternet === 1 ? "bg-chart-4 text-cream hover:bg-chart-4/95" : "border-border/80 text-foreground"}`}
                        onClick={() => setSosInternet(1)}
                      >
                        Has Internet Access (1)
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end p-4 bg-chart-4/5 rounded-xl border border-chart-4/15">
                  <div className="text-sm font-bold text-primary">
                    Sub-Total Social Score:{" "}
                    <span className="text-chart-4 text-lg ml-2">{sosScore.toFixed(2)} / 1.00</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Review and Submit */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-forest animate-pulse" />
                    Review Self-Audit Results
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Below is the final Ecoscore calculation that will be submitted to the SEA
                    Validator.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="rounded-2xl border-border bg-secondary/5 overflow-hidden">
                    <CardHeader className="bg-primary/5 p-4 border-b border-border/40">
                      <CardTitle className="text-sm font-bold text-primary">
                        Indicators Score Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3.5 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <Leaf className="h-4 w-4 text-forest" /> Environmental Score:
                        </span>
                        <span className="font-bold text-forest">{envScore.toFixed(2)} / 1.00</span>
                      </div>
                      <Progress
                        value={envScore * 100}
                        className="h-1 bg-border"
                        style={{ "--progress-background": "var(--forest)" } as any}
                      />

                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <Flame className="h-4 w-4 text-honey" /> Economic Score:
                        </span>
                        <span className="font-bold text-honey">{ecoScore.toFixed(2)} / 1.00</span>
                      </div>
                      <Progress
                        value={ecoScore * 100}
                        className="h-1 bg-border"
                        style={{ "--progress-background": "var(--honey)" } as any}
                      />

                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-chart-4" /> Social Score:
                        </span>
                        <span className="font-bold text-chart-4">{sosScore.toFixed(2)} / 1.00</span>
                      </div>
                      <Progress
                        value={sosScore * 100}
                        className="h-1 bg-border"
                        style={{ "--progress-background": "var(--chart-4)" } as any}
                      />
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-transparent bg-linear-to-br from-forest/10 to-primary/5 flex flex-col justify-center items-center p-6 text-center border">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Overall Ecoscore Calculation
                    </div>
                    <div className="text-5xl font-black text-forest mt-2">
                      {ecoscore.toFixed(2)}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-primary mt-2">
                      Average of 3 Pillars (env + eco + sos) / 3
                    </div>
                    <Badge
                      className={`mt-4 rounded-full font-bold text-xs px-3 py-1 ${getAwardLevel(ecoscore).color}`}
                    >
                      Award: {getAwardLevel(ecoscore).name}
                    </Badge>
                  </Card>
                </div>

                <div className="p-4 rounded-2xl bg-destructive/5 text-destructive border border-destructive/10 text-xs flex gap-2">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <div>
                    <strong className="block font-bold mb-0.5">Audit Validation Disclaimer:</strong>
                    The Ecoscore above is calculated based on self-assessment. These metrics will be
                    directly verified by an independent SEA (Eco-Agribusiness Certification) auditor
                    before an official certificate is released.
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-secondary/15 p-4 rounded-xl border border-border">
                  <div>
                    <span className="text-muted-foreground block text-xs">APPLICANT FARM</span>
                    <span className="font-bold text-foreground">{farmName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">COFFEE VARIETY</span>
                    <span className="font-bold text-foreground">{coffeeVariety}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">COUNTRY</span>
                    <span className="font-bold text-foreground">{country}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">REGION / PROVINCE</span>
                    <span className="font-bold text-foreground">{region}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-secondary/10 border-t border-border/40 p-6 flex justify-between">
            {step > 1 ? (
              <Button
                onClick={handlePrevStep}
                variant="outline"
                className="border-border rounded-xl"
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
            ) : (
              <Button
                onClick={() => setIsApplying(false)}
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
            )}

            {step < 4 ? (
              <Button
                onClick={handleNextStep}
                className="bg-forest text-cream hover:bg-forest-deep rounded-xl px-5"
              >
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmitApplication}
                disabled={submitMutation.isPending}
                className="bg-forest text-cream hover:bg-forest-deep rounded-xl px-6 font-bold shadow-md"
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Application"}{" "}
                <Send className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      ) : (
        /* HISTORY AND CERTIFICATES LIST */
        <div className="space-y-6">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading certification data...
            </div>
          ) : certifications && certifications.length > 0 ? (
            <div className="grid gap-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card
                  className="rounded-2xl border-border"
                  style={{ boxShadow: "var(--shadow-soft)" }}
                >
                  <CardHeader className="pb-3">
                    <CardDescription>Pending Review</CardDescription>
                    <CardTitle className="text-3xl font-extrabold text-honey">
                      {pendingCertifications.length}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card
                  className="rounded-2xl border-border"
                  style={{ boxShadow: "var(--shadow-soft)" }}
                >
                  <CardHeader className="pb-3">
                    <CardDescription>Approved</CardDescription>
                    <CardTitle className="text-3xl font-extrabold text-forest">
                      {approvedCertifications.length}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card
                  className="rounded-2xl border-border"
                  style={{ boxShadow: "var(--shadow-soft)" }}
                >
                  <CardHeader className="pb-3">
                    <CardDescription>Rejected</CardDescription>
                    <CardTitle className="text-3xl font-extrabold text-destructive">
                      {rejectedCertifications.length}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card
                  className="rounded-2xl border-border"
                  style={{ boxShadow: "var(--shadow-soft)" }}
                >
                  <CardHeader>
                    <CardTitle className="text-primary font-bold">Pending Review</CardTitle>
                    <CardDescription>
                      Applications currently awaiting SEA validation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {pendingCertifications.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border bg-secondary/10 px-6">
                              <th className="py-3 px-6">Farm</th>
                              <th className="py-3 px-6">Variety</th>
                              <th className="py-3 px-6 text-center">Score</th>
                              <th className="py-3 px-6">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pendingCertifications.map((c: any) => (
                              <tr
                                key={c.id}
                                className="border-t border-border/60 hover:bg-secondary/15 transition-colors"
                              >
                                <td className="py-4 px-6 font-bold text-foreground">
                                  {c.farm_name}
                                </td>
                                <td className="py-4 px-6 text-muted-foreground">
                                  {c.coffee_variety}
                                </td>
                                <td className="py-4 px-6 text-center font-bold text-honey">
                                  {Number(c.ecoscore).toFixed(2)}
                                </td>
                                <td className="py-4 px-6 text-muted-foreground text-xs">
                                  {new Date(c.created_at).toLocaleDateString("en-US", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-muted-foreground">
                        No pending applications found.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card
                  className="rounded-2xl border-border"
                  style={{ boxShadow: "var(--shadow-soft)" }}
                >
                  <CardHeader>
                    <CardTitle className="text-primary font-bold">Approved</CardTitle>
                    <CardDescription>
                      Certifications fully verified and approved by SEA.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {approvedCertifications.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border bg-secondary/10 px-6">
                              <th className="py-3 px-6">Farm</th>
                              <th className="py-3 px-6 text-center">Score</th>
                              <th className="py-3 px-6">Validator</th>
                              <th className="py-3 px-6">Proof</th>
                              <th className="py-3 px-6 text-right">Verification</th>
                            </tr>
                          </thead>
                          <tbody>
                            {approvedCertifications.map((c: any) => (
                              <tr
                                key={c.id}
                                className="border-t border-border/60 hover:bg-secondary/15 transition-colors"
                              >
                                <td className="py-4 px-6 font-bold text-foreground">
                                  <div>{c.farm_name}</div>
                                  <div className="text-xs text-muted-foreground font-normal">
                                    {c.coffee_variety}
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-center font-bold text-forest">
                                  {Number(c.ecoscore).toFixed(2)}
                                </td>
                                <td className="py-4 px-6 text-xs text-muted-foreground">
                                  {c.validator_name || "SEA Auditor"}
                                </td>
                                <td className="py-4 px-6 text-xs text-muted-foreground">
                                  {c.validator_photo ? "Available" : "-"}
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <Button
                                    onClick={() => setSelectedCert(c)}
                                    size="sm"
                                    className="rounded-xl bg-forest hover:bg-forest-deep text-cream font-bold transition shadow-sm text-xs py-1 px-3"
                                  >
                                    View Verification
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-muted-foreground">
                        No approved certificates yet.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {rejectedCertifications.length > 0 && (
                <Card
                  className="rounded-2xl border-border"
                  style={{ boxShadow: "var(--shadow-soft)" }}
                >
                  <CardHeader>
                    <CardTitle className="text-primary font-bold">Rejected</CardTitle>
                    <CardDescription>
                      Applications rejected by SEA along with validator feedback.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border bg-secondary/10 px-6">
                            <th className="py-3 px-6">Farm</th>
                            <th className="py-3 px-6 text-center">Score</th>
                            <th className="py-3 px-6">Feedback</th>
                            <th className="py-3 px-6">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rejectedCertifications.map((c: any) => (
                            <tr
                              key={c.id}
                              className="border-t border-border/60 hover:bg-secondary/15 transition-colors"
                            >
                              <td className="py-4 px-6 font-bold text-foreground">{c.farm_name}</td>
                              <td className="py-4 px-6 text-center font-bold text-destructive">
                                {Number(c.ecoscore).toFixed(2)}
                              </td>
                              <td className="py-4 px-6 text-xs text-muted-foreground max-w-sm">
                                {c.validator_feedback || "-"}
                              </td>
                              <td className="py-4 px-6 text-muted-foreground text-xs">
                                {new Date(c.created_at).toLocaleDateString("en-US", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card
                className="rounded-2xl border-border"
                style={{ boxShadow: "var(--shadow-soft)" }}
              >
                <CardHeader>
                  <CardTitle className="text-primary font-bold">
                    Certification Application History
                  </CardTitle>
                  <CardDescription>
                    Status of all certification requests in one list.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border bg-secondary/10 px-6">
                          <th className="py-3 px-6">Farm</th>
                          <th className="py-3 px-6">Variety</th>
                          <th className="py-3 px-6 text-center">Score</th>
                          <th className="py-3 px-6">Status</th>
                          <th className="py-3 px-6">Date</th>
                          <th className="py-3 px-6">Validator Feedback</th>
                        </tr>
                      </thead>
                      <tbody>
                        {certifications.map((c: any) => (
                          <tr
                            key={c.id}
                            className="border-t border-border/60 hover:bg-secondary/15 transition-colors"
                          >
                            <td className="py-4 px-6 font-bold text-foreground">{c.farm_name}</td>
                            <td className="py-4 px-6 text-muted-foreground">{c.coffee_variety}</td>
                            <td className="py-4 px-6 text-center font-bold text-forest">
                              {Number(c.ecoscore).toFixed(2)}
                            </td>
                            <td className="py-4 px-6">{getStatusBadge(c.status)}</td>
                            <td className="py-4 px-6 text-muted-foreground text-xs">
                              {new Date(c.created_at).toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="py-4 px-6 text-xs text-muted-foreground max-w-xs">
                              {c.validator_feedback ? (
                                <div className="flex flex-col gap-1">
                                  <span className="block truncate" style={{ maxWidth: 150 }}>
                                    {c.validator_feedback}
                                  </span>
                                  {c.validator_photo && (
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <button className="text-forest font-bold text-[10px] hover:underline flex items-center gap-1 mt-0.5 focus:outline-none">
                                          <Camera className="h-3.5 w-3.5 animate-pulse" /> View
                                          On-Site Proof
                                        </button>
                                      </DialogTrigger>
                                      <DialogContent
                                        className="max-w-md rounded-3xl border-border bg-card p-6"
                                        style={{ boxShadow: "var(--shadow-elegant)" }}
                                      >
                                        <DialogHeader>
                                          <DialogTitle className="text-sm font-bold text-primary flex items-center gap-1.5">
                                            <ShieldCheck className="h-4 w-4 text-forest" /> On-Site
                                            Validation Proof
                                          </DialogTitle>
                                          <DialogDescription className="text-[10px]">
                                            Photo taken during on-site visit for '{c.farm_name}'
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="rounded-2xl overflow-hidden border border-border/80 aspect-video shadow-inner mt-2">
                                          <img
                                            src={c.validator_photo}
                                            alt="On-site proof"
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                        <div className="text-xs text-foreground mt-3 bg-secondary/10 p-3 rounded-xl border border-border/40">
                                          <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                                            Feedback Comments
                                          </p>
                                          <p className="leading-relaxed">{c.validator_feedback}</p>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid gap-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card
                  className="rounded-2xl border-border"
                  style={{ boxShadow: "var(--shadow-soft)" }}
                >
                  <CardHeader className="pb-3">
                    <CardDescription>Pending Review</CardDescription>
                    <CardTitle className="text-3xl font-extrabold text-honey">0</CardTitle>
                  </CardHeader>
                </Card>
                <Card
                  className="rounded-2xl border-border"
                  style={{ boxShadow: "var(--shadow-soft)" }}
                >
                  <CardHeader className="pb-3">
                    <CardDescription>Approved</CardDescription>
                    <CardTitle className="text-3xl font-extrabold text-forest">0</CardTitle>
                  </CardHeader>
                </Card>
                <Card
                  className="rounded-2xl border-border"
                  style={{ boxShadow: "var(--shadow-soft)" }}
                >
                  <CardHeader className="pb-3">
                    <CardDescription>Rejected</CardDescription>
                    <CardTitle className="text-3xl font-extrabold text-destructive">0</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card
                  className="rounded-2xl border-border"
                  style={{ boxShadow: "var(--shadow-soft)" }}
                >
                  <CardHeader>
                    <CardTitle className="text-primary font-bold">Pending Review</CardTitle>
                    <CardDescription>
                      Applications currently awaiting SEA validation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-6 text-center text-muted-foreground">
                      No pending applications found.
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="rounded-2xl border-border"
                  style={{ boxShadow: "var(--shadow-soft)" }}
                >
                  <CardHeader>
                    <CardTitle className="text-primary font-bold">Approved</CardTitle>
                    <CardDescription>
                      Certifications fully verified and approved by SEA.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-6 text-center text-muted-foreground">
                      No approved certificates yet.
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card
                className="rounded-2xl border-border"
                style={{ boxShadow: "var(--shadow-soft)" }}
              >
                <CardHeader>
                  <CardTitle className="text-primary font-bold">
                    Certification Application History
                  </CardTitle>
                  <CardDescription>
                    Status of all certification requests in one list.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center space-y-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-honey/10 text-honey mx-auto">
                      <Award className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        No certifications submitted yet
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                        Conduct a self-assessment of your Ecoscore (Environmental, Economic, Social)
                        to apply for official verification from SEA.
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsApplying(true)}
                      className="rounded-full bg-forest text-cream hover:bg-forest-deep px-5 shadow-sm font-bold mt-2"
                    >
                      Start First Application
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
      <CertificateModal
        isOpen={selectedCert !== null}
        onClose={() => setSelectedCert(null)}
        certification={selectedCert}
      />
    </div>
  );
}
