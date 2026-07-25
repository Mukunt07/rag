import { Skeleton } from "@/components/ui/skeleton"

export default function DocumentsLoading() {
  return (
    <div className="flex h-full flex-col p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-10 w-[250px] mb-2" />
          <Skeleton className="h-4 w-[350px]" />
        </div>
        <Skeleton className="h-10 w-[150px]" />
      </div>

      <div className="flex items-center space-x-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-10 w-[120px]" />
      </div>
      
      <div className="rounded-md border">
        <div className="flex flex-col">
          <div className="border-b p-4">
            <div className="grid grid-cols-4 gap-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[50px] ml-auto" />
            </div>
          </div>
          
          <div className="divide-y">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 grid grid-cols-4 gap-4 items-center">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-8 w-8 rounded ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
