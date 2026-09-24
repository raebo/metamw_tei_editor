import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchFigureImage } from '@src/services/editor/apiFigureRequest.service';
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import type { FigureImageMap, ImageMapZone } from '@src/utils/editor/graphicStructure';

interface FigureImageProps {
  letterId: number | null;
  figureXmlId: string | null;
  description: string | null;
  imageMap: FigureImageMap | null;
}

type FigureImageStatus = 'loading' | 'ready' | 'not-found' | 'error';
const MIN_PREVIEW_ZOOM = 0.5;
const MAX_PREVIEW_ZOOM = 3;
const PREVIEW_ZOOM_STEP = 0.25;

const responseStatus = (error: unknown): number | undefined =>
  typeof error === 'object' && error !== null && 'response' in error
    ? (error as { response?: { status?: number } }).response?.status
    : undefined;

const polygonStyle = (zone: Extract<ImageMapZone, { shape: 'polygon' }>, imageMap: FigureImageMap): React.CSSProperties | null => {
  const coordinates = zone.points
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(',').map(Number));
  if (
    coordinates.length < 3 ||
    coordinates.some(
      (pair) =>
        pair.length !== 2 ||
        pair.some((value) => !Number.isFinite(value)) ||
        pair[0] < 0 ||
        pair[1] < 0 ||
        pair[0] > imageMap.width ||
        pair[1] > imageMap.height,
    )
  )
    return null;
  const points = coordinates.map(([x, y]) => `${(x / imageMap.width) * 100}% ${(y / imageMap.height) * 100}%`).join(', ');
  return { inset: 0, clipPath: `polygon(${points})` };
};

const zoneStyle = (zone: ImageMapZone, imageMap: FigureImageMap): React.CSSProperties | null => {
  if (imageMap.width <= 0 || imageMap.height <= 0) return null;
  if (zone.shape === 'polygon') return polygonStyle(zone, imageMap);
  if (
    [zone.ulx, zone.uly, zone.lrx, zone.lry].some((value) => !Number.isFinite(value) || value < 0) ||
    zone.ulx >= zone.lrx ||
    zone.uly >= zone.lry ||
    zone.lrx > imageMap.width ||
    zone.lry > imageMap.height
  )
    return null;
  return {
    left: `${(zone.ulx / imageMap.width) * 100}%`,
    top: `${(zone.uly / imageMap.height) * 100}%`,
    width: `${((zone.lrx - zone.ulx) / imageMap.width) * 100}%`,
    height: `${((zone.lry - zone.uly) / imageMap.height) * 100}%`,
  };
};

