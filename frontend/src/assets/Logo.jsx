export default function Logo({ size = 28, color = '#1E3A8A', className = '' }) {
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 32 26" fill="none" className={className}>
      <path d="M4 4C4 2.9 4.9 2 6 2H26C27.1 2 28 2.9 28 4L16 14L4 4Z" fill={color} />
      <path d="M4 4V22C4 23.1 4.9 24 6 24H26C27.1 24 28 23.1 28 22V4L16 14L4 4Z" stroke={color} strokeWidth="1.8" fill="none" />
    </svg>
  );
}
