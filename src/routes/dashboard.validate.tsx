import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getPendingCertifications } from "@/lib/auth-server";
import { toast } from "sonner";
import {
  ShieldCheck,
  Award,
  ClipboardCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Image,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard/validate")({
  head: () => ({
    meta: [
      { title: "Validation Portal — TerraBrew" },
      {
        name: "description",
        content: "SEA Validator interface for Specialty Coffee Certifications.",
      },
    ],
  }),
  component: ValidatePortal,
});

function ValidatePortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"jurisdiction" | "all">("jurisdiction");
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Fetch pending certifications
  const { data: pendingList, isLoading: isPendingLoading } = useQuery({
    queryKey: ["certificationsList", user?.id, viewMode, "pending"],
    queryFn: () =>
      getPendingCertifications({
        data: { validatorId: user!.id, allRegions: viewMode === "all", status: "pending" },
      }),
    enabled: !!user && user.role === "sea",
  });

  // Fetch approved certifications
  const { data: approvedList, isLoading: isApprovedLoading } = useQuery({
    queryKey: ["certificationsList", user?.id, viewMode, "approved"],
    queryFn: () =>
      getPendingCertifications({
        data: { validatorId: user!.id, allRegions: viewMode === "all", status: "approved" },
      }),
    enabled: !!user && user.role === "sea",
  });

  // Fetch rejected certifications
  const { data: rejectedList, isLoading: isRejectedLoading } = useQuery({
    queryKey: ["certificationsList", user?.id, viewMode, "rejected"],
    queryFn: () =>
      getPendingCertifications({
        data: { validatorId: user!.id, allRegions: viewMode === "all", status: "rejected" },
      }),
    enabled: !!user && user.role === "sea",
  });

  if (!user || user.role !== "sea") {
    return (
      <div className="flex min-h-100 flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h3 className="text-lg font-bold text-foreground">Access Denied</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          This portal is strictly accessible by verified **SEA Validator** accounts.
        </p>
      </div>
    );
  }

  const currentList =
    statusFilter === "pending"
      ? pendingList
      : statusFilter === "approved"
        ? approvedList
        : rejectedList;

  const isLoading =
    statusFilter === "pending"
      ? isPendingLoading
      : statusFilter === "approved"
        ? isApprovedLoading
        : isRejectedLoading;

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
            Review farmers' self-reported sustainability metrics, check indicator scores across the
            3 pillars, provide feedback, and issue official certificates.
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

      {/* Sub Header Navigation & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* View Mode Tabs */}
        <div className="flex gap-2 p-1 bg-secondary/25 rounded-2xl max-w-md border border-border/40 shadow-sm">
          <button
            onClick={() => setViewMode("jurisdiction")}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all focus:outline-none ${
              viewMode === "jurisdiction"
                ? "bg-forest text-cream shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            My Jurisdiction ({user?.region || "Local"})
          </button>
          <button
            onClick={() => setViewMode("all")}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all focus:outline-none ${
              viewMode === "all"
                ? "bg-forest text-cream shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Jurisdictions (Global)
          </button>
        </div>

        {/* Status Filters */}
        <div className="flex gap-1 bg-secondary/15 p-1 rounded-2xl border border-border/30 shadow-sm">
          <button
            onClick={() => setStatusFilter("pending")}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
              statusFilter === "pending"
                ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Pending
            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-amber-500/20 rounded-full font-extrabold text-amber-700">
              {pendingList?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter("approved")}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
              statusFilter === "approved"
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approved
            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-emerald-500/20 rounded-full font-extrabold text-emerald-700">
              {approvedList?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter("rejected")}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
              statusFilter === "rejected"
                ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <XCircle className="h-3.5 w-3.5" />
            Rejected
            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-rose-500/20 rounded-full font-extrabold text-rose-700">
              {rejectedList?.length || 0}
            </span>
          </button>
        </div>
      </div>

      <Card className="rounded-2xl border-border shadow-(--shadow-soft) overflow-hidden">
        <CardHeader>
          <CardTitle className="text-primary font-bold flex items-center gap-2">
            {statusFilter === "pending" && <Clock className="h-5 w-5 text-amber-500" />}
            {statusFilter === "approved" && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
            {statusFilter === "rejected" && <XCircle className="h-5 w-5 text-rose-500" />}
            {statusFilter === "pending" && "Applications Pending Validation"}
            {statusFilter === "approved" && "Approved Certificates"}
            {statusFilter === "rejected" && "Rejected Applications"}
          </CardTitle>
          <CardDescription>
            {statusFilter === "pending" &&
              `There are ${pendingList?.length || 0} applications awaiting audit review.`}
            {statusFilter === "approved" &&
              `You have approved ${approvedList?.length || 0} specialty coffee certifications.`}
            {statusFilter === "rejected" &&
              `There are ${rejectedList?.length || 0} rejected applications.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading certification requests...
            </div>
          ) : currentList && currentList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border bg-secondary/15 px-6">
                    <th className="py-3 px-6">Coffee Farmer</th>
                    <th className="py-3 px-6">Farm Name & Variety</th>
                    <th className="py-3 px-6 text-center">Ecoscore</th>
                    <th className="py-3 px-6">Submission Date</th>
                    {statusFilter !== "pending" && <th className="py-3 px-6">Feedback / Reason</th>}
                    {statusFilter === "approved" && (
                      <th className="py-3 px-6 text-center">Audit Photo</th>
                    )}
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentList.map((c: any) => (
                    <tr
                      key={c.id}
                      className="border-t border-border/60 hover:bg-secondary/10 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="font-bold text-foreground">{c.farmer_name}</div>
                        <div className="text-muted-foreground text-[10px]">{c.farmer_email}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-foreground">{c.farm_name}</div>
                        <div className="text-muted-foreground text-xs">{c.coffee_variety}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Badge
                          className={`font-extrabold rounded-full px-2.5 py-0.5 text-xs ${
                            statusFilter === "pending"
                              ? "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20"
                              : statusFilter === "approved"
                                ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
                                : "bg-rose-500/10 text-rose-700 hover:bg-rose-500/20"
                          }`}
                        >
                          {Number(c.ecoscore).toFixed(2)}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground text-xs">
                        {new Date(c.created_at).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      {statusFilter !== "pending" && (
                        <td className="py-4 px-6 max-w-xs text-xs text-muted-foreground">
                          <p className="line-clamp-2 italic" title={c.validator_feedback}>
                            "{c.validator_feedback || "No feedback provided."}"
                          </p>
                        </td>
                      )}
                      {statusFilter === "approved" && (
                        <td className="py-4 px-6 text-center">
                          {c.validator_photo ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-forest hover:bg-forest/10 rounded-lg"
                                >
                                  <Image className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md rounded-2xl">
                                <DialogHeader>
                                  <DialogTitle className="text-sm font-bold">
                                    On-Site Audit Proof
                                  </DialogTitle>
                                  <DialogDescription>
                                    Submitted proof for {c.farm_name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="mt-2 rounded-xl overflow-hidden border border-border aspect-video">
                                  <img
                                    src={c.validator_photo}
                                    alt="Audit Proof"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">None</span>
                          )}
                        </td>
                      )}
                      <td className="py-4 px-6 text-right">
                        {statusFilter === "pending" ? (
                          <Button
                            onClick={() => navigate({ to: `/dashboard/review` })}
                            size="sm"
                            className="bg-forest text-cream hover:bg-forest-deep rounded-lg font-bold text-xs"
                          >
                            <ClipboardCheck className="mr-1 h-3.5 w-3.5" /> Review Audit
                          </Button>
                        ) : (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-border hover:bg-secondary/20 rounded-lg font-bold text-xs"
                              >
                                <Eye className="mr-1 h-3.5 w-3.5" /> Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg rounded-2xl">
                              <DialogHeader>
                                <DialogTitle className="text-base font-bold text-primary flex items-center gap-1.5">
                                  <Award className="h-5 w-5 text-forest animate-pulse" />
                                  Audit Details & Decision
                                </DialogTitle>
                                <DialogDescription>
                                  Finalized audit for {c.farm_name} ({c.farmer_name})
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 text-xs mt-2">
                                <div className="grid grid-cols-2 gap-4 p-3 bg-secondary/15 rounded-xl border border-border/40">
                                  <div>
                                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                                      Status
                                    </span>
                                    <Badge
                                      className={`font-extrabold rounded-full px-2.5 py-0.5 mt-1 text-xs ${
                                        statusFilter === "approved"
                                          ? "bg-emerald-500/10 text-emerald-700"
                                          : "bg-rose-500/10 text-rose-700"
                                      }`}
                                    >
                                      {c.status.toUpperCase()}
                                    </Badge>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                                      Ecoscore
                                    </span>
                                    <span className="text-base font-extrabold text-forest mt-1 block">
                                      {Number(c.ecoscore).toFixed(2)}
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                                    Feedback / Audit Comments
                                  </span>
                                  <div className="bg-secondary/10 border border-border/40 p-3 rounded-xl italic text-foreground whitespace-pre-line">
                                    "{c.validator_feedback || "No feedback details provided."}"
                                  </div>
                                </div>

                                {c.validator_photo && (
                                  <div className="space-y-1">
                                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                                      Audit Proof Photo
                                    </span>
                                    <div className="rounded-xl overflow-hidden border border-border aspect-video max-w-sm mt-1 mx-auto">
                                      <img
                                        src={c.validator_photo}
                                        alt="Audit Proof"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground font-semibold">
              {statusFilter === "pending" &&
                "No certification requests are pending validation at this time."}
              {statusFilter === "approved" && "No approved certificates found."}
              {statusFilter === "rejected" && "No rejected applications found."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
