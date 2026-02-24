interface NexusLogoProps {
  size?: number
  className?: string
}

export function NexusLogo({ size = 40, className = '' }: NexusLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Nexus logo"
    >
      <defs>
        <linearGradient id="nexus-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0DA2E7" />
          <stop offset="100%" stopColor="#6B26D9" />
        </linearGradient>
      </defs>
      {/* Hexagon bg */}
      <path
        d="M20 2L36.5 11.5V29L20 38.5L3.5 29V11.5L20 2Z"
        fill="url(#nexus-grad)"
        opacity="0.15"
      />
      <path
        d="M20 2L36.5 11.5V29L20 38.5L3.5 29V11.5L20 2Z"
        stroke="url(#nexus-grad)"
        strokeWidth="1.5"
        fill="none"
      />
      {/* N letter */}
      <path
        d="M13 27V13L20 24L27 13V27"
        stroke="url(#nexus-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
