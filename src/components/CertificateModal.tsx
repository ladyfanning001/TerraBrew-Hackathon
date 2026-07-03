import React, { useEffect, useRef } from "react";
import { Award, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certification: any;
}

interface ConfettiParticle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
}

// Confetti Particle Canvas Component
const ConfettiCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const colors = [
      "#d88f34", // gold/honey
      "#27432b", // forest green
      "#eee4c4", // cream
      "#8b5a2b", // bronze
      "#ffd700", // pure shiny gold
      "#ef4444", // red
      "#3b82f6", // blue
    ];

    const particles: ConfettiParticle[] = [];

    // Spawning 150 particles from both sides of the bottom of the screen
    for (let i = 0; i < 150; i++) {
      const isLeft = Math.random() > 0.5;
      particles.push({
        x: isLeft ? 0 : width,
        y: height * 0.85,
        size: Math.random() * 8 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (isLeft ? 1 : -1) * (Math.random() * 15 + 5),
        speedY: -(Math.random() * 22 + 12),
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 12 - 6,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      let alive = false;
      particles.forEach((p) => {
        // Physics update
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.55; // gravity
        p.speedX *= 0.98; // friction
        p.rotation += p.rotationSpeed;

        if (p.y < height + 20) {
          alive = true;
        }

        // Draw particle shape
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      if (alive) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[100] w-full h-full"
    />
  );
};

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  certification,
}) => {
  if (!certification) return null;

  const ecoscore = Number(certification.ecoscore || certification.ecoScore || 0);
  const envScore = Number(certification.env_score || certification.envScore || 0);
  const ecoScore = Number(certification.eco_score || certification.ecoScore || 0);
  const sosScore = Number(certification.sos_score || certification.sosScore || 0);

  const getAward = (score: number) => {
    if (score >= 0.66) return { name: "High Sustainability", color: "text-[#10b981]" };
    if (score >= 0.33) return { name: "Medium Sustainability", color: "text-[#f59e0b]" };
    return { name: "Low Sustainability", color: "text-[#ef4444]" };
  };

  const award = getAward(ecoscore);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] p-2 bg-[#FAF8F2] border border-[#dacfbe] rounded-2xl shadow-elegant overflow-y-auto max-h-[95vh] no-print">
        <DialogTitle className="sr-only">
          Speciality Coffee Sustainability Certificate - {certification.farm_name}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Official certification for {certification.farm_name} indicating eco-score of {ecoscore.toFixed(2)}
        </DialogDescription>
        
        {/* Render Confetti upon open */}
        {isOpen && <ConfettiCanvas />}

        {/* Certificate Border and Frame */}
        <div 
          id="printable-certificate-container"
          className="relative border-8 border-double border-honey/60 bg-[#FAF8F2] p-6 md:p-10 text-[#42302c] rounded-xl animate-shine-sweep select-none"
        >
          {/* Ornamental corner lines */}
          <div className="absolute top-2 left-2 border-t-2 border-l-2 border-honey/80 w-12 h-12" />
          <div className="absolute top-2 right-2 border-t-2 border-r-2 border-honey/80 w-12 h-12" />
          <div className="absolute bottom-2 left-2 border-b-2 border-l-2 border-honey/80 w-12 h-12" />
          <div className="absolute bottom-2 right-2 border-b-2 border-r-2 border-honey/80 w-12 h-12" />

          {/* Certificate Header */}
          <div className="text-center space-y-2 animate-fade-in-up">
            <div className="flex justify-center items-center gap-2 text-forest">
              <Award className="h-9 w-9 text-honey animate-pulse" />
              <span className="font-semibold tracking-widest text-xs uppercase text-forest font-sans">
                TerraBrew Sustainability Alliance
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold tracking-wide mt-3 text-coffee uppercase">
              Certificate of Sustainability
            </h1>
            <p className="text-[10px] md:text-xs italic text-muted-foreground uppercase tracking-widest">
              Speciality Coffee Post-Harvest Excellence
            </p>
          </div>

          <div className="my-6 border-t border-honey/20" />

          {/* Certificate Recipient */}
          <div className="text-center space-y-4 animate-fade-in-up animation-delay-100">
            <p className="text-xs font-sans tracking-widest text-muted-foreground uppercase">
              This is officially awarded to
            </p>
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-serif font-extrabold text-coffee capitalize tracking-wide py-1">
              {certification.farm_name}
            </h2>
            <p className="max-w-xl mx-auto text-xs md:text-sm leading-relaxed text-muted-foreground">
              For successfully adopting sustainable post-harvest preprocessing standards, optimizing ecological footprints, conserving local water bodies, and producing premium grade-1 coffee.
            </p>
          </div>

          {/* Environmental, Economic, Social Sub-scores */}
          <div className="my-6 grid grid-cols-3 gap-2 md:gap-4 animate-fade-in-up animation-delay-200">
            <div className="border border-[#dacfbe]/80 bg-white/40 backdrop-blur-sm p-2 md:p-3 rounded-xl text-center space-y-1">
              <span className="text-[9px] md:text-xs text-muted-foreground font-bold uppercase block">Environmental</span>
              <div className="text-lg md:text-xl font-bold text-forest">{Number(envScore * 100).toFixed(0)}%</div>
              <p className="text-[8px] md:text-[9px] text-muted-foreground leading-tight hidden sm:block">Water-saving & Eco-forestry</p>
            </div>
            <div className="border border-[#dacfbe]/80 bg-white/40 backdrop-blur-sm p-2 md:p-3 rounded-xl text-center space-y-1">
              <span className="text-[9px] md:text-xs text-muted-foreground font-bold uppercase block">Economic</span>
              <div className="text-lg md:text-xl font-bold text-honey">{Number(ecoScore * 100).toFixed(0)}%</div>
              <p className="text-[8px] md:text-[9px] text-muted-foreground leading-tight hidden sm:block">Speciality Grade & Livelihood</p>
            </div>
            <div className="border border-[#dacfbe]/80 bg-white/40 backdrop-blur-sm p-2 md:p-3 rounded-xl text-center space-y-1">
              <span className="text-[9px] md:text-xs text-muted-foreground font-bold uppercase block">Social</span>
              <div className="text-lg md:text-xl font-bold text-[#8b5a2b]">{Number(sosScore * 100).toFixed(0)}%</div>
              <p className="text-[8px] md:text-[9px] text-muted-foreground leading-tight hidden sm:block">Community & Gender Parity</p>
            </div>
          </div>

          <div className="my-6 border-t border-honey/20" />

          {/* Footer - Seal and Signatures */}
          <div className="grid grid-cols-3 items-center gap-4 mt-6 animate-fade-in-up animation-delay-300">
            {/* Metadata (Left) */}
            <div className="text-left space-y-0.5 text-[9px] md:text-xs">
              <div className="font-bold uppercase text-muted-foreground text-[8px] md:text-[9px]">Certificate Details</div>
              <div>Variety: <span className="font-semibold text-coffee">{certification.coffee_variety}</span></div>
              <div>Region: <span className="font-semibold text-coffee">{certification.region || "Aceh"}</span></div>
              <div>Country: <span className="font-semibold text-coffee">{certification.country || "Indonesia"}</span></div>
            </div>

            {/* Gold Seal (Center) */}
            <div className="flex justify-center relative scale-90 md:scale-100">
              <div className="relative h-20 w-20 md:h-24 md:w-24 bg-gradient-to-br from-[#ffd700] via-[#d88f34] to-[#8b5a2b] rounded-full flex items-center justify-center shadow-lg border-2 border-white/60">
                <div className="absolute inset-1 border border-dashed border-white/30 rounded-full" />
                <div className="text-center text-white z-10 p-1">
                  <div className="text-[8px] font-bold tracking-widest uppercase">Ecoscore</div>
                  <div className="text-base md:text-lg font-black tracking-tight">{Number(ecoscore).toFixed(2)}</div>
                  <div className="text-[7px] md:text-[8px] font-semibold uppercase leading-none">{award.name}</div>
                </div>
              </div>
              {/* Gold Ribbons */}
              <div className="absolute -bottom-4 w-5 h-10 bg-honey/80 -rotate-12 translate-x-3 skew-y-12 shadow-sm z-0" />
              <div className="absolute -bottom-4 w-5 h-10 bg-honey/80 rotate-12 -translate-x-3 -skew-y-12 shadow-sm z-0" />
            </div>

            {/* Signature (Right) */}
            <div className="text-right space-y-0.5 text-[9px] md:text-xs md:self-end">
              <div className="font-serif italic font-semibold text-sm md:text-base border-b border-muted-foreground/30 pb-0.5 select-none text-coffee leading-none">
                {certification.validator_name || "SEA Auditor"}
              </div>
              <div className="text-muted-foreground text-[8px] md:text-[9px]">Authorized SEA Signature</div>
              <div className="text-[7px] md:text-[9px] text-muted-foreground/80 mt-1">
                Date: {new Date(certification.created_at || certification.createdAt || Date.now()).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls - Print Button (Hidden on Print) */}
        <div className="flex justify-end gap-2 p-4 border-t border-[#dacfbe]/40 bg-white/20 rounded-b-2xl no-print">
          <Button 
            onClick={onClose} 
            variant="outline" 
            className="rounded-xl border-[#dacfbe] text-muted-foreground hover:bg-[#FAF8F2] transition"
          >
            Close
          </Button>
          <Button 
            onClick={handlePrint}
            className="rounded-xl bg-forest hover:bg-forest-deep text-cream font-bold shadow-md transition flex items-center gap-1.5"
          >
            <Printer className="h-4 w-4" /> Print Certificate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
