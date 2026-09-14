import { Skeleton } from "./Skeleton";
import {
  HackerSnakeLoader,
  type HackerSnakeSize,
} from "./HackerSnakeLoader";

type PageLoaderProps = {
  label?: string;
  variant?: "page" | "section" | "inline";
  className?: string;
};

const wrapperClasses: Record<NonNullable<PageLoaderProps["variant"]>, string> = {
  page: "min-h-[60vh]",
  section: "min-h-[30vh]",
  inline: "",
};

const snakeSizes: Record<NonNullable<PageLoaderProps["variant"]>, HackerSnakeSize> = {
  page: "full",
  section: "lg",
  inline: "sm",
};

export function PageLoader({
  label,
  variant = "page",
  className = "",
}: PageLoaderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center ${wrapperClasses[variant]} ${className}`}
    >
      <HackerSnakeLoader size={snakeSizes[variant]} message={label} />
    </div>
  );
}

type BlockLoaderProps = {
  count?: number;
  className?: string;
};

export function BlockLoader({ count = 3, className = "" }: BlockLoaderProps) {
  return (
    <div aria-hidden className={`grid gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-lg border border-[#252525] bg-[#0D0D0F]"
        >
          <Skeleton className="aspect-[16/8] rounded-none border-0 border-b border-[#252525]" />
          <div className="space-y-3 p-6">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="mt-3 h-3.5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}