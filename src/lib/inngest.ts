import { Inngest } from "inngest";
import { processingService } from "@/services/processing/processing.service";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "knowledge-hub" });

// Define the durable background function for document processing
export const processDocumentJob = inngest.createFunction(
  { id: "process-document" },
  { event: "app/process.document" },
  async ({ event, step }) => {
    const { documentId, jobId } = event.data;
    
    // We execute the existing reliable processing logic
    // Inngest handles retries and background durable execution
    await step.run("execute-processing", async () => {
      await processingService.processDocument(documentId, jobId);
    });

    return { documentId, success: true };
  }
);
