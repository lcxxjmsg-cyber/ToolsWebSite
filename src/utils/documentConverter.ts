// Document-to-image converter: TXT, HTML, DOCX, XLSX, PDF → PNG(s) with pagination

const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1122;
const SCALE = 2;

export function isDocumentFile(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const docExts = ['txt', 'html', 'htm', 'docx', 'xlsx', 'xls', 'pdf'];
  if (docExts.includes(ext)) return true;
  if (file.type === 'text/plain' || file.type === 'text/html' || file.type === 'application/pdf') return true;
  if (file.type.includes('officedocument') || file.type.includes('spreadsheet')) return true;
  return false;
}

function sliceCanvas(canvas: HTMLCanvasElement, pageH: number): HTMLCanvasElement[] {
  const pages: HTMLCanvasElement[] = [];
  let y = 0;
  while (y < canvas.height) {
    const h = Math.min(pageH, canvas.height - y);
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = h;
    const ctx = pageCanvas.getContext('2d')!;
    ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
    pages.push(pageCanvas);
    y += pageH;
  }
  return pages;
}

function canvasToFileSync(canvas: HTMLCanvasElement, name: string): File {
  const dataUrl = canvas.toDataURL('image/png');
  const byteString = atob(dataUrl.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  return new File([new Blob([ab], { type: 'image/png' })], name, { type: 'image/png' });
}

async function renderHtmlToPages(html: string, title?: string): Promise<File[]> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = `${PAGE_WIDTH}px`;
  container.style.background = '#ffffff';
  container.style.color = '#1a1a1a';
  container.style.fontFamily = 'sans-serif';
  container.style.padding = '20px';
  container.style.wordBreak = 'break-word';
  container.innerHTML = title ? `<h2>${title}</h2>${html}` : html;
  document.body.appendChild(container);

  try {
    const { default: html2canvas } = await import('html2canvas');
    const fullCanvas = await html2canvas(container, {
      backgroundColor: '#ffffff',
      scale: SCALE,
      useCORS: true,
    });
    document.body.removeChild(container);

    const pageH = PAGE_HEIGHT * SCALE;
    if (fullCanvas.height <= pageH) {
      return [canvasToFileSync(fullCanvas, 'page.png')];
    }

    const pages = sliceCanvas(fullCanvas, pageH);
    return pages.map((c, i) => canvasToFileSync(c, `page_${i + 1}.png`));
  } catch {
    document.body.removeChild(container);
    throw new Error('HTML rendering failed');
  }
}

async function txtToFile(file: File): Promise<File[]> {
  const text = await file.text();
  const fontName = '"Consolas", "Courier New", monospace';
  const fontSize = 14;
  const lineHeight = fontSize * 1.6;
  const padding = 20;
  const pageContentWidth = PAGE_WIDTH - padding * 2;
  const pageContentHeight = PAGE_HEIGHT - padding * 2;

  // Measure char width for wrapping
  const measureCanvas = document.createElement('canvas');
  const mctx = measureCanvas.getContext('2d')!;
  mctx.font = `${fontSize}px ${fontName}`;

  // Wrap lines to fit page width
  const lines = text.split('\n');
  const wrappedLines: string[] = [];
  for (const line of lines) {
    if (line.length === 0) {
      wrappedLines.push('');
      continue;
    }
    let current = '';
    for (const char of line) {
      const w = mctx.measureText(current + char).width;
      if (w > pageContentWidth && current.length > 0) {
        wrappedLines.push(current);
        current = char;
      } else {
        current += char;
      }
    }
    if (current) wrappedLines.push(current);
  }

  const linesPerPage = Math.floor(pageContentHeight / lineHeight);
  const pageCount = Math.ceil(wrappedLines.length / linesPerPage) || 1;

  const files: File[] = [];
  for (let p = 0; p < pageCount; p++) {
    const canvas = document.createElement('canvas');
    canvas.width = PAGE_WIDTH * SCALE;
    canvas.height = PAGE_HEIGHT * SCALE;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(SCALE, SCALE);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    ctx.fillStyle = '#1a1a1a';
    ctx.font = `${fontSize}px ${fontName}`;
    ctx.textBaseline = 'top';

    const startLine = p * linesPerPage;
    const endLine = Math.min((p + 1) * linesPerPage, wrappedLines.length);
    let y = padding;
    for (let i = startLine; i < endLine; i++) {
      ctx.fillText(wrappedLines[i], padding, y);
      y += lineHeight;
      if (y > pageContentHeight + padding) break;
    }

    files.push(canvasToFileSync(canvas, `page_${p + 1}.png`));
  }

  return files;
}

async function htmlToFile(file: File): Promise<File[]> {
  const html = await file.text();
  return renderHtmlToPages(html);
}

async function docxToFile(file: File): Promise<File[]> {
  const { default: mammoth } = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return renderHtmlToPages(`<div style="line-height:1.6;">${result.value}</div>`);
}

async function xlsxToFile(file: File): Promise<File[]> {
  const XLSX = await import('xlsx');
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const allFiles: File[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const tableHtml = XLSX.utils.sheet_to_html(sheet, { id: `sheet-${sheetName}`, editable: false });

    const html = `
      <style>
        table { border-collapse: collapse; width: 100%; font-size: 13px; }
        td, th { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: bold; }
      </style>
      ${tableHtml}
    `;

    const sheetFiles = await renderHtmlToPages(html, sheetName);

    const safeName = sheetName.replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, '_');
    sheetFiles.forEach((f, i) => {
      const newFile = new File([f], `sheet_${safeName}_${i + 1}.png`, { type: 'image/png' });
      allFiles.push(newFile);
    });
  }

  return allFiles;
}

async function pdfToFile(file: File): Promise<File[]> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const files: File[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: SCALE });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    files.push(canvasToFileSync(canvas, `page_${i}.png`));
  }

  return files;
}

export async function convertDocumentToImage(file: File): Promise<File[]> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const baseName = file.name.replace(/\.[^.]+$/, '');

  let pages: File[];
  switch (ext) {
    case 'txt':
      pages = await txtToFile(file);
      break;
    case 'html':
    case 'htm':
      pages = await htmlToFile(file);
      break;
    case 'docx':
      pages = await docxToFile(file);
      break;
    case 'xlsx':
    case 'xls':
      pages = await xlsxToFile(file);
      break;
    case 'pdf':
      pages = await pdfToFile(file);
      break;
    default:
      throw new Error(`Unsupported document format: ${ext}`);
  }

  return pages.map((p, i) => {
    const label = pages.length > 1 ? `_${i + 1}` : '';
    return new File([p], `${baseName}${label}.png`, { type: 'image/png' });
  });
}
