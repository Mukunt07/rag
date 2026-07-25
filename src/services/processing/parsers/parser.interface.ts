import { ParsedDocument } from "../processing.types";

export interface DocumentParser {
  /**
   * Parses the given file buffer into a standard ParsedDocument format.
   * @param buffer The file buffer to parse
   * @param filename The original filename
   */
  parse(buffer: Buffer, filename: string): Promise<ParsedDocument>;
}
