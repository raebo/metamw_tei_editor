import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import EditorCommandMenuItem from '@src/components/editor/letter/Util/EditorCommandMenuItem';

describe('EditorCommandMenuItem', () => {
  it('renders a consistent label, shortcut and decorative submenu indicator', () => {
    render(<EditorCommandMenuItem label="Text auszeichnen" shortcut="Ctrl+1" hasSubMenu />);

    expect(screen.getByRole('menuitem', { name: 'Text auszeichnen Ctrl+1' })).toBeInTheDocument();
    expect(screen.getByText('Ctrl+1').tagName).toBe('KBD');
    expect(screen.getByTestId('ChevronRightIcon')).toHaveAttribute('aria-hidden', 'true');
  });

  it('uses a real disabled state and exposes its reason', () => {
    const onClick = jest.fn();
    render(
      <EditorCommandMenuItem
        label="Nach oben verschieben"
        disabled
        disabledReason="Der Schreibakt steht bereits an erster Stelle."
        onClick={onClick}
      />,
    );

    const item = screen.getByRole('menuitem', { name: 'Nach oben verschieben' });
    expect(item).toHaveAttribute('aria-disabled', 'true');
    expect(item).toHaveAttribute('title', 'Der Schreibakt steht bereits an erster Stelle.');
    fireEvent.click(item);
    expect(onClick).not.toHaveBeenCalled();
  });
});
