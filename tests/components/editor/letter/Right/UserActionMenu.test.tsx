import React, { useLayoutEffect, useRef, useState } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import '@src/i18n';
import { EditorConstants } from '@src/constants/editor';
import UserActionMenu from '@src/components/editor/letter/Right/UserActionMenu';
import editorLetterReducer, { setContentTextIsMarked, setEditorLetter } from '@src/redux/slices/editor.letter.slice';

const MenuHarness = () => {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setAnchorEl(anchorRef.current);
  }, []);

  return (
    <>
      <button ref={anchorRef}>Aktionen</button>
      <UserActionMenu anchorEl={anchorEl} open={Boolean(anchorEl)} handleClose={jest.fn()} />
    </>
  );
};

const renderMenu = ({ letterLoaded = false, selectionActive = false } = {}) => {
  const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });

  if (letterLoaded) {
    store.dispatch(
      setEditorLetter({
        letter: {
          id: 7,
          name: 'fmb-1801-01-01-01',
          viewMode: 'WYSIWYG',
          xmlContent: '<TEI><text><body><div><p>Text</p></div></body></text></TEI>',
        },
      }),
    );
  }
  if (selectionActive) {
    store.dispatch(setContentTextIsMarked({ textIsMarked: true }));
  }

  render(
    <Provider store={store}>
      <MenuHarness />
    </Provider>,
  );

  return store;
};

describe('UserActionMenu', () => {
  it('keeps all groups visible and explains letter-dependent actions without an open letter', async () => {
    renderMenu();

    const createGroup = await screen.findByRole('menuitem', {
      name: /Briefkopf erstellen|Create letter header/,
    });
    const editGroup = screen.getByRole('menuitem', {
      name: /Briefkopf bearbeiten|Edit letter header/,
    });
    const entityGroup = screen.getByRole('menuitem', { name: /Entitäten|Annotate entities/ });

    expect(createGroup).toHaveAttribute('aria-disabled', 'false');
    expect(editGroup).toHaveAttribute('aria-disabled', 'true');
    expect(entityGroup).toHaveAttribute('aria-disabled', 'true');
    expect(editGroup).toHaveAttribute('title', expect.stringMatching(/Öffnen Sie zuerst einen Brief|Open a letter first/));
  });

  it('distinguishes selection-dependent formatting from caret-capable fraction actions', async () => {
    renderMenu({ letterLoaded: true });

    fireEvent.click(await screen.findByRole('menuitem', { name: /Formatierung|Language and typographic markup/ }));

    const abbreviation = await screen.findByRole('menuitem', {
      name: /Abkürzung|Mark and expand abbreviation/,
    });
    const fraction = screen.getByRole('menuitem', {
      name: /Bruchzahl.*horizontal|Fraction with horizontal bar/i,
    });

    expect(abbreviation).toHaveAttribute('aria-disabled', 'true');
    expect(abbreviation).toHaveAttribute('title', expect.stringMatching(/Markieren Sie zuerst Text|Select text/));
    expect(fraction).toHaveAttribute('aria-disabled', 'false');
  });

  it('opens the selected entity panel for marked text', async () => {
    const store = renderMenu({ letterLoaded: true, selectionActive: true });

    fireEvent.click(await screen.findByRole('menuitem', { name: /Entitäten|Annotate entities/ }));
    fireEvent.click(await screen.findByRole('menuitem', { name: /Person auszeichnen|Annotate person/ }));

    expect(store.getState().editorLetter.selectedItem).toEqual({
      left: null,
      right: EditorConstants.compMappingRight.ENT_PERSON,
    });
  });

  it('switches between submenu levels without closing the root menu', async () => {
    renderMenu({ letterLoaded: true });

    fireEvent.click(await screen.findByRole('menuitem', { name: /Briefkopf erstellen|Create letter header/ }));
    expect(
      await screen.findByRole('menuitem', {
        name: /Brief erstellen.*alt\+n|Create letter.*alt\+n/i,
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: /Briefkopf bearbeiten|Edit letter header/ }));
    expect(await screen.findByRole('menuitem', { name: /Empfänger bearbeiten|Edit recipient/ })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: /Brief erstellen.*alt\+n|Create letter.*alt\+n/i })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('menuitem', { name: /Entitäten|Annotate entities/ })).toBeInTheDocument();
  });

  it('keeps unavailable placeholders visible and disabled', async () => {
    renderMenu({ letterLoaded: true, selectionActive: true });

    const textCreation = await screen.findByRole('menuitem', {
      name: /Brieftext erstellen|Create letter text/,
    });

    expect(textCreation).toHaveAttribute('aria-disabled', 'true');
    expect(textCreation).toHaveAttribute('title', expect.stringMatching(/noch nicht verfügbar|not available yet/));
  });
});
