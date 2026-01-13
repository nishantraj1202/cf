import { Skeleton } from "@/components/ui/Skeleton";

export function QuestionListSkeleton() {
    return (
        <div className="w-full overflow-hidden rounded-xl border border-dark-800 bg-dark-900/50">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-dark-800">
                        <th className="px-6 py-4"><Skeleton className="h-4 w-12" /></th>
                        <th className="px-6 py-4 w-full"><Skeleton className="h-4 w-32" /></th>
                        <th className="px-6 py-4"><Skeleton className="h-4 w-20" /></th>
                        <th className="px-6 py-4"><Skeleton className="h-4 w-24" /></th>
                        <th className="px-6 py-4"><Skeleton className="h-4 w-20" /></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                            <td className="px-6 py-4">
                                <Skeleton className="w-5 h-5 rounded-full" />
                            </td>
                            <td className="px-6 py-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <Skeleton className="h-6 w-16 rounded-md" />
                            </td>
                            <td className="px-6 py-4">
                                <Skeleton className="h-6 w-20 rounded-md" />
                            </td>
                            <td className="px-6 py-4">
                                <Skeleton className="h-4 w-24" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
