/**
 * components/Skeleton.tsx — Light theme
 */

function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-[#e2e8f4] rounded-lg ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

export function ArticleCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden bg-white border border-[#e2e8f4] shadow-sm">
      <Shimmer className="h-48 rounded-none" />
      <div className="p-4 space-y-3">
        <Shimmer className="h-4 w-1/3" />
        <Shimmer className="h-5 w-full" />
        <Shimmer className="h-5 w-4/5" />
        <Shimmer className="h-3 w-2/3" />
        <div className="flex gap-2 pt-2">
          <Shimmer className="h-3 w-16" />
          <Shimmer className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

export function ArticleCardSkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ArticleCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-[#e2e8f4] shadow-sm">
      <Shimmer className="h-72 sm:h-96 rounded-none" />
      <div className="p-6 space-y-3">
        <Shimmer className="h-4 w-1/4" />
        <Shimmer className="h-7 w-full" />
        <Shimmer className="h-7 w-3/4" />
        <Shimmer className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function AdminArticleSkeleton() {
  return (
    <div className="bg-white border border-[#e2e8f4] rounded-2xl p-5 space-y-3 shadow-sm">
      <div className="flex justify-between items-start">
        <Shimmer className="h-5 w-3/4" />
        <Shimmer className="h-6 w-16" />
      </div>
      <Shimmer className="h-4 w-full" />
      <Shimmer className="h-4 w-5/6" />
      <div className="flex gap-3 pt-1">
        <Shimmer className="h-8 w-24" />
        <Shimmer className="h-8 w-24" />
        <Shimmer className="h-8 w-20" />
      </div>
    </div>
  );
}
