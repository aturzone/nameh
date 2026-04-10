export default function Logo({ size = 32, className = '' }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 40 40"
      fill="none" xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="1" y="1" width="38" height="38" rx="10" fill="#1E3A8A" />
      <path
        d="M11 28V12L16.5 19L20 15L23.5 19L29 12V28"
        stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
      <path
        d="M11 28H29"
        stroke="white" strokeWidth="2.4" strokeLinecap="round"
      />
    </svg>
  );
}
