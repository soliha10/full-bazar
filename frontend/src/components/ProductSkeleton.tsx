
export function ProductSkeleton() {
  return (
    <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border">
      <div className="h-64 animate-shimmer" />
      <div className="p-4 space-y-4">
        <div>
          <div className="h-3 w-1/4 animate-shimmer rounded mb-2" />
          <div className="h-6 w-full animate-shimmer rounded" />
          <div className="h-6 w-3/4 animate-shimmer rounded mt-1" />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 animate-shimmer rounded-full" />
          <div className="h-4 w-12 animate-shimmer rounded" />
          <div className="h-4 w-20 animate-shimmer rounded" />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <div className="h-8 w-1/3 animate-shimmer rounded" />
          <div className="h-6 w-1/4 animate-shimmer rounded" />
        </div>

        <div className="h-10 w-full animate-shimmer rounded-lg mt-2" />
      </div>
    </div>
  );
}
