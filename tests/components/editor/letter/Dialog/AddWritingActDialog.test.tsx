import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import AddWritingActDialog from '@src/components/editor/letter/Dialog/Components/WritingAct/AddWritingActDialog';
import editorLetterReducer, { setEditorLetter, setLetterReference } from '@src/redux/slices/editor.letter.slice';
import { EditorConstants } from '@src/constants/editor';
import { enqueueSnackbar } from 'notistack';

jest.mock('@src/components/editor/letter/Util/FormAutocomplete', () => () => null);
jest.mock('notistack', () => ({ enqueueSnackbar: jest.fn() }));
jest.mock('@src/services/editor/apiLetterRequest.service', () => ({
  searchEditortEntities: jest.fn().mockResolvedValue([{ entityKey: 'PSN9999999', entityName: 'Available Person' }]),
}));

const parseXml = (xml: string) => new DOMParser().parseFromString(xml, 'application/xml');

describe('AddWritingActDialog', () => {
  it('prefills authors and writers from the referenced writing act', async () => {
    const xmlDoc = parseXml(
      '<TEI><text><body><div type="act_of_writing" n="1"><docAuthor data-key="PSN0000001" resp="author">Author One</docAuthor><docAuthor data-key="PSN0000002" resp="writer">Writer One</docAuthor><p>First</p></div><div type="act_of_writing" n="2"><docAuthor data-key="PSN0000003" resp="author">Other Author</docAuthor><p>Second</p></div></body></text></TEI>',
    );
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    store.dispatch(
      setEditorLetter({
        letter: { id: 7, name: 'FMB-7', viewMode: 'WYSIWYG', xmlContent: '' },
      }),
    );
    store.dispatch(
      setLetterReference({
        letterReference: {
          elementType: 'div',
          elementXmlId: '0.0.0',
          elementKey: null,
        },
      }),
    );

    const onSave = jest.fn();
    render(
      <Provider store={store}>
        <AddWritingActDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );

    expect(await screen.findByText('Author One')).toBeInTheDocument();
    expect(screen.getByText('Writer One')).toBeInTheDocument();
    expect(screen.queryByText('Other Author')).not.toBeInTheDocument();
    expect(screen.getByText('PSN0000001')).toBeInTheDocument();
    expect(screen.getByText('PSN0000002')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Schreibakt Hinzufügen' }));

    expect(enqueueSnackbar).not.toHaveBeenCalled();
    const writingActs = Array.from(xmlDoc.querySelectorAll('body > div[type="act_of_writing"]'));
    expect(writingActs).toHaveLength(3);
    expect(writingActs.map((writingAct) => writingAct.getAttribute('n'))).toEqual(['1', '2', '3']);
    expect(writingActs[1].querySelector('p')?.textContent).toBe('Brieftext');
    expect(writingActs[1].querySelector('docAuthor[resp="author"]')?.textContent).toBe('Author One');
    expect(writingActs[1].querySelector('docAuthor[resp="writer"]')?.textContent).toBe('Writer One');
    expect(writingActs[2].querySelector('docAuthor')?.textContent).toBe('Other Author');
    expect(onSave).toHaveBeenCalledWith(
      xmlDoc,
      EditorConstants.changeTypes.misc.ACT_OF_WRITING_ADDED,
      'Neuer Schreibakt wurde hinzugefügt',
      null,
    );
  });
});
