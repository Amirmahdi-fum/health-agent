export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-white/[0.05] ${className}`} />;
}
