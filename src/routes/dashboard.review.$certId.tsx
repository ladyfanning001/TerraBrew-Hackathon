import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPendingCertifications, validateCertification } from "@/lib/auth-server";
import { toast } from "sonner";
import {
  ShieldCheck,
  Award,
  Check,
  X,
  AlertCircle,
  Leaf,
  Flame,
  MessageSquare,
  Camera,
  Trash2,
  ArrowLeft,
  Save,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/dashboard/review/$certId")({
  head: () => ({
    meta: [
      { title: "Review & Audit — TerraBrew" },
      { name: "description", content: "Detailed certification review and validation." },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { certId } = useParams({ from: "/dashboard/review/$certId" });
  const queryClient = useQueryClient();

  const [selectedCert, setSelectedCert] = useState<any | null>(null);
  const [feedback, setFeedback] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all pending certifications and find the one with matching ID
  const { data: pendingList, isLoading } = useQuery({
    queryKey: ["pendingCertifications", user?.id],
    queryFn: () => getPendingCertifications({ data: { validatorId: user!.id, allRegions: false } }),
    enabled: !!user && user.role === "sea",
  });

  // Set selected cert when data loads
  useEffect(() => {
    if (pendingList && !selectedCert) {
      const cert = pendingList.find((c: any) => c.id === parseInt(certId));
      if (cert) {
        setSelectedCert(cert);
      } else {
        toast.error("Certification not found");
        navigate({ to: "/dashboard/validate" });
      }
    }
  }, [pendingList, certId, selectedCert, navigate]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Photo size should be less than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate certification mutation
  const validateMutation = useMutation({
    mutationFn: validateCertification,
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Verification successfully saved.");
        queryClient.invalidateQueries({ queryKey: ["pendingCertifications"] });
        navigate({ to: "/dashboard/validate" });
      } else {
        toast.error("Failed to save verification: " + res.error);
      }
    },
    onError: (err: any) => {
      toast.error("Connection error: " + err.message);
    },
  });

  const handleAction = (status: "approved" | "rejected") => {
    if (!selectedCert || !user) return;
    if (!feedback.trim()) {
      toast.error("Please provide feedback before processing.");
      return;
    }

    if (status === "approved" && !photo) {
      toast.error("An on-site audit proof photo is required for approval.");
      return;
    }

    validateMutation.mutate({
      data: {
        certificationId: selectedCert.id,
        validatorId: user.id,
        status,
        feedback,
        validatorPhoto: photo || undefined,
      },
    });
  };

  if (!user || user.role !== "sea") {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h3 className="text-lg font-bold text-foreground">Access Denied</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          This portal is strictly accessible by verified **SEA Validator** accounts.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <Award className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading certification details...</p>
        </div>
      </div>
    );
  }

  if (!selectedCert) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h3 className="text-lg font-bold text-foreground">Certification Not Found</h3>
        <Button onClick={() => navigate({ to: "/dashboard/validate" })} variant="outline">
          Back to Validation
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back Button */}
      <Button
        onClick={() => navigate({ to: "/dashboard/validate" })}
        variant="ghost"
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Validation List
      </Button>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-honey font-bold">
          <ShieldCheck className="h-4 w-4" /> SEA Auditing Portal
        </div>
        <h1 className="text-3xl font-bold text-primary">Review & Validate Certification</h1>
        <p className="text-sm text-muted-foreground">
          Farmer: <span className="font-bold text-foreground">{selectedCert.farmer_name}</span> ·
          Farm: <span className="font-bold text-foreground">{selectedCert.farm_name}</span>
        </p>
      </div>

      {/* Score Summary Card */}
      <Card className="rounded-2xl border-border shadow-[var(--shadow-soft)] overflow-hidden">
        <CardHeader className="bg-secondary/20 border-b border-border/40">
          <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
            <Award className="h-5 w-5 text-honey" />
            Submitted Ecoscore Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-secondary/10 rounded-xl border border-border/40">
              <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Total Ecoscore
              </div>
              <div className="text-3xl font-extrabold text-forest mt-2">
                {Number(selectedCert.ecoscore).toFixed(2)}
              </div>
              <Badge
                variant="outline"
                className={`mt-2 rounded-full border-transparent font-bold text-[10px] w-full justify-center ${
                  Number(selectedCert.ecoscore) >= 0.66
                    ? "text-[#10b981] bg-[#10b981]/15"
                    : Number(selectedCert.ecoscore) >= 0.33
                      ? "text-[#f59e0b] bg-[#f59e0b]/15"
                      : "text-[#ef4444] bg-[#ef4444]/15"
                }`}
              >
                {Number(selectedCert.ecoscore) >= 0.66
                  ? "High"
                  : Number(selectedCert.ecoscore) >= 0.33
                    ? "Medium"
                    : "Low"}
              </Badge>
            </div>

            <div className="text-center p-4 bg-green-50/50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="text-[10px] uppercase font-bold tracking-wider text-green-600 dark:text-green-400">
                Environmental
              </div>
              <div className="text-2xl font-extrabold text-green-700 dark:text-green-300 mt-2">
                {Number(selectedCert.env_score).toFixed(2)}
              </div>
            </div>

            <div className="text-center p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">
                Economic
              </div>
              <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-300 mt-2">
                {Number(selectedCert.eco_score).toFixed(2)}
              </div>
            </div>

            <div className="text-center p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
                Social
              </div>
              <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 mt-2">
                {Number(selectedCert.sos_score).toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sustainability Pillars */}
      <div className="space-y-4">
        {/* Environmental Pillar */}
        <Card className="rounded-2xl border-border shadow-[var(--shadow-soft)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-green-700 dark:text-green-300 flex items-center gap-2 uppercase">
              <Leaf className="h-4 w-4" /> Pillar 1: Environmental (
              {Number(selectedCert.env_score).toFixed(2)}/1.00)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2 bg-secondary/10 p-3 rounded-lg border border-border/40">
              <div>
                Temp:{" "}
                <span className="font-bold">
                  {Number(selectedCert.env_suhu || 25).toFixed(1)}°C
                </span>
              </div>
              <div>
                Humidity:{" "}
                <span className="font-bold">{Number(selectedCert.env_rh || 70).toFixed(1)}%</span>
              </div>
              <div>
                Rainfall:{" "}
                <span className="font-bold">
                  {Number(selectedCert.env_curah_hujan || 30).toFixed(1)}mm/day
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                Climate Suitability:{" "}
                <span className="font-bold">
                  {Number(selectedCert.env_kesesuaian) === 1 ? "✓ Suitable" : "✗ Unsuitable"}
                </span>
              </div>
              <div>
                Processing Method:{" "}
                <span className="font-bold">
                  {Number(selectedCert.env_metode) === 1 ? "Honey/Natural" : "Washed"}
                </span>
              </div>
              <div>
                Clean Energy:{" "}
                <span className="font-bold">
                  {Number(selectedCert.env_energi) === 1 ? "✓ Renewable" : "✗ Fossil"}
                </span>
              </div>
              <div>
                Low Pesticide:{" "}
                <span className="font-bold">
                  {Number(selectedCert.env_pestisida) === 1 ? "✓ Organic" : "✗ Chemicals"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Economic Pillar */}
        <Card className="rounded-2xl border-border shadow-[var(--shadow-soft)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2 uppercase">
              <Flame className="h-4 w-4" /> Pillar 2: Economic (
              {Number(selectedCert.eco_score).toFixed(2)}/1.00)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2 bg-secondary/10 p-3 rounded-lg border border-border/40">
              <div className="col-span-3">
                Income:{" "}
                <span className="font-bold">
                  Rp {Number(selectedCert.eco_pendapatan || 0).toLocaleString("id-ID")}/year
                </span>
              </div>
              <div>
                Acreage:{" "}
                <span className="font-bold">
                  {Number(selectedCert.eco_luas_lahan || 0).toFixed(1)} ha
                </span>
              </div>
              <div>
                Productivity:{" "}
                <span className="font-bold">
                  {Number(selectedCert.eco_produksi || 0).toFixed(1)} ton/ha/year
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                Quality:{" "}
                <span className="font-bold">
                  {Number(selectedCert.eco_kualitas) === 1 ? "✓ Specialty" : "Standard"}
                </span>
              </div>
              <div>
                Financial Credit:{" "}
                <span className="font-bold">
                  {Number(selectedCert.eco_kredit) === 1 ? "✓ Has Access" : "✗ No Access"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Pillar */}
        <Card className="rounded-2xl border-border shadow-[var(--shadow-soft)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2 uppercase">
              <ShieldCheck className="h-4 w-4" /> Pillar 3: Social (
              {Number(selectedCert.sos_score).toFixed(2)}/1.00)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                Group Participation:{" "}
                <span className="font-bold">
                  {Number(selectedCert.sos_kelompok) === 1 ? "✓ Active" : "✗ Inactive"}
                </span>
              </div>
              <div>
                Gender Rights:{" "}
                <span className="font-bold">
                  {Number(selectedCert.sos_gender) === 1 ? "✓ Equal" : "✗ Not Equal"}
                </span>
              </div>
              <div>
                Education & Safety:{" "}
                <span className="font-bold">
                  {Number(selectedCert.sos_pendidikan) === 1 ? "✓ High School+" : "Primary"}
                </span>
              </div>
              <div>
                Mobile Phone:{" "}
                <span className="font-bold">
                  {Number(selectedCert.sos_hp) === 1 ? "✓ Has Access" : "✗ No Access"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback & Decision Form */}
      <Card className="rounded-2xl border-border shadow-[var(--shadow-soft)]">
        <CardHeader className="bg-secondary/20 border-b border-border/40">
          <CardTitle className="text-primary font-bold">SEA Validator Decision Form</CardTitle>
          <CardDescription>Provide detailed feedback and make your final decision</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Validator Feedback */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-forest" />
              Validator Feedback & Review (Required)
            </Label>
            <Textarea
              placeholder="Enter detailed farm evaluation, suggestions for sustainability improvements, or reasons for approval/rejection..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[120px] border-border/80 focus-visible:ring-forest bg-secondary/10 rounded-xl text-xs"
            />
            <p className="text-[10px] text-muted-foreground">{feedback.length} characters</p>
          </div>

          {/* Audit Photo */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
              <Camera className="h-4 w-4 text-forest" />
              On-Site Audit Proof Photo (Required for Approval)
            </Label>

            {photo ? (
              <div className="relative rounded-2xl overflow-hidden border border-border/80 aspect-video max-w-sm mx-auto shadow-sm group">
                <img src={photo} alt="Audit proof preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setPhoto(null)}
                    className="rounded-xl font-bold text-xs"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Retake Photo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border/80 hover:border-forest/60 bg-secondary/10 rounded-2xl p-8 text-center transition cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs font-bold text-foreground">
                  Click to Take or Upload Proof Photo
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Camera will activate on mobile devices (Max 2MB)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          onClick={() => navigate({ to: "/dashboard/validate" })}
          variant="outline"
          className="text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Button>
        <div className="flex gap-2 ml-auto">
          <Button
            onClick={() => handleAction("rejected")}
            disabled={validateMutation.isPending || !feedback.trim()}
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive rounded-xl font-bold"
          >
            <X className="mr-1.5 h-4 w-4" /> Reject Application
          </Button>
          <Button
            onClick={() => handleAction("approved")}
            disabled={validateMutation.isPending || !feedback.trim() || !photo}
            className="bg-forest text-cream hover:bg-forest-deep rounded-xl font-bold"
          >
            <Check className="mr-1.5 h-4 w-4" /> Approve & Release
          </Button>
        </div>
      </div>
    </div>
  );
}
