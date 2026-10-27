/** The SaveServe mark: a white medical cross on the brand green (matches the PWA icon). */
export function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "w-7 h-7 rounded-md" : "w-9 h-9 rounded-lg";
  const icon = size === "sm" ? 16 : 20;
  return (
    <span aria-hidden className={`${box} bg-primary inline-flex items-center justify-center shrink-0 shadow-xs`}>
      <svg width={icon} height={icon} viewBox="0 0 24 24" fill="#fff">
        <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" />
      </svg>
    </span>
  );
}
