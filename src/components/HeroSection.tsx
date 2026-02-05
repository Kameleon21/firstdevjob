"use client";

import { useAuth } from "@/hooks/useAuth";

interface HeroSectionProps {
  onPostJobClick: () => void;
  onAuthClick?: () => void;
}

export default function HeroSection({
  onPostJobClick,
  onAuthClick,
}: HeroSectionProps) {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <>
      <style>{`
        @keyframes hero-fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes hero-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(3deg); }
        }
        @keyframes hero-float-alt {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-9px) rotate(-2.5deg); }
        }
        @keyframes hero-glow-pulse {
          0%, 100% { opacity: 0.07; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.12; transform: translate(-50%, -50%) scale(1.08); }
        }
        @keyframes hero-shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes hero-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .hero-enter { animation: hero-fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .hero-d1 { animation-delay: 0.08s; }
        .hero-d2 { animation-delay: 0.2s; }
        .hero-d3 { animation-delay: 0.35s; }
        .hero-d4 { animation-delay: 0.5s; }
        .hero-d5 { animation-delay: 0.65s; }
        .hero-float { animation: hero-float 7s ease-in-out infinite; }
        .hero-float-alt { animation: hero-float-alt 9s ease-in-out infinite; }
        .hero-glow { animation: hero-glow-pulse 5s ease-in-out infinite; }
        .hero-cursor-blink { animation: hero-cursor 1.1s step-end infinite; }
        .hero-shimmer-text {
          background-size: 200% auto;
          animation: hero-shimmer 4s linear infinite;
        }
        .hero-dot-grid {
          background-image: radial-gradient(circle, var(--primary) 0.8px, transparent 0.8px);
          background-size: 28px 28px;
        }
      `}</style>

      <div className="relative overflow-hidden rounded-2xl border border-border bg-linear-to-br from-(--hero-gradient-from) via-(--hero-gradient-via) to-(--hero-gradient-to)">
        {/* Dot grid texture */}
        <div
          className="absolute inset-0 hero-dot-grid opacity-[0.035]"
          aria-hidden="true"
        />

        {/* Radial glow behind content */}
        <div
          className="absolute top-1/2 left-1/2 w-175 h-105 rounded-full bg-primary blur-[120px] hero-glow pointer-events-none"
          aria-hidden="true"
        />

        {/* Floating code decorations */}
        <span
          className="absolute top-10 right-[14%] text-primary/15 text-5xl font-mono hero-float select-none pointer-events-none hidden sm:block"
          aria-hidden="true"
        >
          &lt;/&gt;
        </span>
        <span
          className="absolute bottom-14 left-[9%] text-primary/12 text-3xl font-mono hero-float-alt select-none pointer-events-none hidden sm:block"
          aria-hidden="true"
        >
          {`{ }`}
        </span>
        <span
          className="absolute top-20 left-[12%] w-2.5 h-2.5 rounded-full bg-primary/18 hero-float-alt pointer-events-none hidden sm:block"
          aria-hidden="true"
        />
        <span
          className="absolute bottom-16 right-[10%] w-2 h-2 rounded-full bg-accent/22 hero-float pointer-events-none hidden sm:block"
          aria-hidden="true"
        />
        <span
          className="absolute top-1/2 right-[6%] text-accent/8 text-7xl font-mono hero-float-alt select-none pointer-events-none hidden lg:block"
          aria-hidden="true"
        >
          _
        </span>

        {/* Main content */}
        <div className="relative z-10 py-16 sm:py-20 lg:py-28 px-6 sm:px-8">
          {/* Eyebrow badge */}
          <div className="hero-enter hero-d1 flex justify-center mb-7">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-medium tracking-wide backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Built for new developers
            </span>
          </div>

          {/* Headline */}
          <h1 className="hero-enter hero-d2 text-center text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-5 sm:mb-6 leading-[1.08] tracking-tight max-w-4xl mx-auto">
            Your career starts{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-linear-to-r from-primary via-accent to-primary bg-size-[200%_auto] hero-shimmer-text">
                here
              </span>
              <span className="absolute -bottom-1 left-0 right-0 h-0.75 bg-linear-to-r from-primary via-accent to-primary rounded-full opacity-80" />
            </span>
            <span
              className="hero-cursor-blink text-primary font-light ml-0.5"
              aria-hidden="true"
            >
              _
            </span>
          </h1>

          {/* Subtitle */}
          <p className="hero-enter hero-d3 text-center text-base sm:text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto mb-10 sm:mb-12 leading-relaxed">
            The job board made for students, bootcamp grads, and junior
            developers. No &ldquo;5 years experience for entry-level&rdquo;
            nonsense.
          </p>

          {/* CTA buttons */}
          <div className="hero-enter hero-d4 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <button
              onClick={onPostJobClick}
              className="group relative w-full sm:w-auto px-8 py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 hover:scale-[1.04] hover:shadow-[0_0_40px_rgba(147,51,234,0.35)] active:scale-[0.97] flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:rotate-90"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Post a Job
            </button>
            {!isLoading && !isAuthenticated && (
              <button
                onClick={() => onAuthClick?.()}
                className="w-full sm:w-auto px-8 py-3.5 border border-primary/30 text-foreground rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 hover:border-primary/70 hover:bg-primary/[0.06] hover:scale-[1.03] active:scale-[0.97] backdrop-blur-sm cursor-pointer"
              >
                Sign Up to Track
              </button>
            )}
          </div>

          {/* Bottom accent tagline */}
          <div className="hero-enter hero-d5 flex justify-center mt-12 sm:mt-16">
            <div className="flex items-center gap-3 text-muted-foreground/50 text-xs sm:text-sm font-mono">
              <span className="w-8 h-px bg-border" />
              <span>100% free &middot; no gatekeeping</span>
              <span className="w-8 h-px bg-border" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
