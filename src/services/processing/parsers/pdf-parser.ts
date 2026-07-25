const pdfParse = require("pdf-parse");
import { DocumentParser } from "./parser.interface";
import { ParsedDocument, Page } from "../processing.types";

export class PdfParser implements DocumentParser {
  async parse(buffer: Buffer, filename: string): Promise<ParsedDocument> {
    const startTime = Date.now();
    
    // We want page-level granularity if possible, but pdf-parse by default merges everything.
    // pdf-parse has a pagerender callback we could use, but for simplicity, we'll use the default output
    // and split by \n\n if needed, or just return as one block. Let's try to get pages if possible.
    
    const pages: Page[] = [];
    
    const renderPage = (pageData: any) => {
      const renderOptions = {
        normalizeWhitespace: false,
        disableCombineTextItems: false
      };
      
      return pageData.getTextContent(renderOptions)
        .then((textContent: any) => {
          let lastY, text = '';
          for (let item of textContent.items) {
            if (lastY == item.transform[5] || !lastY){
              text += item.str;
            } else {
              text += '\n' + item.str;
            }
            lastY = item.transform[5];
          }
          
          pages.push({
            pageNumber: pageData.pageIndex + 1,
            text: text
          });
          
          return text;
        });
    };

    const data = await pdfParse(buffer, { pagerender: renderPage });
    
    // If pages didn't populate (some versions of pdf-parse behave differently), we fallback
    if (pages.length === 0) {
      pages.push({ pageNumber: 1, text: data.text });
    }

    const extractionTimeMs = Date.now() - startTime;
    const wordCount = data.text.split(/\s+/).filter((w: string) => w.length > 0).length;

    return {
      text: data.text,
      pages,
      metadata: {
        pageCount: data.numpages,
        wordCount,
        characterCount: data.text.length,
        language: data.info?.Language || "unknown",
        hasTables: false, // pdf-parse can't easily detect tables
        hasImages: false, // pdf-parse can't easily detect images
        parserUsed: "pdf-parse",
        extractionTimeMs,
        ocrUsed: false,
      },
      tables: [],
      images: []
    };
  }
}
