import { Skeleton } from "@/components/ui/skeleton"

export default function GlobalLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-6 w-full max-w-sm">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
        </div>
        <Skeleton className="h-[2px] w-full" />
        <div className="space-y-3 w-full">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg opacity-80" />
          <Skeleton className="h-10 w-full rounded-lg opacity-60" />
        </div>
      </div>
    </div>
  )
}
