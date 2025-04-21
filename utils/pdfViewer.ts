import pdf from 'pdf-parse';

export async function extractTextFromPDF(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const data = await pdf(Buffer.from(buffer));
  return data.text;
}