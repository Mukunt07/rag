import * as xlsx from "xlsx";
import { DocumentParser } from "./parser.interface";
import { ParsedDocument, Page, Table } from "../processing.types";

export class ExcelParser implements DocumentParser {
  async parse(buffer: Buffer, filename: string): Promise<ParsedDocument> {
    const startTime = Date.now();
    
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    
    let fullText = "";
    const pages: Page[] = [];
    const tables: Table[] = [];
    
    workbook.SheetNames.forEach((sheetName, index) => {
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to CSV for raw text extraction
      const csv = xlsx.utils.sheet_to_csv(worksheet);
      
      // Convert to JSON for table representation
      const json = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
      
      fullText += `Sheet: ${sheetName}\n${csv}\n\n`;
      
      pages.push({
        pageNumber: index + 1,
        text: `Sheet: ${sheetName}\n${csv}`
      });
      
      if (json.length > 0) {
        tables.push({
          pageNumber: index + 1,
          data: json,
          markdown: this.generateMarkdownTable(json)
        });
      }
    });

    const extractionTimeMs = Date.now() - startTime;
    const wordCount = fullText.split(/\s+/).filter(w => w.length > 0).length;

    return {
      text: fullText,
      pages,
      metadata: {
        pageCount: workbook.SheetNames.length,
        wordCount,
        characterCount: fullText.length,
        language: "unknown",
        hasTables: tables.length > 0,
        hasImages: false,
        parserUsed: "xlsx",
        extractionTimeMs,
        ocrUsed: false,
      },
      tables,
      images: []
    };
  }
  
  private generateMarkdownTable(data: any[][]): string {
    if (data.length === 0) return "";
    
    // Assumes row 0 is header
    const headers = data[0].map(h => String(h || ''));
    const separator = headers.map(() => '---');
    const rows = data.slice(1).map(row => {
      // pad row to header length if necessary
      const paddedRow = [...row];
      while(paddedRow.length < headers.length) paddedRow.push("");
      return paddedRow.map(c => String(c || '')).join(' | ');
    });
    
    return [
      headers.join(' | '),
      separator.join(' | '),
      ...rows
    ].join('\n');
  }
}
