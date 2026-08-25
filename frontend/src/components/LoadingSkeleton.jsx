import { Card, CardContent, CardHeader } from '@/components/ui/card';

function SkeletonPulse({ className }) {
  return (
    <div 
      className={`animate-pulse rounded-md bg-neutral-200 ${className}`}
    />
  );
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Overall Score Skeleton */}
      <Card>
        <CardHeader className="text-center pb-2">
          <SkeletonPulse className="h-6 w-32 mx-auto" />
        </CardHeader>
        <CardContent className="text-center space-y-3">
          <SkeletonPulse className="h-16 w-24 mx-auto rounded-full" />
          <SkeletonPulse className="h-4 w-16 mx-auto" />
          <SkeletonPulse className="h-8 w-28 mx-auto rounded-full" />
        </CardContent>
      </Card>

      {/* Breakdown Skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <SkeletonPulse className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <SkeletonPulse className="h-4 w-28" />
                <SkeletonPulse className="h-4 w-12" />
              </div>
              <SkeletonPulse className="h-2 w-full rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Analysis Skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <SkeletonPulse className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <SkeletonPulse className="h-4 w-full" />
            <SkeletonPulse className="h-4 w-full" />
            <SkeletonPulse className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>

      {/* Custom CV Skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <SkeletonPulse className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <SkeletonPulse className="h-4 w-full" />
            <SkeletonPulse className="h-4 w-full" />
            <SkeletonPulse className="h-4 w-full" />
            <SkeletonPulse className="h-4 w-5/6" />
            <SkeletonPulse className="h-4 w-full" />
            <SkeletonPulse className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>

      {/* Interview Questions Skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <SkeletonPulse className="h-5 w-52" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <SkeletonPulse className="h-6 w-6 rounded-full shrink-0" />
                <SkeletonPulse className="h-4 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
