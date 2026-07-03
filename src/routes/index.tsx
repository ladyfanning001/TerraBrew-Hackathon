import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Coffee,
  Leaf,
  Droplets,
  CloudSun,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  LineChart,
  BookOpen,
  Scale,
  Award,
  LogOut,
  User,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import heroImg from "@/assets/hero-coffee.jpg";
import logoImg from "@/assets/Logo TerraBrew.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TerraBrew — Sustainable Coffee Post-Harvest Decision Support" },
      {
        name: "description",
        content:
          "Eco-friendly technology helping smallholders optimize coffee quality, reduce water waste, and manage climate risk.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden bg-background border border-border/40">
              <img src={logoImg} className="h-7 w-7 object-contain" alt="TerraBrew Logo" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight text-foreground">TerraBrew</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Sustainable Coffee
              </div>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#about" className="text-muted-foreground hover:text-foreground transition">
              About
            </a>
            <a
              href="#why-terrabrew"
              className="text-muted-foreground hover:text-foreground transition"
            >
              Why TerraBrew
            </a>
            <a href="#methods" className="text-muted-foreground hover:text-foreground transition">
              Methods
            </a>
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="hidden sm:inline-flex text-muted-foreground hover:text-foreground"
                >
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/80 hover:bg-secondary border border-border focus:outline-none transition shrink-0">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {user.full_name
                            ? user.full_name
                                .split(" ")
                                .map((w: string) => w[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)
                            : "US"}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 rounded-xl p-1.5 shadow-md bg-card border-border"
                  >
                    <DropdownMenuLabel className="px-2 py-1.5 text-xs text-muted-foreground font-semibold">
                      Signed in as
                      <div className="text-sm font-bold text-foreground truncate mt-0.5">
                        {user.full_name}
                      </div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-accent truncate mt-0.5">
                        {user.role === "farmer" ? "Petani (Farmer)" : "SEA Validator"}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-1 border-border/40" />
                    <DropdownMenuItem
                      asChild
                      className="rounded-lg py-2 cursor-pointer focus:bg-secondary/60"
                    >
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-2 text-sm w-full font-medium"
                      >
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={logout}
                      className="rounded-lg py-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive flex items-center gap-2 text-sm font-medium"
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" className="hidden sm:inline-flex">
                  <Link to="/dashboard">Sign in</Link>
                </Button>
                <Button
                  asChild
                  className="bg-coffee text-primary-foreground hover:bg-coffee-deep rounded-full px-5"
                >
                  <Link to="/dashboard">Find Coffee Process</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_20%,rgba(39,67,43,0.1),transparent_50%),radial-gradient(circle_at_80%_60%,rgba(66,48,44,0.12),transparent_55%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-2 md:py-28 md:items-center">
          <div>
            <Badge
              variant="secondary"
              className="mb-5 gap-1.5 rounded-full border border-forest/20 bg-forest/10 text-forest"
            >
              <Sparkles className="h-3 w-3 animate-spin" style={{ animationDuration: "3s" }} />
              AI for sustainable coffee post-harvesting
            </Badge>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl text-primary">
              Empowering Coffee Farmers, <span className="text-accent">Sustainably.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              TerraBrew helps Indonesian smallholder farmers select the most sustainable coffee
              preprocessing method — Washed, Semi-Washed, Honey, Wine, or Natural — by analyzing
              real-time local weather, water availability, and crop characteristics.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-forest text-cream shadow-md hover:bg-forest-deep px-7"
              >
                <Link to="/dashboard">
                  Find Best Process <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-coffee/30 bg-background/60 px-7 text-foreground hover:bg-background"
              >
                <Link to="/dashboard/learn">
                  <BookOpen className="mr-2 h-4 w-4" /> Learn Processing Methods
                </Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-muted-foreground">
              {[
                { icon: Leaf, label: "Eco-optimized scoring" },
                { icon: Droplets, label: "Water-footprint awareness" },
                { icon: CloudSun, label: "Weather-adaptive logic" },
                { icon: ShieldCheck, label: "Scientific journal rules" },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2">
                  <b.icon className="h-4 w-4 text-forest" />
                  {b.label}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div
              className="absolute -inset-6 rounded-[2rem] opacity-30 blur-2xl"
              style={{ background: "var(--gradient-eco)" }}
            />
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-[var(--shadow-elegant)]">
              <img
                src={heroImg}
                alt="Indonesian coffee drying on raised beds"
                width={1536}
                height={1024}
                className="h-full w-full object-cover max-h-[400px]"
              />
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                <div className="flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur text-foreground border border-border">
                  <span className="h-2 w-2 rounded-full bg-forest animate-ping" /> Recommended:
                  Honey Process
                </div>
                <div className="flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur text-foreground border border-border">
                  <Droplets className="h-3 w-3 text-chart-4" /> 80% water saved
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About TerraBrew */}
      <section id="about" className="py-24 border-t border-border bg-card">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <Badge
              variant="outline"
              className="rounded-full border-forest/30 text-forest px-3 py-1"
            >
              About TerraBrew
            </Badge>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl text-primary">
              Connecting Agronomy with Sustainable Decision Support
            </h2>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              TerraBrew is an interactive dashboard tailored for coffee processors and farmers in
              regions like Aceh Gayo, Toraja, Kintamani, and Ijen. By modeling post-harvest
              variables using agronomical journal thresholds, TerraBrew reduces quality defects and
              optimizes water footprints.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="p-6 rounded-2xl bg-background border border-border">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-forest/10 text-forest mb-4">
                <CloudSun className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">Climate Adaptation</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Weather inputs like Relative Humidity (RH), rainfall, and drying temperature
                determine drying rates and mold risks. TerraBrew prevents costly harvest losses.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-background border border-border">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-coffee/10 text-coffee mb-4">
                <Droplets className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">Water Conservation</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Coffee washing is one of the most water-heavy agricultural processes. We help
                farmers pivot to low-water methods (Honey, Wine, Natural) when water resources are
                strained.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-background border border-border">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-honey/10 text-honey mb-4">
                <Scale className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">Chemical Consistency</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                We integrate journal metrics including pH profiles, ester volatiles, lactic acids,
                and residual sugars to match fermentation targets with high-value specialty
                profiles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why TerraBrew Section */}
      <section id="why-terrabrew" className="py-24 border-y border-border bg-background">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <Badge variant="secondary" className="rounded-full bg-forest/10 text-forest">
                Why TerraBrew?
              </Badge>
              <h2 className="mt-4 text-3xl font-bold md:text-4xl text-primary">
                A Smarter Post-Harvest Pathway for Indonesian Coffee
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Traditional coffee processing relies heavily on intuition, leaving harvests
                vulnerable to sudden changes in rain, humidity, or water shortage. TerraBrew bridges
                the gap:
              </p>

              <ul className="mt-6 space-y-4">
                <li className="flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-forest/20 text-forest flex items-center justify-center shrink-0 mt-1">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <strong className="text-foreground">Reduce Mold and Defects:</strong> Instant
                    warnings if relative humidity exceeds 70% or if rainfall hampers critical drying
                    phases.
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-forest/20 text-forest flex items-center justify-center shrink-0 mt-1">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <strong className="text-foreground">Water-Aware Recommendations:</strong>{" "}
                    Automatically steers farmers toward natural or honey processing when water
                    availability drops below 40%.
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-forest/20 text-forest flex items-center justify-center shrink-0 mt-1">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <strong className="text-foreground">Maximize Specialty Potential:</strong>{" "}
                    Pre-fill and simulate weather data using datasets like NASA EarthData and Open
                    Weather indexes to secure premium grades.
                  </div>
                </li>
              </ul>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                <div className="text-3xl font-bold text-accent">80%</div>
                <div className="mt-1 font-semibold text-foreground">Water Consumption Savings</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  By substituting standard Washed processing with Honey or Natural processing.
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                <div className="text-3xl font-bold text-forest">11-12%</div>
                <div className="mt-1 font-semibold text-foreground">Ideal Moisture Lock</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Keeps green coffee beans perfectly stable and completely mold-resistant during
                  storage.
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                <div className="text-3xl font-bold text-honey">Specialty</div>
                <div className="mt-1 font-semibold text-foreground">Sensory Consistency</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Aides in targeting optimal pH fermentation stages (&lt;4.0) to lock in ester and
                  fruity profiles.
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                <div className="text-3xl font-bold text-primary">Real-Time</div>
                <div className="mt-1 font-semibold text-foreground">Climate API Sync</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Supports instant location pre-filling based on Copernicus and satellite indexes.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Methods Section */}
      <section id="methods" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="rounded-full border-coffee/30 text-coffee">
            Processing methods
          </Badge>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl text-primary">
            5 Core Preprocessing Methods Supported
          </h2>
          <p className="mt-3 text-muted-foreground">
            Our smart indicator model balances flavor, water usage, and physical risks for each
            method.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {[
            {
              name: "Washed",
              color: "var(--chart-4)",
              flavor: "Clean, bright acidity",
              water: "5–40 L/kg",
              risk: "Low drying risk if clean",
            },
            {
              name: "Semi Washed",
              color: "var(--forest)",
              flavor: "Balanced body, mild acidity",
              water: "1–10 L/kg",
              risk: "Moderate drying risk",
            },
            {
              name: "Honey",
              color: "var(--honey)",
              flavor: "High sweetness, fruity notes",
              water: "0.5–5 L/kg",
              risk: "Sticky mucilage mold risk",
            },
            {
              name: "Wine Process",
              color: "var(--chart-5)",
              flavor: "Boozy, tropical fruit, tropical acidity",
              water: "Low (&lt;2 L/kg)",
              risk: "Over-fermentation risk",
            },
            {
              name: "Natural",
              color: "var(--coffee)",
              flavor: "Intense fruitiness, heavy body",
              water: "Very Low (&lt;1 L/kg)",
              risk: "Extreme mold risk if RH &gt;70%",
            },
          ].map((m) => (
            <div
              key={m.name}
              className="group rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
            >
              <div className="h-2 w-12 rounded-full" style={{ background: m.color }} />
              <h3 className="mt-4 text-lg font-bold text-foreground">{m.name}</h3>
              <p className="mt-1.5 text-xs text-muted-foreground font-semibold">{m.flavor}</p>
              <div className="mt-4 pt-3 border-t border-border/60 text-[11px] text-muted-foreground space-y-1">
                <div>
                  💧 Water: <span className="font-semibold text-foreground">{m.water}</span>
                </div>
                <div>
                  ⚠️ Risk: <span className="font-semibold text-foreground">{m.risk}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Certification (Pro) Section */}
      <section className="mx-auto max-w-7xl px-6 py-12 border-t border-border">
        <div className="bg-gradient-to-br from-cream/20 via-background to-forest/5 rounded-3xl border border-forest/10 p-8 md:p-12 shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <Badge className="bg-honey text-cream rounded-full px-3 py-1 font-bold text-xs uppercase tracking-wider mb-2">
                PRO FEATURE
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-primary">
                Specialty Coffee & Sustainability Certification
              </h2>
              <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
                Elevate your coffee's value in global markets by conducting self-assessments and
                validating Specialty Coffee standards with SEA (Eco-Agribusiness Certification)
                auditors.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="rounded-full bg-forest text-cream hover:bg-forest-deep px-6 font-bold shadow-md"
            >
              <Link to="/dashboard/certification">Apply for Certification</Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <div className="p-6 rounded-2xl bg-card border border-border/80">
              <div className="h-9 w-9 rounded-xl bg-forest/10 flex items-center justify-center text-forest font-bold mb-3">
                1
              </div>
              <h3 className="font-bold text-foreground">Environmental Score</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Assess climate suitability, processing water efficiency, clean energy usage, organic
                pesticide control, and soil conservation methods.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/80">
              <div className="h-9 w-9 rounded-xl bg-chart-4/10 flex items-center justify-center text-chart-4 font-bold mb-3">
                2
              </div>
              <h3 className="font-bold text-foreground">Economic Score</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Measure coffee bean physical/cupping quality, stabilized income, sustainably-managed
                farm land, productivity yield, and credit access.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/80">
              <div className="h-9 w-9 rounded-xl bg-honey/10 flex items-center justify-center text-honey font-bold mb-3">
                3
              </div>
              <h3 className="font-bold text-foreground">Social Score</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Evaluate cooperative/group participation, gender equity indexes, worker safety
                training/education, smartphone utility, and market price access.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-tr from-coffee to-coffee-deep text-cream border-transparent">
              <div className="h-9 w-9 rounded-xl bg-cream/15 flex items-center justify-center text-cream font-bold mb-3">
                ✓
              </div>
              <h3 className="font-bold text-cream">SEA Verification</h3>
              <p className="text-xs text-cream/70 mt-2 leading-relaxed">
                Submitted certification applications are reviewed directly by official SEA
                validators to issue authorized stamps and certificates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 pb-24">
        <div
          className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl p-10 text-cream md:p-16"
          style={{ background: "var(--gradient-primary)" }}
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-forest/30 blur-3xl" />
          <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-3xl font-bold md:text-4xl text-cream">
                Ready to Process Smarter?
              </h2>
              <p className="mt-4 max-w-lg text-cream/80 leading-relaxed">
                Connect your farm variables, test environment parameters against historical
                journals, and lock in your specialty coffee profits.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-cream text-coffee-deep hover:bg-cream/90 px-6 font-semibold shadow-sm"
              >
                <Link to="/dashboard">Find Best Coffee Process</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-cream/40 bg-transparent text-cream hover:bg-cream/10 px-6"
              >
                <Link to="/dashboard/learn">Browse Methods Wiki</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Coffee className="h-4 w-4 text-forest" />
            <span>
              © {new Date().getFullYear()} TerraBrew. Bridging coffee agronomy and smallholder
              sustainability.
            </span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">
              Databases
            </a>
            <a href="#" className="hover:text-foreground">
              Research Sources
            </a>
            <a href="#" className="hover:text-foreground">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
