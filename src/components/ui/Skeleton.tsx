import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[#5B5F73]/20 dark:bg-[#5B5F73]/30", className)}
      {...props}
    />
  )
}

export { Skeleton }
