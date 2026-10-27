import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import { ToolbarMenuButton } from '@src/components/editor/letter/Util/ToolbarMenuButton';
import theme from '@src/utils/theme/theme';

const renderButton = (props: Partial<React.ComponentProps<typeof ToolbarMenuButton>> = {}) => {
  const onClick = jest.fn();

  render(
    <ThemeProvider theme={theme}>
      <ToolbarMenuButton title="Brief umbenennen" onClick={onClick} icon={<EditIcon />} {...props} />
    </ThemeProvider>,
  );

  return { onClick };
};

describe('ToolbarMenuButton', () => {
  it('invokes its action when enabled', () => {
    const { onClick } = renderButton();

    fireEvent.click(screen.getByRole('button', { name: 'Brief umbenennen' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('remains focusable and explains why a disabled action is unavailable', async () => {
    const disabledReason = 'Diese Funktion ist noch nicht verfügbar.';
    const { onClick } = renderButton({ disabled: true, disabledReason });
    const button = screen.getByRole('button', { name: 'Brief umbenennen' });

    expect(button).toHaveAttribute('aria-disabled', 'true');
    act(() => button.focus());

    expect(await screen.findByText(disabledReason)).toBeInTheDocument();

    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
