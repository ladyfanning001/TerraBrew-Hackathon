import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  ListFilter,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/dashboard/review")({
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
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<"jurisdiction" | "all">("jurisdiction");
  const [selectedCert, setSelectedCert] = useState<any | null>(null);
  const [feedback, setFeedback] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);

  const { data: pendingList, isLoading } = useQuery({
    queryKey: ["pendingCertifications", user?.id, viewMode],
    queryFn: () =>
      getPendingCertifications({ data: { validatorId: user!.id, allRegions: viewMode === "all" } }),
    enabled: !!user && user.role === "sea",
  });

  useEffect(() => {
    if (pendingList && pendingList.length > 0 && !selectedCert) {
      setSelectedCert(pendingList[0]);
      setFeedback("");
      setPhoto(null);
    }
  }, [pendingList, selectedCert]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo size should be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateMutation = useMutation({
    mutationFn: validateCertification,
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Verification successfully saved.");
        queryClient.invalidateQueries({ queryKey: ["pendingCertifications"] });
        setFeedback("");
        setPhoto(null);
        setSelectedCert(null);
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
      <div
        className="flex flex-col items-center justify-center p-6 text-center space-y-4"
        style={{ minHeight: 400 }}
      >
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h3 className="text-lg font-bold text-foreground">Access Denied</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          This portal is strictly accessible by verified SEA Validator accounts.
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

  if (!pendingList || pendingList.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center p-6 text-center space-y-4"
        style={{ minHeight: 400 }}
      >
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-bold text-foreground">No pending certifications</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          There are no applications in the selected scope right now.
        </p>
        <Button onClick={() => navigate({ to: "/dashboard/validate" })} variant="outline">
          Back to Validation Portal
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-honey font-bold">
            <ShieldCheck className="h-4 w-4" /> SEA Auditing Portal
          </div>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl text-primary">Review & Audit</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Select an application, edit feedback directly on the page, and approve or reject without
            a popup.
          </p>
        </div>
        {user?.country && user?.region && (
          <Badge
            variant="outline"
            className="border-honey/30 text-honey bg-honey/5 rounded-xl px-4 py-2 text-xs font-bold gap-1.5 shadow-sm"
          >
            📍 {user.region}, {user.country} Jurisdiction
          </Badge>
        )}
      </div>

      <div className="flex gap-2 p-1 bg-secondary/25 rounded-2xl max-w-md border border-border/40 shadow-sm">
        <button
          onClick={() => setViewMode("jurisdiction")}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all focus:outline-none ${
            viewMode === "jurisdiction"
              ? "bg-forest text-cream shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          My Jurisdiction ({user?.region || "Local"})
        </button>
        <button
          onClick={() => setViewMode("all")}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all focus:outline-none ${
            viewMode === "all"
              ? "bg-forest text-cream shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All Jurisdictions (Global)
        </button>
      </div>

      <Card
        className="rounded-2xl border-border overflow-hidden"
        style={{ boxShadow: "var(--shadow-soft)" }}
      >
        <CardHeader className="border-b border-border/40 bg-secondary/10">
          <CardTitle className="flex items-center gap-2 text-primary font-bold">
            <ListFilter className="h-4 w-4" /> Pending Applications
          </CardTitle>
          <CardDescription>
            Select an application below to open its editable review form.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid gap-0 md:grid-cols-[340px_1fr]">
            <div
              className="border-b border-border/40 md:border-b-0 md:border-r md:border-border/40 overflow-y-auto"
              style={{ maxHeight: 420 }}
            >
              {pendingList.map((cert: any) => (
                <button
                  key={cert.id}
                  onClick={() => {
                    setSelectedCert(cert);
                    setFeedback("");
                    setPhoto(null);
                  }}
                  className={`w-full text-left px-4 py-4 border-b border-border/30 transition-colors hover:bg-secondary/10 ${
                    selectedCert?.id === cert.id ? "bg-secondary/15" : "bg-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-foreground">{cert.farmer_name}</div>
                      <div className="text-xs text-muted-foreground">{cert.farm_name}</div>
                    </div>
                    <Badge variant="outline" className="rounded-full text-[10px] font-bold">
                      {Number(cert.ecoscore).toFixed(2)}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">{cert.coffee_variety}</div>
                </button>
              ))}
            </div>

            <div className="p-6">
              {!selectedCert ? (
                <div
                  className="flex items-center justify-center text-center text-muted-foreground"
                  style={{ minHeight: 320 }}
                >
                  Select one certification application from the left to start reviewing.
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-primary">
                      Review & Validate Certification
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Farmer:{" "}
                      <span className="font-bold text-foreground">{selectedCert.farmer_name}</span>{" "}
                      · Farm:{" "}
                      <span className="font-bold text-foreground">{selectedCert.farm_name}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-secondary/10 rounded-xl border border-border/40">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                        Total Ecoscore
                      </div>
                      <div className="text-3xl font-extrabold text-forest mt-2">
                        {Number(selectedCert.ecoscore).toFixed(2)}
                      </div>
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

                  <div className="space-y-4">
                    <Card
                      className="rounded-2xl border-border"
                      style={{ boxShadow: "var(--shadow-soft)" }}
                    >
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
                            <span className="font-bold">
                              {Number(selectedCert.env_rh || 70).toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            Rainfall:{" "}
                            <span className="font-bold">
                              {Number(selectedCert.env_curah_hujan || 30).toFixed(1)}mm/day
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      className="rounded-2xl border-border"
                      style={{ boxShadow: "var(--shadow-soft)" }}
                    >
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
                              Rp {Number(selectedCert.eco_pendapatan || 0).toLocaleString("id-ID")}
                              /year
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
                      </CardContent>
                    </Card>

                    <Card
                      className="rounded-2xl border-border"
                      style={{ boxShadow: "var(--shadow-soft)" }}
                    >
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
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card
                    className="rounded-2xl border-border"
                    style={{ boxShadow: "var(--shadow-soft)" }}
                  >
                    <CardHeader className="bg-secondary/20 border-b border-border/40">
                      <CardTitle className="text-primary font-bold">
                        SEA Validator Decision Form
                      </CardTitle>
                      <CardDescription>
                        Edit the feedback directly here, then approve or reject.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
                          <MessageSquare className="h-4 w-4 text-forest" />
                          Validator Feedback & Review (Required)
                        </Label>
                        <Textarea
                          placeholder="Enter detailed farm evaluation, suggestions for sustainability improvements, or reasons for approval/rejection..."
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          className="border-border/80 focus-visible:ring-forest bg-secondary/10 rounded-xl text-xs"
                          style={{ minHeight: 120 }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
                          <Camera className="h-4 w-4 text-forest" />
                          On-Site Audit Proof Photo (Required for Approval)
                        </Label>

                        {photo ? (
                          <div className="relative rounded-2xl overflow-hidden border border-border/80 aspect-video max-w-sm mx-auto shadow-sm group">
                            <img
                              src={photo}
                              alt="Audit proof preview"
                              className="w-full h-full object-cover"
                            />
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

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      onClick={() => navigate({ to: "/dashboard/validate" })}
                      variant="outline"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to Validation Portal
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
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
