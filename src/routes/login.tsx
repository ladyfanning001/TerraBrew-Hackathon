import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Coffee, Key, Mail, User, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import logoImg from "@/assets/Logo TerraBrew.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — TerraBrew" },
      {
        name: "description",
        content:
          "Sign in to your TerraBrew account to access coffee predictions and certifications.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (user.role === "sea") {
        navigate({ to: "/dashboard/validate" });
      } else {
        navigate({ to: "/dashboard" });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || "Failed to sign in. Please verify your credentials.");
    }
  };

  const handleQuickLogin = async (role: "farmer" | "sea") => {
    setError(null);
    const testEmail = role === "farmer" ? "petani@terrabrew.com" : "sea@terrabrew.com";
    const testPassword = "password";

    setEmail(testEmail);
    setPassword(testPassword);

    const res = await login(testEmail, testPassword);
    if (!res.success) {
      setError(res.error || "Failed to sign in with demo credentials.");
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden"
      style={{ background: "var(--gradient-hero)" }}
    >
      {/* Background blobs */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--cream) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(39, 67, 43, 0.15) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl overflow-hidden bg-background border border-border/40">
              <img src={logoImg} className="h-8 w-8 object-contain" alt="TerraBrew Logo" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">TerraBrew</span>
          </Link>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Welcome Back</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Optimize coffee processing & manage sustainable certifications.
          </p>
        </div>

        <Card className="border-border/60 shadow-[var(--shadow-elegant)] rounded-3xl overflow-hidden bg-card/90 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold text-foreground">Sign In</CardTitle>
            <CardDescription>
              Enter your email and password to access your dashboard.
            </CardDescription>
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
                <Label htmlFor="email" className="font-bold text-xs text-foreground/80">
                  EMAIL ADDRESS
                </Label>
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="font-bold text-xs text-foreground/80">
                    PASSWORD
                  </Label>
                </div>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
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
                {isLoading ? "Signing in..." : "Sign In"}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground font-bold text-[10px] tracking-wider">
                  DEMO QUICK LOGINS
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleQuickLogin("farmer")}
                className="border-border hover:bg-secondary/40 text-xs font-semibold rounded-xl"
              >
                <User className="mr-1.5 h-3.5 w-3.5 text-forest" />
                As Farmer
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickLogin("sea")}
                className="border-border hover:bg-secondary/40 text-xs font-semibold rounded-xl"
              >
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-honey" />
                As SEA Validator
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-center gap-1 border-t border-border/60 bg-secondary/15 py-4">
            <span className="text-xs text-muted-foreground">Don't have an account?</span>
            <Link
              to="/register"
              className="text-xs font-bold text-forest hover:text-forest-deep underline"
            >
              Register Now
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
