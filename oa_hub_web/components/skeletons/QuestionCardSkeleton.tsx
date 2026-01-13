import { Skeleton } from "@/components/ui/Skeleton";

export function QuestionCardSkeleton() {
    return (
        <div className="block">
            {/* Thumbnail */}
            <Skeleton className="w-full aspect-video rounded-lg mb-2 bg-dark-800" />

            {/* Meta */}
            <div className="flex gap-3">
                {/* Avatar */}
                <Skeleton className="w-9 h-9 rounded-full shrink-0 mt-0.5" />

                {/* Text */}
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                    <div className="flex justify-between mt-1">
                        <Skeleton className="h-2 w-1/3" />
                        <Skeleton className="h-2 w-1/4" />
                    </div>
                </div>
            </div>
        </div>
    );
}
