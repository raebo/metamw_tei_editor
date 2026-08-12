import React from 'react';
import { MiscUtils } from '@src/utils/misc';

export interface HighlightedTextProps {
  text: string;
  query: string;
  style?: React.CSSProperties;
}

const HIGHLIGHT_STYLE: React.CSSProperties = { fontWeight: 700, backgroundColor: 'yellow' };

/**
 * Renders `text` with every case-insensitive occurrence of `query` highlighted, as plain React
 * nodes. `text` typically comes from untrusted backend data (entity names, letter titles, ...),
 * so this deliberately never touches dangerouslySetInnerHTML/innerHTML - React escapes the
 * segments for us instead.
 */
const HighlightedText: React.FC<HighlightedTextProps> = ({ text, query, style }) => {
  const segments = MiscUtils.stringHandling.splitByQuery(text, query);

  return (
    <div style={style}>
      {segments.map((segment, index) =>
        segment.matched ? (
          <span key={index} style={HIGHLIGHT_STYLE}>
            {segment.text}
          </span>
        ) : (
          <React.Fragment key={index}>{segment.text}</React.Fragment>
        ),
      )}
    </div>
  );
};

export default HighlightedText;
