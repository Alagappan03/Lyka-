import { useRef, type MouseEvent, type ReactNode } from "react";

type SpotlightCardProps = {
  children: ReactNode;
  className?: string;
};

export function SpotlightCard({ children, className = "" }: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!card) {
      return;
    }

    const bounds = card.getBoundingClientRect();
    card.style.setProperty("--spot-x", `${event.clientX - bounds.left}px`);
    card.style.setProperty("--spot-y", `${event.clientY - bounds.top}px`);
  }

  return (
    <div
      ref={cardRef}
      className={`table-container spotlight-card ${className}`.trim()}
      onMouseMove={handleMouseMove}
    >
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      <div className="spotlight-card__overlay" aria-hidden="true" />
    </div>
  );
}