const FigureImage = ({ letterId, figureXmlId, description, imageMap }: FigureImageProps) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<FigureImageStatus>(letterId === null || !figureXmlId ? 'not-found' : 'loading');
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [areasVisible, setAreasVisible] = useState(false);
  const objectUrlRef = useRef<string | null>(null);
  const previewTitleId = useId();

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    revokeObjectUrl();
    setObjectUrl(null);
    setPreviewOpen(false);

    if (letterId === null || !figureXmlId) {
      setStatus('not-found');
      return;
    }

    const abortController = new AbortController();
    let isActive = true;
    setStatus('loading');

    void fetchFigureImage(letterId, figureXmlId, abortController.signal)
      .then((blob) => {
        const nextObjectUrl = URL.createObjectURL(blob);
        if (!isActive) {
          URL.revokeObjectURL(nextObjectUrl);
          return;
        }

        objectUrlRef.current = nextObjectUrl;
        setObjectUrl(nextObjectUrl);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (!abortController.signal.aborted && isActive) {
          setStatus(responseStatus(error) === 404 ? 'not-found' : 'error');
        }
      });

    return () => {
      isActive = false;
      abortController.abort();
      revokeObjectUrl();
    };
  }, [figureXmlId, letterId, retryCount, revokeObjectUrl]);

  const altText = description?.trim() || t('editor:common.figure.defaultAlt');
  const validZones =
    imageMap?.zones
      .map((zone) => ({ zone, style: zoneStyle(zone, imageMap) }))
      .filter((entry): entry is { zone: ImageMapZone; style: React.CSSProperties } => entry.style !== null) ?? [];

  if (status === 'loading') {
    return (
      <span className="tei-figure-status" role="status">
        {t('editor:common.figure.loading')}
      </span>
    );
  }

  if (status === 'not-found' || status === 'error' || !objectUrl) {
    return (
      <span className="tei-figure-status tei-figure-status--error" role="alert">
        <span role="img" aria-label={altText}>
          {t(status === 'not-found' ? 'editor:common.figure.notFound' : 'editor:common.figure.unavailable')}
        </span>
        {status === 'error' && letterId !== null && figureXmlId && (
          <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
            {t('editor:common.figure.retry')}
          </button>
        )}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        className="tei-figure-preview-trigger"
        aria-label={t('editor:common.figure.openPreview', { description: altText })}
        aria-haspopup="dialog"
        onClick={() => {
          setPreviewZoom(1);
          setPreviewOpen(true);
        }}
      >
        <img
          className="tei-figure-image"
          src={objectUrl}
          alt={altText}
          onError={() => {
            setPreviewOpen(false);
            revokeObjectUrl();
            setObjectUrl(null);
            setStatus('error');
          }}
        />
        {areasVisible &&
          validZones.map(({ zone, style }, index) => (
            <span key={zone.id || index} className="tei-image-map-area" style={style} title={zone.label || zone.id} aria-hidden="true" />
          ))}
      </button>
      {validZones.length > 0 && (
        <>
          <button
            type="button"
            className="tei-image-map-toggle"
            aria-expanded={areasVisible}
            onClick={() => setAreasVisible((visible) => !visible)}
          >
            {t(areasVisible ? 'editor:dialog.graphicStructure.hideAreas' : 'editor:dialog.graphicStructure.toggleAreas')}
          </button>
          {areasVisible && (
            <ol className="tei-image-map-area-list">
              {validZones.map(({ zone }, index) => (
                <li key={zone.id || index}>{zone.label || zone.id}</li>
              ))}
            </ol>
          )}
        </>
      )}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="xl"
        aria-labelledby={previewTitleId}
        PaperProps={{ className: 'tei-figure-preview-panel' }}
      >
        <DialogTitle id={previewTitleId} className="tei-figure-preview-title">
          {altText}
          <IconButton aria-label={t('editor:common.figure.closePreview')} onClick={() => setPreviewOpen(false)} edge="end">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers className="tei-figure-preview-content">
          <Box className="tei-figure-preview-toolbar">
            <IconButton
              aria-label={t('editor:common.figure.zoomOut')}
              disabled={previewZoom <= MIN_PREVIEW_ZOOM}
              onClick={() => setPreviewZoom((zoom) => Math.max(MIN_PREVIEW_ZOOM, zoom - PREVIEW_ZOOM_STEP))}
            >
              <ZoomOutIcon />
            </IconButton>
            <Typography aria-live="polite" className="tei-figure-preview-zoom-value">
              {Math.round(previewZoom * 100)}%
            </Typography>
            <IconButton
              aria-label={t('editor:common.figure.zoomIn')}
              disabled={previewZoom >= MAX_PREVIEW_ZOOM}
              onClick={() => setPreviewZoom((zoom) => Math.min(MAX_PREVIEW_ZOOM, zoom + PREVIEW_ZOOM_STEP))}
            >
              <ZoomInIcon />
            </IconButton>
            <IconButton aria-label={t('editor:common.figure.resetZoom')} disabled={previewZoom === 1} onClick={() => setPreviewZoom(1)}>
              <RestartAltIcon />
            </IconButton>
          </Box>
          <Box className="tei-figure-preview-viewport">
            <Box className="tei-figure-preview-canvas" data-testid="figure-preview-canvas" style={{ width: `${previewZoom * 100}%` }}>
              <img className="tei-figure-preview-image" src={objectUrl} alt={altText} />
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FigureImage;
