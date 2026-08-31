import { serve } from "inngest/next";
import { inngest, processDocumentJob } from "@/lib/inngest";

// Create an API that serves zero-downtime background jobs
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processDocumentJob,
  ],
});
