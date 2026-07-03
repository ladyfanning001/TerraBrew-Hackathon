import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BookOpen, Droplets, Sun, Award, CloudRain, Coffee } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard/learn")({
  head: () => ({
    meta: [
      { title: "Learning Center — TerraBrew" },
      {
        name: "description",
        content:
          "Educational guides on coffee processing methods, sustainability, and climate adaptation.",
      },
    ],
  }),
  component: LearnPage,
});

const lessons = [
  {
    icon: Droplets,
    tag: "Method",
    title: "Washed Process Dynamics",
    desc: "Deep dive into clean cups, bright acidity, and managing wastewater runoff.",
    color: "var(--chart-4)",
  },
  {
    icon: Coffee,
    tag: "Method",
    title: "Semi-Washed Processing",
    desc: "How wet hulling/Giling Basah works to create low-acidity, heavy-bodied profiles.",
    color: "var(--forest)",
  },
  {
    icon: Sun,
    tag: "Method",
    title: "Honey Processing Guide",
    desc: "Retaining partial mucilage on raised drying beds to maximize sweetness.",
    color: "var(--honey)",
  },
  {
    icon: Award,
    tag: "Method",
    title: "Mastering Wine Process",
    desc: "Unlocking boozy, complex notes through extended anaerobic whole-cherry fermentations.",
    color: "var(--chart-5)",
  },
  {
    icon: Coffee,
    tag: "Method",
    title: "Classic Natural Processing",
    desc: "Drying intact cherries with minimal water input in dry, hot conditions.",
    color: "var(--coffee)",
  },
  {
    icon: CloudRain,
    tag: "Climate",
    title: "Managing High Humidity Risks",
    desc: "How relative humidity above 70% affects drying rates and how to handle ventilation.",
    color: "var(--chart-4)",
  },
];

