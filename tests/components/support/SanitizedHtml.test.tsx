import React from 'react';
import { render } from '@testing-library/react';
import SanitizedHtml from '@src/components/support/SanitizedHtml';

describe('SanitizedHtml', () => {
  it('renders plain text as-is', () => {
    const { container } = render(<SanitizedHtml html="Hello world" />);

    expect(container).toHaveTextContent('Hello world');
  });

  it('keeps allowlisted inline formatting tags', () => {
    const { container } = render(<SanitizedHtml html="Hello <em>world</em>" />);

    const em = container.querySelector('em');
    expect(em).toHaveTextContent('world');
  });

  it('keeps the class attribute on allowlisted tags', () => {
    const { container } = render(<SanitizedHtml html='<span class="marked">hit</span>' />);

    const span = container.querySelector('span.marked');
    expect(span).toHaveTextContent('hit');
  });

  it('applies the wrapper id/className props', () => {
    const { container } = render(
      <SanitizedHtml html="text" id="wrapper-id" className="wrapper-class" />,
    );

    const wrapper = container.querySelector('#wrapper-id');
    expect(wrapper).toHaveClass('wrapper-class');
  });

  // Regression: AddNoteDialog/EditNoteDialog used to render `parentElement.innerHTML` of a
  // passage taken from the letter document via dangerouslySetInnerHTML. That is untrusted,
  // TEI-derived markup - a crafted element must never end up as a live, executable DOM node.
  it('drops <img onerror=...> instead of creating a live img element', () => {
    const payload = '<img src=x onerror=alert(1)>Anna';

    const { container } = render(<SanitizedHtml html={payload} />);

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container).toHaveTextContent('Anna');
  });

  it('drops <svg onload=...> instead of creating a live svg element', () => {
    const payload = '<svg onload=alert(1)><circle/></svg>Anna';

    const { container } = render(<SanitizedHtml html={payload} />);

    expect(container.querySelector('svg')).not.toBeInTheDocument();
    expect(container).toHaveTextContent('Anna');
  });

  it('drops a javascript: link instead of creating a live anchor element', () => {
    const payload = '<a href="javascript:alert(1)">click me</a>';

    const { container } = render(<SanitizedHtml html={payload} />);

    expect(container.querySelector('a')).not.toBeInTheDocument();
    expect(container).toHaveTextContent('click me');
  });

  it('strips an on* attribute even on an otherwise allowlisted tag', () => {
    const payload = '<span onerror="alert(1)" onclick="alert(2)">hit</span>';

    const { container } = render(<SanitizedHtml html={payload} />);

    const span = container.querySelector('span');
    expect(span).not.toBeNull();
    expect(span).toHaveTextContent('hit');
    expect(span?.getAttribute('onerror')).toBeNull();
    expect(span?.getAttribute('onclick')).toBeNull();
  });

  it('drops <script> tags including their content entirely', () => {
    const payload = 'before<script>window.__pwned = true;</script>after';

    const { container } = render(<SanitizedHtml html={payload} />);

    expect(container.querySelector('script')).not.toBeInTheDocument();
    expect(container).toHaveTextContent('beforeafter');
    expect((window as unknown as { __pwned?: boolean }).__pwned).toBeUndefined();
  });
});
