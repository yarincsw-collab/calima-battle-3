// Stylised CALIMA BATTLES 3 wordmark recreating the grunge / brush feel
// from the poster. CALIMA is hollow (white outline), BATTLES is solid electric
// blue, "3" sits inline after BATTLES at a slightly raised baseline.
//
// Force LTR on the inner block so the wordmark stays in latin reading order
// even on the Hebrew RTL page.

export function BattlesLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`relative inline-block leading-none ${className}`} dir="ltr">
      <div className="flex flex-col items-center">
        <span
          className="grunge-text text-[clamp(3.2rem,12vw,9rem)] tracking-[0.04em]"
          style={{
            WebkitTextStroke: "1.5px rgba(255,255,255,0.9)",
            color: "transparent",
            fontWeight: 800,
            textShadow: "0 0 1px rgba(255,255,255,0.4)",
          }}
        >
          CALIMA
        </span>
        <div className="flex items-start gap-2 sm:gap-3 -mt-2 sm:-mt-4">
          <span
            className="grunge-text text-electric-500 text-[clamp(4rem,15vw,11rem)] tracking-[0.02em] drop-shadow-[0_0_25px_rgba(27,164,224,0.55)]"
            style={{ fontWeight: 900 }}
          >
            BATTLES
          </span>
          <span
            className="grunge-text text-white text-[clamp(3rem,11vw,8rem)] -mt-2 sm:-mt-4"
            style={{ fontWeight: 900 }}
          >
            3
          </span>
        </div>
      </div>
    </div>
  );
}
