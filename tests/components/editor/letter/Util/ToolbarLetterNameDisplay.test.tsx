import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { ToolbarLetterNameDisplay } from '@src/components/editor/letter/Util/ToolbarLetterNameDisplay';
import theme from '@src/utils/theme/theme';

const renderName = (xmlContent: string | null) =>
  render(
    <ThemeProvider theme={theme}>
      <ToolbarLetterNameDisplay letterName="fmb-1840-06-06-01" xmlContent={xmlContent} />
    </ThemeProvider>,
  );

describe('ToolbarLetterNameDisplay', () => {
  it.each([
    ['draft', 'Draft'],
    ['live', 'Live'],
  ] as const)('shows the canonical %s revision status below the letter name', (status, label) => {
    renderName(`<TEI xmlns="http://www.tei-c.org/ns/1.0"><teiHeader><revisionDesc status="${status}"/></teiHeader></TEI>`);

    expect(screen.getByText('fmb-1840-06-06-01')).toBeInTheDocument();
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('does not invent a status for missing or malformed revision metadata', () => {
    renderName('<TEI><teiHeader/></TEI>');

    expect(screen.getByText('fmb-1840-06-06-01')).toBeInTheDocument();
  });
});