const articleContent: Record<string, React.ReactNode> = {
  "Washed Process Dynamics": (
    <div className="space-y-4 text-sm text-foreground/95">
      <p>
        The <strong>Washed Process</strong> (or Wet Process) is highly regarded for producing
        coffees with a clean profile, bright acidity, and high clarity. By removing the skin and
        pulp and washing off all sticky mucilage before drying, this method allows the true origin
        flavors of the coffee bean to shine.
      </p>
      <div className="bg-muted/40 border border-border/60 p-4 rounded-2xl space-y-2">
        <h4 className="font-bold text-primary text-xs uppercase tracking-wider">Key Steps</h4>
        <ul className="list-disc pl-5 space-y-1 text-xs">
          <li>
            <strong>Pulping:</strong> Mechanical removal of the cherry skin.
          </li>
          <li>
            <strong>Fermentation:</strong> Beans are soaked in water for 12 to 36 hours. Microbes
            break down the mucilage.
          </li>
          <li>
            <strong>Washing:</strong> Thorough rinsing to wash away any remaining sugars and
            residues.
          </li>
          <li>
            <strong>Drying:</strong> Beans dry on raised beds or patios to 10-12% moisture.
          </li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold text-primary">Agronomic Advantages & Risks</h4>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          While washed processing yields highly uniform quality and decreases mold risk, it consumes
          substantial water. Managing wastewater runoff via organic treatment ponds is essential to
          protect local watersheds.
        </p>
      </div>
    </div>
  ),
  "Semi-Washed Processing": (
    <div className="space-y-4 text-sm text-foreground/95">
      <p>
        <strong>Semi-Washed Processing</strong> (known locally in Indonesia as <em>Giling Basah</em>{" "}
        or Wet Hulling) is a unique regional method. It produces heavy-bodied, low-acidity coffees
        with rustic, earthy, herbal, and spicy flavor notes.
      </p>
      <div className="bg-muted/40 border border-border/60 p-4 rounded-2xl space-y-2">
        <h4 className="font-bold text-primary text-xs uppercase tracking-wider">Key Steps</h4>
        <ul className="list-disc pl-5 space-y-1 text-xs">
          <li>
            <strong>Pulping:</strong> Skin is removed, but mucilage remains on the beans.
          </li>
          <li>
            <strong>Short Fermentation:</strong> Beans ferment overnight in bags or piles.
          </li>
          <li>
            <strong>Partial Drying:</strong> Moisture is brought down to about 30% to 35% on patios.
          </li>
          <li>
            <strong>Wet Hulling:</strong> The parchment layer is mechanically hulled while still
            soft.
          </li>
          <li>
            <strong>Final Drying:</strong> Exposed green beans are dried directly down to 12%
            moisture.
          </li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold text-primary">Agronomic Advantages & Risks</h4>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          This process is great for humid climates because hulling the parchment allows beans to dry
          much faster. However, hulling wet beans carries a higher risk of physical bean damage
          (crushing, discoloration) and fungal issues if not handled carefully.
        </p>
      </div>
    </div>
  ),
  "Honey Processing Guide": (
    <div className="space-y-4 text-sm text-foreground/95">
      <p>
        The <strong>Honey Process</strong> bridges the gap between Washed and Natural methods. The
        coffee cherry skin is removed, but the sticky mucilage (often called "honey") is left on the
        parchment to dry. This infuses the coffee with intense sweetness and a rounded acidity.
      </p>
      <div className="bg-muted/40 border border-border/60 p-4 rounded-2xl space-y-2">
        <h4 className="font-bold text-primary text-xs uppercase tracking-wider">
          Honey Classifications
        </h4>
        <ul className="list-disc pl-5 space-y-1 text-xs">
          <li>
            <strong>White & Yellow Honey:</strong> Low mucilage retention. Dries quickly, yielding
            crisp sweetness.
          </li>
          <li>
            <strong>Red Honey:</strong> Moderate mucilage retention. Slower drying, resulting in a
            balanced, berry-like acidity.
          </li>
          <li>
            <strong>Black Honey:</strong> Maximum mucilage retention. Slipped under shade screens to
            dry very slowly, yielding high body, boozy notes, and complex sweetness.
          </li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold text-primary">Agronomic Advantages & Risks</h4>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Honey processing conserves water compared to washed coffees. However, sticky beans on beds
          are highly prone to clumping, insect damage, and mold if not raked frequently.
        </p>
      </div>
    </div>
  ),
  "Mastering Wine Process": (
    <div className="space-y-4 text-sm text-foreground/95">
      <p>
        The <strong>Wine Process</strong> uses extended anaerobic (oxygen-free) whole-cherry
        fermentation to trigger unique microbial pathways. This leads to a highly complex, boozy,
        wine-like profile with intense notes of dark berries, tropical fruits, and molasses.
      </p>
      <div className="bg-muted/40 border border-border/60 p-4 rounded-2xl space-y-2">
        <h4 className="font-bold text-primary text-xs uppercase tracking-wider">Key Steps</h4>
        <ul className="list-disc pl-5 space-y-1 text-xs">
          <li>
            <strong>Selection:</strong> Only highly ripe cherries with high sugar content (high Brix
            levels) are selected.
          </li>
          <li>
            <strong>Anaerobic Fermentation:</strong> Whole cherries are sealed in airtight barrels
            or bags for 10 to 30 days. Temperature and pH levels are closely monitored.
          </li>
          <li>
            <strong>Slow Drying:</strong> The fermented whole cherries are dried slowly on raised
            beds.
          </li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold text-primary">Agronomic Advantages & Risks</h4>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Anaerobic processing commands excellent specialty premiums in the market. However,
          over-fermentation can lead to vinegar defects, off-flavors, or mold, ruining the entire
          batch.
        </p>
      </div>
    </div>
  ),
  "Classic Natural Processing": (
    <div className="space-y-4 text-sm text-foreground/95">
      <p>
        The <strong>Natural (or Dry) Process</strong> is the oldest coffee processing method. Intact
        whole cherries are laid out to dry, allowing the seeds to absorb sugars and flavors from the
        fruit as it shrivels. It produces rich, full-bodied coffees with heavy sweetness and jammy
        fruit flavors.
      </p>
      <div className="bg-muted/40 border border-border/60 p-4 rounded-2xl space-y-2">
        <h4 className="font-bold text-primary text-xs uppercase tracking-wider">Key Steps</h4>
        <ul className="list-disc pl-5 space-y-1 text-xs">
          <li>
            <strong>Sorting:</strong> Cherries are sorted to remove unripe fruits and twigs.
          </li>
          <li>
            <strong>Spreading:</strong> Whole cherries are spread in thin layers on concrete patios
            or raised beds.
          </li>
          <li>
            <strong>Raking:</strong> Cherries must be turned every hour to ensure uniform drying and
            prevent fermentation defects.
          </li>
          <li>
            <strong>Hulling:</strong> Dried cherries (resembling raisins) are put through a dry
            huller to remove all dried skin and parchment.
          </li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold text-primary">Agronomic Advantages & Risks</h4>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          This process is highly sustainable, using virtually zero water. However, it requires a dry
          climate during harvest and intensive labor to prevent fungal outbreaks.
        </p>
      </div>
    </div>
  ),
  "Managing High Humidity Risks": (
    <div className="space-y-4 text-sm text-foreground/95">
      <p>
        Drying specialty coffee in tropical regions often poses a challenge due to{" "}
        <strong>high relative humidity (&gt;70% RH)</strong>. If coffee dries too slowly, mold
        grows, causing musty odors, sensory defects, and toxin development.
      </p>
      <div className="bg-muted/40 border border-border/60 p-4 rounded-2xl space-y-2">
        <h4 className="font-bold text-primary text-xs uppercase tracking-wider">
          Humidity Control Actions
        </h4>
        <ul className="list-disc pl-5 space-y-1 text-xs">
          <li>
            <strong>Greenhouses & Solar Dryers:</strong> Cover beds in plastic domes or solar dryers
            to protect coffee from rain and elevate internal temperature.
          </li>
          <li>
            <strong>Ventilation Fans:</strong> Use solar-powered fans to keep air moving constantly
            over the beds, carrying moisture away.
          </li>
          <li>
            <strong>Raised Beds:</strong> Avoid drying directly on the ground; raised beds allow
            airflow underneath.
          </li>
          <li>
            <strong>Heat Ventilation:</strong> Apply indirect, low-heat airflow during cloudy, humid
            periods to sustain uniform drying.
          </li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold text-primary">Ideal Goals</h4>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Aim to bring moisture levels down steadily to 10-12% within 10-18 days. Avoid keeping
          moisture high for too long to prevent mold and ensure longevity of the coffee.
        </p>
      </div>
    </div>
  ),
};

