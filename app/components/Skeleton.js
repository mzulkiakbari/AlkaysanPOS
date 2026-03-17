'use client';

export const Skeleton = ({ className, width, height, borderRadius }) => {
    const style = {};
    if (width) style.width = width;
    if (height) style.height = height;
    if (borderRadius) style.borderRadius = borderRadius;

    return (
        <div
            className={`skeleton ${className || ''}`}
            style={style}
        />
    );
};

export const SkeletonCard = ({ className }) => (
    <div className={`card overflow-hidden h-32 flex flex-col justify-center ${className || ''}`}>
        <div className="flex items-center justify-between">
            <div className="space-y-3 flex-1">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-32 h-6" />
                <Skeleton className="w-40 h-4" />
            </div>
            <Skeleton className="w-12 h-12 rounded-xl" />
        </div>
    </div>
);

export const SkeletonTable = ({ rows = 10, cols = 5 }) => (
    <div className="overflow-x-auto">
        <table className="table">
            <thead>
                <tr>
                    {Array.from({ length: cols }).map((_, i) => (
                        <th key={i}><Skeleton className="w-24 h-4" /></th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: rows }).map((_, i) => (
                    <tr key={i}>
                        {Array.from({ length: cols }).map((_, j) => (
                            <td key={j}><Skeleton className="w-full h-4" /></td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export const SkeletonHistoryItem = () => (
    <div className="p-4 rounded-xl border border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div>
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-48 h-3 mt-2" />
            </div>
        </div>
        <Skeleton className="w-24 h-6 rounded-lg" />
    </div>
);
