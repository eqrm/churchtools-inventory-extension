import { Skeleton, Stack } from '@mantine/core';

interface ListLoadingSkeletonProps {
    rows?: number;
    height?: number;
}

/**
 * List Loading Skeleton Component
 * Shows skeleton placeholders for loading lists/tables
 * 
 * @param rows - Number of skeleton rows to display (default: 5)
 * @param height - Height of each skeleton row in pixels (default: 60)
 */
export function ListLoadingSkeleton({ rows = 5, height = 60 }: ListLoadingSkeletonProps) {
    return (
        <Stack gap="xs">
            {Array.from({ length: rows }).map((_, index) => (
                <Skeleton key={index} height={height} radius="sm" />
            ))}
        </Stack>
    );
}
