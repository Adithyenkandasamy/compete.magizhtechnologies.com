/**
 * Magizh loading & motion system.
 *
 * Import from here so pages don't need to remember individual file paths:
 *
 *   import { EventCardSkeleton, ErrorState, EmptyState, LoadingButton } from "@/components/loading";
 *
 * State model used across the app:
 *   Loading -> EventCardSkeleton / DashboardSkeleton / TableSkeleton / PageLoader
 *   Error   -> ErrorState
 *   Empty   -> EmptyState (only after the request resolved with zero results)
 *   Data    -> real content stays visible; RefetchIndicator during background refetch
 */
export { PageLoader, BlockLoader } from "./PageLoader";
export { Skeleton, SkeletonText, SkeletonCircle } from "./Skeleton";
export { EventCardSkeleton } from "./EventCardSkeleton";
export { DashboardSkeleton } from "./DashboardSkeleton";
export { TableSkeleton } from "./TableSkeleton";
export { LoadingButton } from "./LoadingButton";
export { ErrorState } from "./ErrorState";
export { EmptyState } from "./EmptyState";
export { RefetchIndicator } from "./RefetchIndicator";
export { SmartImage } from "./SmartImage";