import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchFigureImage } from '@src/services/editor/apiFigureRequest.service';

interface FigureImageProps {
  letterId: number | null;
  figureXmlId: string | null;
  description: string | null;
}

type FigureImageStatus = 'loading' | 'ready' | 'error';

const FigureImage = ({ letterId, figureXmlId, description }: FigureImageProps) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<FigureImageStatus>('loading');
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const objectUrlRef = useRef<string | null>(null);

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    revokeObjectUrl();
    setObjectUrl(null);

    if (letterId === null || !figureXmlId) {
      setStatus('error');
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
      .catch(() => {
        if (!abortController.signal.aborted && isActive) {
          setStatus('error');
        }
      });

    return () => {
      isActive = false;
      abortController.abort();
      revokeObjectUrl();
    };
  }, [figureXmlId, letterId, retryCount, revokeObjectUrl]);

  const altText = description?.trim() || t('editor:common.figure.defaultAlt');

  if (status === 'loading') {
    return (
      <span className="tei-figure-status" role="status">
        {t('editor:common.figure.loading')}
      </span>
    );
  }

  if (status === 'error' || !objectUrl) {
    return (
      <span className="tei-figure-status tei-figure-status--error" role="alert">
        <span role="img" aria-label={altText}>
          {t('editor:common.figure.unavailable')}
        </span>
        {letterId !== null && figureXmlId && (
          <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
            {t('editor:common.figure.retry')}
          </button>
        )}
      </span>
    );
  }

  return (
    <img
      className="tei-figure-image"
      src={objectUrl}
      alt={altText}
      onError={() => {
        revokeObjectUrl();
        setObjectUrl(null);
        setStatus('error');
      }}
    />
  );
};

export default FigureImage;
