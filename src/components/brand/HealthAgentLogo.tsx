/**
 * Health Agent brand mark — a circular obsidian badge with a stylized EKG
 * heartbeat trace morphing into a neural-network node, filled with a
 * pulse gradient from Indigo (#5e6ad2) to Emerald (#10b981).
 *
 * `size` controls the square viewport in pixels.
 * `animated` runs a subtle pulse on the node — enabled by default.
 */
export function HealthAgentLogo({
  size = 32,
  animated = true,
  className,
}: {
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  const id = "ha-grad";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Health Agent"
      role="img"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5e6ad2" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Obsidian badge */}
      <rect
        x="1"
        y="1"
        width="62"
        height="62"
        rx="16"
        fill="#0b0c11"
        stroke={`url(#${id})`}
        strokeWidth="1.5"
      />
      {/* EKG heartbeat trace */}
      <path
        d="M8 34 L18 34 L22 26 L27 42 L32 20 L37 42 L41 34 L48 34"
        stroke={`url(#${id})`}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Neural-network node the trace resolves into */}
      <circle cx="52" cy="34" r="6" fill={`url(#${id}-glow)`} />
      <circle cx="52" cy="34" r="3.2" fill={`url(#${id})`}>
        {animated && (
          <animate attributeName="r" values="3.2;4.2;3.2" dur="2.4s" repeatCount="indefinite" />
        )}
      </circle>
      {/* Tiny synapse dots */}
      <circle cx="56" cy="24" r="1.4" fill="#10b981" opacity="0.7" />
      <circle cx="58" cy="42" r="1.2" fill="#5e6ad2" opacity="0.7" />
      <line x1="52" y1="34" x2="56" y2="24" stroke="#10b981" strokeWidth="1" opacity="0.5" />
      <line x1="52" y1="34" x2="58" y2="42" stroke="#5e6ad2" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}
