import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPendingCertifications, validateCertification } from "@/lib/auth-server";
import { toast } from "sonner";
import { 
  ShieldCheck, Award, FileText, Check, X, ClipboardCheck,
  AlertCircle, Leaf, Flame, HelpCircle, Calendar, MessageSquare,
  Camera, Trash2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/dashboard/validate")({
  head: () => ({
    meta: [
      { title: "Validation Portal — TerraBrew" },
      { name: "description", content: "SEA Validator interface for Specialty Coffee Certifications." },
    ],
  }),
  component: ValidatePortal,
});

function ValidatePortal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCert, setSelectedCert] = useState<any | null>(null);
  const [feedback, setFeedback] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Convert uploaded file to base64
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

  const [viewMode, setViewMode] = useState<"jurisdiction" | "all">("jurisdiction");

  // Fetch pending certifications
  const { data: pendingList, isLoading } = useQuery({
    queryKey: ["pendingCertifications", user?.id, viewMode],
    queryFn: () => getPendingCertifications({ data: { validatorId: user!.id, allRegions: viewMode === "all" } }),
    enabled: !!user && user.role === "sea",
  });

  // Validate certification mutation
  const validateMutation = useMutation({
    mutationFn: validateCertification,
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Verification successfully saved.");
        queryClient.invalidateQueries({ queryKey: ["pendingCertifications"] });
        setIsDialogOpen(false);
        setSelectedCert(null);
        setFeedback("");
        setPhoto(null);
      } else {
        toast.error("Failed to save verification: " + res.error);
      }
    },
    onError: (err: any) => {
      toast.error("Connection error: " + err.message);
    }
  });

  const handleOpenReview = (cert: any) => {
    setSelectedCert(cert);
    setFeedback("");
    setPhoto(null);
    setIsDialogOpen(true);
  };

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
        validatorPhoto: photo || undefined
      }
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

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-honey font-bold">
            <ShieldCheck className="h-4 w-4" /> SEA Auditing Portal
          </div>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl text-primary">Validation Portal</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review farmers' self-reported sustainability metrics, check indicator scores across the 3 pillars, provide feedback, and issue official certificates.
          </p>
        </div>
        {user?.country && user?.region && (
          <Badge variant="outline" className="border-honey/30 text-honey bg-honey/5 rounded-xl px-4 py-2 text-xs font-bold gap-1.5 shadow-sm">
            📍 {user.region}, {user.country} Jurisdiction
          </Badge>
        )}
      </div>

      {/* View Mode Tabs */}
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

      <Card className="rounded-2xl border-border shadow-[var(--shadow-soft)] overflow-hidden">
        <CardHeader>
          <CardTitle className="text-primary font-bold">Certification Applications Pending Validation</CardTitle>
          <CardDescription>
            There are {pendingList?.length || 0} new specialty coffee certification requests requiring your review.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading certification requests...</div>
          ) : pendingList && pendingList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border bg-secondary/15 px-6">
                    <th className="py-3 px-6">Coffee Farmer</th>
                    <th className="py-3 px-6">Email</th>
                    <th className="py-3 px-6">Farm Name</th>
                    <th className="py-3 px-6">Variety</th>
                    <th className="py-3 px-6 text-center">Ecoscore</th>
                    <th className="py-3 px-6">Submission Date</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingList.map((c: any) => (
                    <tr key={c.id} className="border-t border-border/60 hover:bg-secondary/10 transition-colors">
                      <td className="py-4 px-6 font-bold text-foreground">{c.farmer_name}</td>
                      <td className="py-4 px-6 text-muted-foreground text-xs">{c.farmer_email}</td>
                      <td className="py-4 px-6 font-semibold text-foreground">{c.farm_name}</td>
                      <td className="py-4 px-6 text-muted-foreground">{c.coffee_variety}</td>
                      <td className="py-4 px-6 text-center font-bold text-forest">{Number(c.ecoscore).toFixed(2)}</td>
                      <td className="py-4 px-6 text-muted-foreground text-xs">
                        {new Date(c.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button 
                          onClick={() => handleOpenReview(c)} 
                          size="sm" 
                          className="bg-forest text-cream hover:bg-forest-deep rounded-lg font-bold text-xs"
                        >
                          <ClipboardCheck className="mr-1 h-3.5 w-3.5" /> Review Audit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground font-semibold">
              No certification requests are pending validation at this time.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl rounded-2xl bg-card border-border overflow-hidden p-0">
          {selectedCert && (
            <>
              <DialogHeader className="bg-secondary/20 p-6 border-b border-border/40">
                <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
                  <Award className="h-5 w-5 text-honey" />
                  Review Sustainability Self-Audit Report
                </DialogTitle>
                <DialogDescription>
                  Applicant: <span className="font-bold text-foreground">{selectedCert.farmer_name}</span> · Farm: <span className="font-bold text-foreground">{selectedCert.farm_name}</span>
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="max-h-[50vh] p-6 space-y-6">
                {/* Score Summary Box */}
                <div className="grid grid-cols-2 gap-4 bg-secondary/10 p-4 rounded-xl border border-border/60 mb-6">
                  <div className="flex flex-col justify-center items-center text-center p-3 border-r border-border/60">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Submitted Ecoscore</div>
                    <div className="text-4xl font-extrabold text-forest mt-1">{Number(selectedCert.ecoscore).toFixed(2)}</div>
                    <Badge variant="outline" className={`mt-2 rounded-full border-transparent font-bold text-[10px] ${
                      Number(selectedCert.ecoscore) >= 0.66 ? "text-[#10b981] bg-[#10b981]/15" :
                      Number(selectedCert.ecoscore) >= 0.33 ? "text-[#f59e0b] bg-[#f59e0b]/15" :
                      "text-[#ef4444] bg-[#ef4444]/15"
                    }`}>
                      Rating: {
                        Number(selectedCert.ecoscore) >= 0.66 ? "High (Tinggi)" :
                        Number(selectedCert.ecoscore) >= 0.33 ? "Medium (Sedang)" :
                        "Low (Rendah)"
                      }
                    </Badge>
                  </div>
                  <div className="space-y-2.5 text-xs p-1 justify-center flex flex-col">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Environmental Score:</span>
                      <span className="font-bold text-forest">{Number(selectedCert.env_score).toFixed(2)} / 1.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Economic Score:</span>
                      <span className="font-bold text-honey">{Number(selectedCert.eco_score).toFixed(2)} / 1.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Social Score:</span>
                      <span className="font-bold text-chart-4">{Number(selectedCert.sos_score).toFixed(2)} / 1.00</span>
                    </div>
                  </div>
                </div>

                {/* Score Pillars breakdown */}
                <div className="space-y-5">
                  {/* Pilar 1 */}
                  <div className="space-y-3 p-4 border border-border/60 bg-card rounded-xl">
                    <h4 className="font-bold text-xs text-forest flex items-center gap-1.5 uppercase tracking-wider">
                      <Leaf className="h-4 w-4" /> Pillar 1: Environmental ({(Number(selectedCert.env_score)).toFixed(2)} / 1.00)
                    </h4>
                    
                    {/* Environmental Conditions */}
                    <div className="grid grid-cols-3 gap-2 bg-secondary/10 p-2.5 rounded-lg border border-border/40 text-[10px] text-muted-foreground mb-1">
                      <div>Temp: <span className="font-bold text-foreground">{Number(selectedCert.env_suhu || 25).toFixed(1)} °C</span></div>
                      <div>Humidity: <span className="font-bold text-foreground">{Number(selectedCert.env_rh || 70).toFixed(1)} %</span></div>
                      <div>Rainfall: <span className="font-bold text-foreground">{Number(selectedCert.env_curah_hujan || 30).toFixed(1)} mm/day</span></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>Climate Suitability: <span className="font-bold text-foreground">{Number(selectedCert.env_kesesuaian) === 1 ? "Suitable (1)" : "Unsuitable (0)"}</span></div>
                      <div>Processing Method: <span className="font-bold text-foreground">{Number(selectedCert.env_metode) === 1 ? "Honey/Natural (1)" : "Washed (0)"}</span></div>
                      <div>Clean Energy / Solar: <span className="font-bold text-foreground">{Number(selectedCert.env_energi) === 1 ? "Renewable (1)" : "Fossil (0)"}</span></div>
                      <div>Low Chemical Pesticide: <span className="font-bold text-foreground">{Number(selectedCert.env_pestisida) === 1 ? "Organic/None (1)" : "Chemicals (0)"}</span></div>
                      <div className="col-span-2">Conservation & Agroforestry: <span className="font-bold text-foreground">{Number(selectedCert.env_konservasi) === 1 ? "Agroforestry (1)" : "Monoculture (0)"}</span></div>
                    </div>
                  </div>

                  {/* Pilar 2 */}
                  <div className="space-y-3 p-4 border border-border/60 bg-card rounded-xl">
                    <h4 className="font-bold text-xs text-honey flex items-center gap-1.5 uppercase tracking-wider">
                      <Flame className="h-4 w-4" /> Pillar 2: Economic ({(Number(selectedCert.eco_score)).toFixed(2)} / 1.00)
                    </h4>
                    
                    {/* Raw Economic Parameters */}
                    <div className="grid grid-cols-3 gap-2 bg-secondary/10 p-2.5 rounded-lg border border-border/40 text-[10px] text-muted-foreground mb-1">
                      <div className="col-span-3">Income: <span className="font-bold text-foreground">Rp {Number(selectedCert.eco_pendapatan || 0).toLocaleString("id-ID")}/year</span></div>
                      <div>Acreage: <span className="font-bold text-foreground">{Number(selectedCert.eco_luas_lahan || 0).toFixed(1)} ha</span></div>
                      <div>Productivity: <span className="font-bold text-foreground">{Number(selectedCert.eco_produksi || 0).toFixed(1)} ton/ha/year</span></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>Quality / Cupping Grade: <span className="font-bold text-foreground">{Number(selectedCert.eco_kualitas) === 1 ? "Specialty/Grade 1 (1)" : "Low Grade (0)"}</span></div>
                      <div>Income Normalized: <span className="font-bold text-foreground">{Number(selectedCert.eco_pendapatan_norm).toFixed(2)}</span></div>
                      <div>Land Area Normalized: <span className="font-bold text-foreground">{Number(selectedCert.eco_luas_lahan_norm).toFixed(2)}</span></div>
                      <div>Productivity Normalized: <span className="font-bold text-foreground">{Number(selectedCert.eco_produksi_norm).toFixed(2)}</span></div>
                      <div className="col-span-2">KUR Access / Financial Credit: <span className="font-bold text-foreground">{Number(selectedCert.eco_kredit) === 1 ? "Has Access (1)" : "No Access (0)"}</span></div>
                    </div>
                  </div>

                  {/* Pilar 3 */}
                  <div className="space-y-3 p-4 border border-border/60 bg-card rounded-xl">
                    <h4 className="font-bold text-xs text-chart-4 flex items-center gap-1.5 uppercase tracking-wider">
                      <ShieldCheck className="h-4 w-4" /> Pillar 3: Social ({(Number(selectedCert.sos_score)).toFixed(2)} / 1.00)
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>Group Participation: <span className="font-bold text-foreground">{Number(selectedCert.sos_kelompok) === 1 ? "Active (1)" : "Inactive (0)"}</span></div>
                      <div>Gender Rights & Inclusion: <span className="font-bold text-foreground">{Number(selectedCert.sos_gender) === 1 ? "Equal (1)" : "Not Equal (0)"}</span></div>
                      <div>Worker Education & Safety: <span className="font-bold text-foreground">{Number(selectedCert.sos_pendidikan) === 1 ? "High School+ (1)" : "Primary School (0)"}</span></div>
                      <div>Mobile Phone Utility: <span className="font-bold text-foreground">{Number(selectedCert.sos_hp) === 1 ? "Has Access (1)" : "No Access (0)"}</span></div>
                      <div className="col-span-2">Internet Market Price Access: <span className="font-bold text-foreground">{Number(selectedCert.sos_internet) === 1 ? "Has Access (1)" : "No Access (0)"}</span></div>
                    </div>
                  </div>
                </div>

                {/* Feedback Input */}
                <div className="space-y-2 pt-4 border-t border-border/40">
                  <Label htmlFor="validator-feedback" className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-forest" />
                    Validator Feedback & Review (Required)
                  </Label>
                  <Textarea 
                    id="validator-feedback"
                    placeholder="Enter detailed farm evaluation, suggestions for sustainability improvements, or reasons for approval/rejection..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="min-h-[90px] border-border/80 focus-visible:ring-forest bg-secondary/10 rounded-xl text-xs"
                  />
                </div>

                {/* Real-time Audit Photo Proof */}
                <div className="space-y-2 pt-4 border-t border-border/40">
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
                    <div className="border-2 border-dashed border-border/80 hover:border-forest/60 bg-secondary/10 rounded-2xl p-6 text-center transition cursor-pointer relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment"
                        onChange={handlePhotoChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs font-bold text-foreground">Click to Take or Upload Proof Photo</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Camera will activate on mobile devices (Max 2MB)</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <DialogFooter className="bg-secondary/15 p-4 border-t border-border/40 flex justify-between gap-2 sm:justify-between">
                <Button 
                  onClick={() => setIsDialogOpen(false)} 
                  variant="ghost" 
                  className="text-muted-foreground hover:text-foreground"
                >
                  Close
                </Button>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleAction("rejected")} 
                    disabled={validateMutation.isPending}
                    variant="outline" 
                    className="border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive rounded-xl font-bold"
                  >
                    <X className="mr-1.5 h-4 w-4" /> Reject Application
                  </Button>
                  <Button 
                    onClick={() => handleAction("approved")} 
                    disabled={validateMutation.isPending}
                    className="bg-forest text-cream hover:bg-forest-deep rounded-xl font-bold"
                  >
                    <Check className="mr-1.5 h-4 w-4" /> Approve & Release
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
