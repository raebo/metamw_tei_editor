import { Divider, FormControl, InputLabel, MenuItem, Select, TextareaAutosize } from '@mui/material';
import React, { useState } from 'react';
import { EditorUtils } from '@src/utils/editor';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import { MiscUtils } from '@src/utils/misc';
import { enqueueSnackbar } from 'notistack';
import { EditorConstants } from '@src/constants/editor';
import { DefaultDialogProps } from '../EditorFormDialog';
import DialogContent from '@mui/material/DialogContent';
import { DialogActionButton } from './Misc/DialogActionButton';
import SanitizedHtml from '@src/components/support/SanitizedHtml';
import { useTranslation } from 'react-i18next';

const AddNoteDialog = (props: DefaultDialogProps) => {
  const { t } = useTranslation();
  const [comment, setComment] = useState('');
  const [noteType, setNoteType] = useState('');
  const [noteLanguage, setNoteLanguage] = useState('');
  const xmlDoc = props.xmlDoc;
  const markedSpan = props.xmlRef?.current
    ? EditorUtils.textMarking.markedSpanEntry(props.xmlRef.current)
    : xmlDoc.querySelector('span.marked');
  const markedSection = markedSpan?.parentElement?.innerHTML || '<p>No marked section found</p>';

  const user = useSelector((state: RootState) => state.auth.user);

  const handleSubmit = () => {
    try {
      const responsibility = MiscUtils.userHandling.responsibilityIdentifier(user);
      const { xmlId } = EditorUtils.markupGeneration.noteMarkup(xmlDoc, responsibility, comment, noteType, noteLanguage);
      props.onSave(xmlDoc, EditorConstants.changeTypes.note.ADDED, t('editor:dialog.comment.success.added'), xmlId);
    } catch (error) {
      enqueueSnackbar(t('editor:dialog.comment.errors.save', { reason: MiscUtils.misc.getErrorMessage(error) }), {
        variant: 'error',
      });
    }
  };

  return (
    <>
      <DialogContent>
        <div style={{ padding: 5 }}>
          <div id="noteReferencedXmlWrapper" style={{ padding: 5 }}>
            <SanitizedHtml id="noteReferencedXml" html={markedSection} />
          </div>
          <div className="form-item form-item--key">
            <FormControl variant="filled" sx={{ m: 1, minWidth: 120, width: '100%' }}>
              <InputLabel id="add-note-dialog-comment-type">{t('editor:dialog.comment.fields.type')}</InputLabel>
              <Select
                value={noteType}
                labelId="add-note-dialog-comment-type"
                id="add-note-dialog-comment-type-select"
                onChange={(event) => setNoteType(event.target.value)}
              >
                {EditorConstants.noteTypeItems.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {t(item.labelKey)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <div className="form-item form-item--key">
            <FormControl variant="filled" sx={{ m: 1, minWidth: 120, width: '100%' }}>
              <InputLabel id="add-note-dialog-comment-language">{t('editor:dialog.comment.fields.language')}</InputLabel>
              <Select
                value={noteLanguage}
                labelId="add-note-dialog-comment-language"
                id="add-note-dialog-comment-language-select"
                onChange={(event) => setNoteLanguage(event.target.value)}
              >
                {EditorConstants.noteTypeLanguages.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {t(item.labelKey)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <div className="form-item form-item--key" style={{ margin: 5 }}>
            <TextareaAutosize
              aria-label={t('editor:dialog.comment.fields.content')}
              minRows={10}
              maxRows={20}
              placeholder={t('editor:dialog.comment.fields.content')}
              style={{ width: '100%', padding: 8 }}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>
      </DialogContent>
      <Divider />
      <DialogActionButton
        label={t('editor:dialog.comment.buttons.add')}
        onClick={handleSubmit}
        disabled={!comment.trim() || noteType === '' || noteLanguage === ''}
      />
    </>
  );
};

export default AddNoteDialog;