function LearnPage() {
  const [selectedLesson, setSelectedLesson] = useState<(typeof lessons)[0] | null>(null);

  useEffect(() => {
    const handleArticleSelect = () => {
      const articleTitle = localStorage.getItem("open_article_search");
      if (articleTitle) {
        const match = lessons.find((l) =>
          l.title.toLowerCase().includes(articleTitle.toLowerCase()),
        );
        if (match) {
          setSelectedLesson(match);
        }
        localStorage.removeItem("open_article_search");
      }
    };

    window.addEventListener("learn-article-select", handleArticleSelect);
    handleArticleSelect();

    return () => {
      window.removeEventListener("learn-article-select", handleArticleSelect);
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          <BookOpen className="h-3 w-3 text-forest" /> Learning Center
        </div>
        <h1 className="mt-1 text-2xl font-bold md:text-3xl text-primary">
          Grow your post-harvest mastery
        </h1>
        <p className="text-sm text-muted-foreground">
          Short, practical guides written for Indonesian smallholders.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {lessons.map((l) => (
          <Card
            key={l.title}
            className="rounded-2xl border-border bg-card shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-card)] flex flex-col justify-between"
          >
            <CardHeader>
              <div
                className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-cream"
                style={{ background: l.color }}
              >
                <l.icon className="h-5 w-5" />
              </div>
              <Badge
                variant="secondary"
                className="w-fit rounded-full bg-secondary text-coffee-deep border-transparent"
              >
                {l.tag}
              </Badge>
              <CardTitle className="mt-2 text-lg text-foreground font-bold">{l.title}</CardTitle>
              <CardDescription className="text-muted-foreground">{l.desc}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                variant="outline"
                onClick={() => setSelectedLesson(l)}
                className="w-full rounded-xl border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground font-semibold transition-all duration-200"
              >
                Read Guide →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={selectedLesson !== null}
        onOpenChange={(open) => !open && setSelectedLesson(null)}
      >
        <DialogContent
          className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border-border bg-card p-6"
          style={{ boxShadow: "var(--shadow-elegant)" }}
        >
          {selectedLesson && (
            <>
              <DialogHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-secondary text-coffee-deep border-transparent"
                  >
                    {selectedLesson.tag}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    Educational Article
                  </span>
                </div>
                <DialogTitle className="mt-2 text-2xl font-extrabold text-primary flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-cream shrink-0"
                    style={{ background: selectedLesson.color }}
                  >
                    <selectedLesson.icon className="h-4.5 w-4.5" />
                  </div>
                  {selectedLesson.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {selectedLesson.desc}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 pt-2">
                {articleContent[selectedLesson.title] || (
                  <p className="text-sm text-muted-foreground">
                    Article content is currently unavailable.
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
