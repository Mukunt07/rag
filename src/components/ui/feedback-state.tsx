import { motion } from "framer-motion"
import { CheckCircle2, XCircle, AlertCircle, Inbox } from "lucide-react"
import { Spinner } from "./spinner"
import { cn } from "@/lib/utils"

export type FeedbackStatus = "idle" | "loading" | "success" | "error" | "empty"

interface FeedbackStateProps {
  status: FeedbackStatus
  loadingTitle?: string
  loadingDescription?: string
  successTitle?: string
  successDescription?: string
  errorTitle?: string
  errorDescription?: string
  emptyTitle?: string
  emptyDescription?: string
  className?: string
}

export function FeedbackState({
  status,
  loadingTitle = "Loading...",
  loadingDescription = "Please wait a moment.",
  successTitle = "Success!",
  successDescription = "The operation was completed successfully.",
  errorTitle = "Error",
  errorDescription = "Something went wrong. Please try again.",
  emptyTitle = "No data found",
  emptyDescription = "There is nothing to display here yet.",
  className,
}: FeedbackStateProps) {
  if (status === "idle") return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center",
        className
      )}
    >
      {status === "loading" && (
        <div className="flex flex-col items-center space-y-4">
          <Spinner size="xl" className="text-primary" />
          <div className="space-y-1">
            <h3 className="text-lg font-medium">{loadingTitle}</h3>
            <p className="text-sm text-muted-foreground">{loadingDescription}</p>
          </div>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center space-y-4">
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          </motion.div>
          <div className="space-y-1">
            <h3 className="text-lg font-medium text-emerald-600 dark:text-emerald-400">{successTitle}</h3>
            <p className="text-sm text-muted-foreground">{successDescription}</p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center space-y-4">
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <XCircle className="h-12 w-12 text-destructive" />
          </motion.div>
          <div className="space-y-1">
            <h3 className="text-lg font-medium text-destructive">{errorTitle}</h3>
            <p className="text-sm text-muted-foreground">{errorDescription}</p>
          </div>
        </div>
      )}

      {status === "empty" && (
        <div className="flex flex-col items-center space-y-4">
          <div className="rounded-full bg-muted p-3">
            <Inbox className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-medium">{emptyTitle}</h3>
            <p className="text-sm text-muted-foreground">{emptyDescription}</p>
          </div>
        </div>
      )}
    </motion.div>
  )
}
