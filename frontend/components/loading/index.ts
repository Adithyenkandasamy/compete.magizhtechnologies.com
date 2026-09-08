/**
 * Magizh loading & motion system.
 *
 * Import from here so pages don't need to remember individual file paths:
 *
 *   import { HackerSnakeLoader, CircularHudLoader, LoadingButton } from "@/components/loading";
 *
 * TWO loader families only:
 *   CircularHudLoader — authentication flows (login, logout, session verify)
 *   HackerSnakeLoader — every other loading state, at any size
 *
 * State model used across the app:
 *   Loading  -> PageLoader (snake) / HackerSnakeLoader / static reserved skeleton
 *   Error    -> ErrorState
 *   Empty    -> EmptyState (only after the request resolved with zero results)
 *   Data     -> real content stays visible; RefetchIndicator during background refetch
 */
export {
  CircularHudLoader,
  type CircularHudMode,
} from "./CircularHudLoader";
export {
  HackerSnakeLoader,
  type HackerSnakeSize,
} from "./HackerSnakeLoader";
export { LoadingOverlay } from "./LoadingOverlay";
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