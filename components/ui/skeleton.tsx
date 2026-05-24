export function SkeletonRows(){return <div className="space-y-3">{[1,2,3,4].map(i=><div key={i} className="h-14 animate-pulse rounded-2xl bg-white/[.06]"/> )}</div>}
