import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Coffee, Key, Mail, User, AlertCircle, ArrowRight, Building, CheckCircle, Globe, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — TerraBrew" },
      { name: "description", content: "Create an account on TerraBrew for post-harvest optimization and certification." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { register, user, isLoading } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<"farmer" | "sea">("farmer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [farmName, setFarmName] = useState("");
  const [organization, setOrganization] = useState("");
  const [country, setCountry] = useState("Indonesia");
  const [region, setRegion] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate({ to: "/dashboard" });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName || !email || !password || !country || !region) {
      setError("All fields are required.");
      return;
    }

    if (role === "farmer" && !farmName) {
      setError("Farm / cooperative name is required.");
      return;
    }

    if (role === "sea" && !organization) {
      setError("Validator organization / agency name is required.");
      return;
    }

    const payload = {
      fullName,
      email,
      password,
      role,
      farmName: role === "farmer" ? farmName : undefined,
      organization: role === "sea" ? organization : undefined,
      country,
      region,
    };

    const res = await register(payload);
    if (!res.success) {
      setError(res.error || "Registration failed. Please try a different email.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, var(--cream) 0%, transparent 70%)" }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] rounded-full opacity-25 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, rgba(39, 67, 43, 0.15) 0%, transparent 70%)" }} />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-cream" style={{ background: "var(--gradient-eco)" }}>
              <Coffee className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">TerraBrew</span>
          </Link>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Create a New Account</h2>
          <p className="text-sm text-muted-foreground mt-1">Join the sustainable specialty coffee ecosystem.</p>
        </div>

        <Card className="border-border/60 shadow-[var(--shadow-elegant)] rounded-3xl overflow-hidden bg-card/90 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold text-foreground">Sign Up</CardTitle>
            <CardDescription>Select your account type and fill in your details.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex gap-2 items-center text-xs text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20 animate-shake">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="font-semibold">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="font-bold text-xs text-foreground/80">ACCOUNT TYPE</Label>
                <Tabs value={role} onValueChange={(val) => setRole(val as any)} className="w-full">
                  <TabsList className="grid grid-cols-2 bg-secondary/30 rounded-xl p-1 h-11 border border-border/40">
                    <TabsTrigger value="farmer" className="rounded-lg text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-forest data-[state=active]:shadow-sm">
                      Coffee Farmer
                    </TabsTrigger>
                    <TabsTrigger value="sea" className="rounded-lg text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-honey data-[state=active]:shadow-sm">
                      SEA Validator
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="font-bold text-xs text-foreground/80">FULL NAME</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Your Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 bg-secondary/30 border-border/80 focus-visible:bg-background rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-bold text-xs text-foreground/80">EMAIL ADDRESS</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-secondary/30 border-border/80 focus-visible:bg-background rounded-xl"
                  />
                </div>
              </div>

              {role === "farmer" ? (
                <div className="space-y-2">
                  <Label htmlFor="farmName" className="font-bold text-xs text-foreground/80">FARM NAME / COOPERATIVE</Label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="farmName"
                      type="text"
                      placeholder="e.g. Gayo Organic Cooperative"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      className="pl-10 bg-secondary/30 border-border/80 focus-visible:bg-background rounded-xl"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="organization" className="font-bold text-xs text-foreground/80">VALIDATOR INSTITUTION / AGENCY</Label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="organization"
                      type="text"
                      placeholder="e.g. Sucofindo / Specialty Coffee Association"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="pl-10 bg-secondary/30 border-border/80 focus-visible:bg-background rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country" className="font-bold text-xs text-foreground/80">COUNTRY</Label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="country"
                      type="text"
                      placeholder="e.g. Indonesia"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="pl-10 bg-secondary/30 border-border/80 focus-visible:bg-background rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region" className="font-bold text-xs text-foreground/80">REGION / PROVINCE</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="region"
                      type="text"
                      placeholder="e.g. Aceh"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="pl-10 bg-secondary/30 border-border/80 focus-visible:bg-background rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-bold text-xs text-foreground/80">NEW PASSWORD</Label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-secondary/30 border-border/80 focus-visible:bg-background rounded-xl"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-forest text-cream hover:bg-forest-deep rounded-xl h-11 font-bold mt-2 shadow-sm transition"
              >
                {isLoading ? "Processing..." : "Register Account"}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-center gap-1 border-t border-border/60 bg-secondary/15 py-4">
            <span className="text-xs text-muted-foreground">Already have an account?</span>
            <Link to="/login" className="text-xs font-bold text-forest hover:text-forest-deep underline">
              Login Now
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
