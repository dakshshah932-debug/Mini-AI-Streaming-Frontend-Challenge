export default function Bot({ className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="12" y1="2" x2="12" y2="4" />
      <circle cx="12" cy="1.6" r="0.9" fill="currentColor" stroke="none" />
      <rect x="5" y="5" width="14" height="10" rx="2.5" />
      <circle cx="9" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
      <rect x="9" y="12.5" width="6" height="1.2" rx="0.6" fill="currentColor" stroke="none" />
      <line x1="12" y1="15.5" x2="12" y2="18" />
      <path d="M17.5 7.5c1 1 1 2.5 0 3.5" stroke="currentColor" fill="none" />
      <path d="M19 6c1.6 1.6 1.6 4.2 0 5.8" stroke="currentColor" fill="none" strokeWidth="1.2" />
    </svg>
  );
}
