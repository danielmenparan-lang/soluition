export function BrandLogo({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className ? `${className} ms-brand-logo` : "ms-brand-logo"}
    >
      <rect width="48" height="48" rx="14" fill="url(#ms-logo-grad)" />
      <path
        d="M14 30V18h5.2l3.4 8.2L26 18h5v12h-3.6V23.8L24.8 30h-2.9l-2.6-6.2V30H14z"
        fill="#fff"
      />
      <circle cx="34" cy="16" r="4" fill="#6d5ef7" opacity="0.95" />
      <defs>
        <linearGradient id="ms-logo-grad" x1="8" y1="6" x2="42" y2="42">
          <stop stopColor="#0a9b7a" />
          <stop offset="1" stopColor="#047a5c" />
        </linearGradient>
      </defs>
    </svg>
  );
}
