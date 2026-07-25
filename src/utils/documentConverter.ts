// Document-to-image converter: TXT, HTML, DOCX, XLSX → PNG blob

export function isDocumentFile(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const docExts = ['txt', 'html', 'htm', 'docx', 'xlsx', 'xls'];
  if (docExts.includes(ext)) return true;
  if (file.type === 'text/plain' || file.type === 'text/html') return true;
  if (file.type.includes('officedocument') || file.type.includes('spreadsheet')) return true;
  return false;
}

async function txtToImage(file: File): Promise<Blob> {
  const text = await file.text();
  const lines = text.split('\n');
  const fontSize = 14;
  const lineHeight = fontSize * 1.6;
  const padding = 20;
  const maxCharsPerLine = Math.max(...lines.map((l) => l.length), 1);
  const charWidth = fontSize * 0.6;

  const canvas = document.createElement('canvas');
  canvas.width = Math.min(maxCharsPerLine * charWidth + padding * 2, 1200);
  canvas.height = Math.max(lines.length * lineHeight + padding * 2, 100);

  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#1a1a1a';
  ctx.font = `${fontSize}px "Consolas", "Courier New", monospace`;

  let y = padding + fontSize;
  for (const line of lines) {
    let x = padding;
    for (const char of line) {
      ctx.fillText(char, x, y);
      x += ctx.measureText(char).width;
      if (x > canvas.width - padding) {
        x = padding;
        y += lineHeight;
      }
    }
    y += lineHeight;
  }

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
}

async function htmlToImage(file: File): Promise<Blob> {
  const html = await file.text();
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '1024px';
  container.style.background = '#ffffff';
  container.style.color = '#1a1a1a';
  container.style.fontFamily = 'sans-serif';
  container.style.padding = '20px';
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const { default: html2canvas } = await import('html2canvas');
    const result = await html2canvas(container, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
    });
    const blob = await new Promise<Blob>((resolve) => result.toBlob((b) => resolve(b!), 'image/png'));
    return blob;
  } finally {
    document.body.removeChild(container);
  }
}

async function docxToImage(file: File): Promise<Blob> {
  const { default: mammoth } = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = `<div style="font-family: sans-serif; color: #1a1a1a; line-height: 1.6;">${result.value}</div>`;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '1024px';
  container.style.background = '#ffffff';
  container.style.padding = '20px';
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(container, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
    });
    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
    return blob;
  } finally {
    document.body.removeChild(container);
  }
}

async function xlsxToImage(file: File): Promise<Blob> {
  const XLSX = await import('xlsx');
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const html = XLSX.utils.sheet_to_html(sheet, { id: 'xlsx-table', editable: false });

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.background = '#ffffff';
  container.style.padding = '20px';
  container.innerHTML = `
    <div style="font-family: sans-serif; color: #1a1a1a;">
      <h2 style="margin-bottom: 16px;">${sheetName}</h2>
      <style>
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: bold; }
      </style>
      ${html}
    </div>
  `;
  document.body.appendChild(container);

  try {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(container, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
    });
    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
    return blob;
  } finally {
    document.body.removeChild(container);
  }
}

export async function convertDocumentToImage(file: File): Promise<File> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  let blob: Blob;

  switch (ext) {
    case 'txt':
      blob = await txtToImage(file);
      break;
    case 'html':
    case 'htm':
      blob = await htmlToImage(file);
      break;
    case 'docx':
      blob = await docxToImage(file);
      break;
    case 'xlsx':
    case 'xls':
      blob = await xlsxToImage(file);
      break;
    default:
      throw new Error(`Unsupported document format: ${ext}`);
  }

  const baseName = file.name.replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}.png`, { type: 'image/png' });
}
