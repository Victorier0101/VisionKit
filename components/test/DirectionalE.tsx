import type { Direction } from "@/types/tests";
const rotation: Record<Direction, number> = { right: 0, down: 90, left: 180, up: 270 };
export function DirectionalE({
  direction,
  size,
  color = "currentColor",
}: {
  direction: Direction;
  size: number;
  color?: string;
}) {
  return (
    <svg
      role="img"
      aria-label="Directional E"
      width={size}
      height={size}
      viewBox="0 0 5 5"
      style={{ transform: `rotate(${rotation[direction]}deg)` }}
    >
      <path fill={color} d="M0 0h5v1H1v1h3v1H1v1h4v1H0z" />
    </svg>
  );
}
