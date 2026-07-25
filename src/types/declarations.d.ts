declare module 'omggif' {
  export interface FrameInfo {
    x: number;
    y: number;
    width: number;
    height: number;
    disposal: number;
    delay: number;
    has_local_palette: boolean;
    palette_offset: number | null;
  }

  export class GifReader {
    constructor(buf: Uint8Array);
    numFrames(): number;
    frameInfo(frame: number): FrameInfo;
    width: number;
    height: number;
    decodeAndBlitFrameRGBA(frame: number, pixels: Uint8Array | Uint8ClampedArray): void;
  }
}

declare module 'gifenc' {
  export interface FrameOptions {
    palette: number[][];
    delay?: number;
    transparent?: boolean;
    dispose?: number;
    repeat?: number;
  }

  export function GIFEncoder(): {
    writeFrame(
      indexed: Uint8Array,
      width: number,
      height: number,
      options: FrameOptions,
    ): void;
    finish(): void;
    bytes(): Uint8Array;
    bytesView(): Uint8Array;
    readonly size: number;
  };

  export function quantize(
    imageData: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: { format?: 'rgb444' | 'rgb565'; oneBitAlpha?: boolean },
  ): number[][];

  export function applyPalette(
    imageData: Uint8Array | Uint8ClampedArray,
    palette: number[][],
    format?: 'rgb444' | 'rgb565',
  ): Uint8Array;
}

declare module 'exif-js' {
  const EXIF: {
    readFromBinaryFile(arrayBuffer: ArrayBuffer): Record<string, unknown>;
    getData(img: HTMLImageElement, callback: () => void): void;
    getTag(img: HTMLImageElement, tag: string): unknown;
    getAllTags(img: HTMLImageElement): Record<string, unknown>;
    pretty(img: HTMLImageElement): string;
    readFromBinaryFile(buffer: ArrayBuffer): Record<string, unknown>;
  };
  export default EXIF;
}

declare module 'xlsx' {
  interface WorkBook {
    SheetNames: string[];
    Sheets: Record<string, WorkSheet>;
  }
  interface WorkSheet {
    [key: string]: unknown;
  }
  export function read(data: ArrayBuffer, opts: { type: string }): WorkBook;
  export const utils: {
    sheet_to_html(sheet: WorkSheet, opts?: Record<string, unknown>): string;
  };
}

declare module 'mammoth' {
  interface Result {
    value: string;
    messages: unknown[];
  }
  export function convertToHtml(opts: { arrayBuffer: ArrayBuffer }): Promise<Result>;
}

declare module 'html2canvas' {
  interface Options {
    backgroundColor?: string;
    scale?: number;
    useCORS?: boolean;
  }
  function html2canvas(element: HTMLElement, options?: Options): Promise<HTMLCanvasElement>;
  export default html2canvas;
}

declare module 'pdfjs-dist' {
  export const GlobalWorkerOptions: { workerSrc: string };
  export function getDocument(opts: { data: ArrayBuffer; url?: string }): {
    promise: Promise<PDFDocumentProxy>;
  };
  interface PDFDocumentProxy {
    numPages: number;
    getPage(num: number): Promise<PDFPageProxy>;
  }
  interface PDFPageProxy {
    getViewport(opts: { scale: number }): { width: number; height: number };
    render(opts: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }): { promise: Promise<void> };
  }
}
