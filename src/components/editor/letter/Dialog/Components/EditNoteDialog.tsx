import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import { EditorUtils } from '@src/utils/editor';
import Button from '@mui/material/Button';
import { Divider, FormControl, InputLabel, MenuItem, Select, TextField, TextareaAutosize } from '@mui/material';
import { EditorConstants } from '@src/constants/editor';
import { enqueueSnackbar } from 'notistack';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { DefaultDialogProps } from '../EditorFormDialog';
import { MiscUtils } from '@src/utils/misc';
import SanitizedHtml from '@src/components/support/SanitizedHtml';
import { useTranslation } from 'react-i18next';

const EditNoteDialog = (props: DefaultDialogProps) => {
  const { t } = useTranslation();
  const stateLetterReference = useSelector((state: RootState) => state.editorLetter.letterReference);
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState('');
  const [noteLanguage, setNoteLanguage] = useState('');
  const [noteResponsibility, setNoteResponsibility] = useState('');
  const noteTypeItems = EditorConstants.noteTypeItems;
  const noteLanguages = EditorConstants.noteTypeLanguages;
  const [noteParentContent, setNoteParentContent] = useState('');
  const [noteXmlId, setNoteXmlId] = useState('');
  const [deleteButtonsVisible, setDeleteButtonsVisible] = useState(false);
  const xmlDoc = props.xmlDoc;

  useEffect(() => {
    const initNoteContent = (xmlId: string) => {
      const note = EditorUtils.xmlCheck.elementByXmlTypeAndId(xmlId, 'note', xmlDoc);
      if (note) {
        if (note?.parentElement) {
          setNoteParentContent(note?.parentElement?.innerHTML);
        }

        setNoteContent(note?.textContent?.trim() || '');
        setNoteXmlId(xmlId);
        setNoteType(note.getAttribute('type') ?? '');
        setNoteLanguage(note.getAttribute('xml:lang') ?? '');
        setNoteResponsibility(note.getAttribute('resp') ?? '');
      }
    };

    if (stateLetterReference.elementXmlId) {
      initNoteContent(stateLetterReference.elementXmlId);
    }
  }, [stateLetterReference.elementXmlId, xmlDoc]);

  const selectedTypeIsUnknown = noteType !== '' && !noteTypeItems.some((item) => item.value === noteType);
  const selectedLanguageIsUnknown = noteLanguage !== '' && !noteLanguages.some((item) => item.value === noteLanguage);

  const handleDeleteNote = () => {
    try {
      EditorUtils.markupGeneration.deleteNoteMarkup(xmlDoc, noteXmlId);

      props.onSave(xmlDoc, EditorConstants.changeTypes.note.REMOVED, t('editor:dialog.comment.success.deleted'), null);
    } catch (error) {
      enqueueSnackbar(t('editor:dialog.comment.errors.delete', { reason: MiscUtils.misc.getErrorMessage(error) }), { variant: 'error' });
      props.onClose();
    }
  };

  const handleUpdateNote = () => {
    try {
      EditorUtils.markupGeneration.updateNoteMarkup(xmlDoc, noteXmlId, noteType, noteLanguage, noteContent);

      props.onSave(xmlDoc, EditorConstants.changeTypes.note.CONTENT_CHANGED, t('editor:dialog.comment.success.updated'), noteXmlId);
    } catch (error) {
      enqueueSnackbar(t('editor:dialog.comment.errors.save', { reason: MiscUtils.misc.getErrorMessage(error) }), {
        variant: 'error',
      });
      props.onClose();
    }
  };

  return (
    <div style={{ padding: 5 }}>
      <DialogContent>
        <div id="noteReferencedXmlWrapper" style={{ padding: 5 }}>
          <SanitizedHtml id="noteReferencedXml" html={noteParentContent} />
        </div>
        <div className="form-item form-item--key">
          <FormControl variant="filled" sx={{ m: 1, minWidth: 120, width: '100%' }}>
            <InputLabel id="editor-dialog-edit-note-type">{t('editor:dialog.comment.fields.type')}</InputLabel>
            <Select
              value={noteType}
              disabled={deleteButtonsVisible}
              labelId="editor-dialog-edit-note-type"
              id="editor-dialog-edit-note-select"
              onChange={(event) => setNoteType(event.target.value)}
            >
              {noteTypeItems.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {t(item.labelKey)}
                </MenuItem>
              ))}
              {selectedTypeIsUnknown && <MenuItem value={noteType}>{t('editor:dialog.comment.legacyValue', { value: noteType })}</MenuItem>}
            </Select>
          </FormControl>
        </div>
        <div className="form-item form-item--key">
          <FormControl variant="filled" sx={{ m: 1, minWidth: 120, width: '100%' }}>
            <InputLabel id="editor-dialog-edit-note-language">{t('editor:dialog.comment.fields.language')}</InputLabel>
            <Select
              value={noteLanguage}
              disabled={deleteButtonsVisible}
              labelId="editor-dialog-edit-note-language"
              id="editor-dialog-edit-note-language-select"
              onChange={(event) => setNoteLanguage(event.target.value)}
            >
              {noteLanguages.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {t(item.labelKey)}
                </MenuItem>
              ))}
              {selectedLanguageIsUnknown && (
                <MenuItem value={noteLanguage}>{t('editor:dialog.comment.legacyValue', { value: noteLanguage })}</MenuItem>
              )}
            </Select>
          </FormControl>
        </div>
        <TextField fullWidth disabled margin="normal" label={t('editor:dialog.comment.fields.responsibility')} value={noteResponsibility} />
        <div className="form-item form-item--key" style={{ margin: 5 }}>
          <TextareaAutosize
            aria-label={t('editor:dialog.comment.fields.content')}
            minRows={10}
            maxRows={20}
            disabled={deleteButtonsVisible}
            placeholder={t('editor:dialog.comment.fields.content')}
            style={{ width: '100%', padding: 8 }}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
          />
        </div>
      </DialogContent>
      <Divider />
      <DialogActions>
        {!deleteButtonsVisible && (
          <Button
            variant="contained"
            color="primary"
            size={EditorConstants.styles.panel.buttonSize}
            onClick={() => {
              setDeleteButtonsVisible(true);
            }}
            style={{ marginTop: 8 }}
          >
            {t('editor:dialog.comment.buttons.delete')}
          </Button>
        )}
        {!deleteButtonsVisible && (
          <Button
            variant="contained"
            color="primary"
            size={EditorConstants.styles.panel.buttonSize}
            onClick={handleUpdateNote}
            style={{ marginTop: 8 }}
            disabled={!noteContent.trim() || noteType === '' || noteLanguage === ''}
          >
            {t('editor:dialog.comment.buttons.update')}
          </Button>
        )}

        {deleteButtonsVisible && (
          <Button
            variant="outlined"
            size={EditorConstants.styles.panel.buttonSize}
            color="primary"
            onClick={() => {
              setDeleteButtonsVisible(false);
            }}
            style={{ marginTop: 8 }}
          >
            {t('editor:dialog.comment.buttons.cancelDelete')}
          </Button>
        )}

        {deleteButtonsVisible && (
          <Button
            variant="contained"
            size={EditorConstants.styles.panel.buttonSize}
            color="primary"
            onClick={handleDeleteNote}
            style={{ marginTop: 8 }}
          >
            {t('editor:dialog.comment.buttons.confirmDelete')}
          </Button>
        )}
      </DialogActions>
    </div>
  );
};

export default EditNoteDialog;
