import { initApi } from '@src/services/apiRequest.service';
import { z } from 'zod';

const ALLOWED_FIGURE_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/svg+xml']);

const figureUploadResponseSchema = z.object({
  letter_id: z.string(),
  figure_xml_id: z.string().min(1),
  filename: z.string(),
  content_type: z.enum(['image/jpeg', 'image/png']),
  graphic_url: z.string(),
  preview_url: z.string(),
  xml_content: z.string(),
  undo_available: z.boolean(),
  redo_available: z.boolean(),
});

export type FigureCategory = 'notation' | 'drawing';
export type FigurePosition = 'before' | 'after' | 'append';
export type FigureUploadResponse = z.infer<typeof figureUploadResponseSchema>;

export interface FigureUploadInput {
  image: File;
  category: FigureCategory;
  anchorXmlId: string;
  position: FigurePosition;
  head?: string;
  figDesc?: string;
}

const normalizeContentType = (contentType: unknown): string =>
  typeof contentType === 'string' ? contentType.split(';', 1)[0].trim().toLowerCase() : '';

export const fetchFigureImage = async (letterId: number, figureXmlId: string, signal?: AbortSignal): Promise<Blob> => {
  const response = await initApi().get<Blob>(`/jwt/editor/pinned_letters/${letterId}/figures/${encodeURIComponent(figureXmlId)}/image`, {
    responseType: 'blob',
    signal,
  });
  const contentType = normalizeContentType(response.headers?.['content-type'] || response.data.type);

  if (!ALLOWED_FIGURE_CONTENT_TYPES.has(contentType)) {
    throw new Error('Unsupported figure image content type');
  }

  return response.data;
};

export const uploadFigure = async (letterId: number, input: FigureUploadInput): Promise<FigureUploadResponse> => {
  const body = new FormData();
  body.append('image', input.image);
  body.append('category', input.category);
  body.append('anchor_xml_id', input.anchorXmlId);
  body.append('position', input.position);
  if (input.head?.trim()) body.append('head', input.head.trim());
  if (input.figDesc?.trim()) body.append('fig_desc', input.figDesc.trim());

  const response = await initApi().post(`/jwt/editor/pinned_letters/${letterId}/figures`, body);

  return figureUploadResponseSchema.parse(response.data);
};
