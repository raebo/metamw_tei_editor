import React from 'react';
import { render, screen } from '@testing-library/react';
import HighlightedText from '@src/components/support/HighlightedText';

describe('HighlightedText', () => {
  it('renders the text unhighlighted when there is no query', () => {
    render(<HighlightedText text="Anna Mustermann" query="" />);

    expect(screen.getByText('Anna Mustermann')).toBeInTheDocument();
  });

  it('wraps the matched part in a highlighted span', () => {
    const { container } = render(<HighlightedText text="Anna Mustermann" query="anna" />);

    const highlighted = container.querySelector('span');
    expect(highlighted).toHaveTextContent('Anna');
    expect(highlighted).toHaveStyle({ fontWeight: 700, backgroundColor: 'yellow' });
  });

  // Regression: this used to be `dangerouslySetInnerHTML={{ __html: highlightText(...) }}`,
  // so a backend-provided name like this would have been rendered as a live <img> element and
  // executed its onerror handler. HighlightedText must render it as inert text instead.
  it('renders an XSS payload as plain text instead of executing it', () => {
    const payload = '<img src=x onerror=alert(1)>Anna';

    const { container } = render(<HighlightedText text={payload} query="anna" />);

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.textContent).toBe(payload);
  });

  it('renders an XSS payload contained in the query itself as plain text', () => {
    const payload = '<svg onload=alert(1)>';

    const { container } = render(
      <HighlightedText text={`Anna ${payload} Mustermann`} query={payload} />,
    );

    expect(container.querySelector('svg')).not.toBeInTheDocument();
    expect(container.textContent).toBe(`Anna ${payload} Mustermann`);
  });
});
