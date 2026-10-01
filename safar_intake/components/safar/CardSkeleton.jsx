// Shared loading skeleton for property cards
export default function CardSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/5] rounded-3xl bg-secondary" />
          <div className="pt-3.5 px-1 space-y-2">
            <div className="h-3 bg-secondary rounded w-3/4" />
            <div className="h-3 bg-secondary rounded w-1/2" />
            <div className="h-3 bg-secondary rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
