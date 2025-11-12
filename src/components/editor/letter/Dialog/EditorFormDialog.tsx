import React, { useCallback, useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { Divider, Typography } from '@mui/material';
import DialogActions from '@mui/material/DialogActions';
import { EditorConstants } from '@src/constants/editor';
import AddNoteDialog from './Components/AddNoteDialog';
import {
  setDialogType,
  setReloadLetterContent,
  setXmlLetterContent,
} from '@src/redux/slices/editor.letter.slice';
import { useAppDispatch } from '@src/redux/hooks';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import ResetLetterDialog from './Components/ResetLetterDialog';
import EditNoteDialog from './Components/EditNoteDialog';
import DateAddDialog from './Components/Date/DateAddDialog';
import AttachmentAddDialog from './Components/Misc/AttachmentAddDialog';
import AddWritingActDialog from './Components/WritingAct/AddWritingActDialog';
import ManageTeiHeaderDialog from './Components/ManageTeiHeaderDialog';
import AddNewLetterDialog from './Components/AddNewLetterDialog';
import PublishLetterDialog from './Components/PublishLetterDialog';
import ChooseGbLetterDialog from './Components/AssignLetterDialog/ChooseGbLetterDialog';
import ChooseProtagLetterDialog from './Components/AssignLetterDialog/ChooseProtagLetterDialog';
import ManageTeiHeaderAuthorWriterDialog from './Components/ManageTeiHeaderAuthorWriterDialog';
import ManageTeiHeaderReceiverDialog from './Components/ManageTeiHeaderReceiverDialog';
import ManageWritingActAuthorWriterDialog from './Components/WritingAct/ManageWritingActAuthorWriterDialog';
import EditLanguagesDialog from './Components/Misc/EditLanguagesDialog';
import ManageTextAddress from './Components/ManageTextAddress';
import GreetingsFormulaDialog from './Components/Misc/GreetingsFormulaDialog';
import { EditorUtils } from '@src/utils/editor';
import { enqueueSnackbar } from 'notistack';
import { MiscUtils } from '@src/utils/misc';
import CloseTabWithContent from '@src/components/editor/letter/Dialog/Components/CloseTabWithContentDialog';
import AddRismEntryDialog from '@src/components/editor/letter/Dialog/Components/RismEntries/AddRismEntryDialog';

interface EditorFormDialogProps {
  open: boolean;
  xmlRef: React.RefObject<HTMLDivElement>;
}

export interface DefaultDialogProps {
  xmlDoc: XMLDocument;
  xmlRef?: React.RefObject<HTMLDivElement>;
  onSave: (
    updatedXmlDoc: Document,
    changeType: string,
    successMessage: string,
    xmlId?: string | null,
    extraFn?: (doc: Document) => void, // optional extra function
  ) => void;
  onClose: () => void;
}

const DialogTitles: Record<string, string> = {
  [EditorConstants.dialogTypes.ADD_GREETINGS_FORMULA]: 'Begrüßungsformel Hinzufügen',
  [EditorConstants.dialogTypes.ADD_NEW_LETTER]: 'Neuen Brief Hinzufügen',
  [EditorConstants.dialogTypes.ADD_NOTE]: 'Kommentar Hinzufügen',
  [EditorConstants.dialogTypes.ADD_RISM_ENTRY]: 'RISM Eintrag Hinzufügen',
  [EditorConstants.dialogTypes.ADD_TEI_HEADER]: 'Header des Briefes Hinzufügen/Bearbeiten',
  [EditorConstants.dialogTypes.ADD_LETTER_TO_PROTAG]:
    'Verweis an einen Brief an den Protagonisten Hinzufügen',
  [EditorConstants.dialogTypes.ADD_LETTER_FROM_PROTAG]:
    'Verweis an einen Brief vom Protagonisten Hinzufügen',
  [EditorConstants.dialogTypes.ADD_WRITING_PART]: 'Schreibakt Hinzufügen',
  [EditorConstants.dialogTypes.ATTACHMENT_ADD]: 'Beilage Hinzufügen',
  [EditorConstants.dialogTypes.CLOSE_TAB_WITH_CONTENT]: 'Tab mit Inhalt Schließen?',
  [EditorConstants.dialogTypes.DATE_WHEN_ADD]: "Datum 'WHEN' Auszeichnen",
  [EditorConstants.dialogTypes.DATE_WHEN_CUSTOM_ADD]: "Datum 'WHEN CUSTOM' Auszeichnen",
  [EditorConstants.dialogTypes.DATE_NOT_AFTER_ADD]: "Datum 'Not After' Auszeichnen",
  [EditorConstants.dialogTypes.DATE_NOT_BEFORE_ADD]: "Datum 'Not Before' Auszeichnen",
  [EditorConstants.dialogTypes.DATE_FROM_TO_ADD]: "Datum 'From To' Auszeichnen",
  [EditorConstants.dialogTypes.DATE_NOT_BEFORE_AFTER_ADD]: "Datum 'NotBefore NotAfter' Auszeichnen",
  [EditorConstants.dialogTypes.EDIT_LANGUAGES]: 'Sprachen Verwalten',
  [EditorConstants.dialogTypes.EDIT_NOTE]: 'Kommentar Bearbeiten/Löschen',
  [EditorConstants.dialogTypes.MANAGE_GREETINGS_FORMULA]: 'Begrüßungsformel Verwalten',
  [EditorConstants.dialogTypes.MANAGE_HEADER_AUTHOR_WRITER]: 'Autoren/Schreiber Verwalten',
  [EditorConstants.dialogTypes.MANAGE_WRITING_ACT_AUTHOR_WRITER]: 'Autoren/Schreiber Verwalten',
  [EditorConstants.dialogTypes.MANAGE_HEADER_RECEIVER]: 'Empfänger Verwalten',
  [EditorConstants.dialogTypes.MANAGE_ADDRESS_SENDER]: 'Adresse Sender Verwalten',
  [EditorConstants.dialogTypes.MANAGE_ADDRESS_RECIPIENT]: 'Adresse Empfänger Verwalten',
  [EditorConstants.dialogTypes.PUBLISH_LETTER]: 'Brief Veröffentlichen',
  [EditorConstants.dialogTypes.RESET_LETTER]: 'Brief Zurücksetzen',
};

const DialogContentComponents: Record<
  string,
  (props: DefaultDialogProps & any) => React.ReactNode
> = {
  [EditorConstants.dialogTypes.ADD_GREETINGS_FORMULA]: (props) => (
    <GreetingsFormulaDialog
      {...props}
      formulaType={EditorConstants.dialogTypes.ADD_GREETINGS_FORMULA}
    />
  ),
  [EditorConstants.dialogTypes.ADD_LETTER_FROM_PROTAG]: (props) => (
    <ChooseProtagLetterDialog {...props} />
  ),
  [EditorConstants.dialogTypes.ADD_LETTER_TO_PROTAG]: (props) => (
    <ChooseGbLetterDialog {...props} />
  ),
  [EditorConstants.dialogTypes.ADD_NEW_LETTER]: (props) => <AddNewLetterDialog {...props} />,
  [EditorConstants.dialogTypes.ADD_NOTE]: (props) => <AddNoteDialog {...props} />,
  [EditorConstants.dialogTypes.ADD_RISM_ENTRY]: (props) => <AddRismEntryDialog {...props} />,
  [EditorConstants.dialogTypes.ADD_WRITING_PART]: (props) => <AddWritingActDialog {...props} />,
  [EditorConstants.dialogTypes.ADD_TEI_HEADER]: (props) => <ManageTeiHeaderDialog {...props} />,
  [EditorConstants.dialogTypes.ATTACHMENT_ADD]: (props) => <AttachmentAddDialog {...props} />,
  [EditorConstants.dialogTypes.CLOSE_TAB_WITH_CONTENT]: (props) => (
    <CloseTabWithContent {...props} />
  ),
  [EditorConstants.dialogTypes.DATE_WHEN_ADD]: (props) => (
    <DateAddDialog {...props} dateType={EditorConstants.dateDialog.dateTypes.WHEN} />
  ),
  [EditorConstants.dialogTypes.DATE_WHEN_CUSTOM_ADD]: (props) => (
    <DateAddDialog {...props} dateType={EditorConstants.dateDialog.dateTypes.WHEN_CUSTOM} />
  ),
  [EditorConstants.dialogTypes.DATE_NOT_AFTER_ADD]: (props) => (
    <DateAddDialog {...props} dateType={EditorConstants.dateDialog.dateTypes.NOT_AFTER} />
  ),
  [EditorConstants.dialogTypes.DATE_NOT_BEFORE_ADD]: (props) => (
    <DateAddDialog {...props} dateType={EditorConstants.dateDialog.dateTypes.NOT_BEFORE} />
  ),
  [EditorConstants.dialogTypes.DATE_FROM_TO_ADD]: (props) => (
    <DateAddDialog {...props} dateType={EditorConstants.dateDialog.dateTypes.FROM_TO} />
  ),
  [EditorConstants.dialogTypes.DATE_NOT_BEFORE_AFTER_ADD]: (props) => (
    <DateAddDialog
      {...props}
      dateType={EditorConstants.dateDialog.dateTypes.NOT_BEFORE_NOT_AFTER}
    />
  ),
  [EditorConstants.dialogTypes.EDIT_LANGUAGES]: (props) => <EditLanguagesDialog {...props} />,
  [EditorConstants.dialogTypes.EDIT_NOTE]: (props) => <EditNoteDialog {...props} />,
  [EditorConstants.dialogTypes.MANAGE_ADDRESS_RECIPIENT]: (props) => (
    <ManageTextAddress {...props} addressType={'RECIPIENT'} />
  ),
  [EditorConstants.dialogTypes.MANAGE_ADDRESS_SENDER]: (props) => (
    <ManageTextAddress {...props} addressType={'SENDER'} />
  ),
  [EditorConstants.dialogTypes.MANAGE_GREETINGS_FORMULA]: (props) => (
    <GreetingsFormulaDialog
      {...props}
      formulaType={EditorConstants.dialogTypes.MANAGE_GREETINGS_FORMULA}
    />
  ),
  [EditorConstants.dialogTypes.MANAGE_HEADER_AUTHOR_WRITER]: (props) => (
    <ManageTeiHeaderAuthorWriterDialog {...props} />
  ),
  [EditorConstants.dialogTypes.MANAGE_HEADER_RECEIVER]: (props) => (
    <ManageTeiHeaderReceiverDialog {...props} />
  ),
  [EditorConstants.dialogTypes.MANAGE_WRITING_ACT_AUTHOR_WRITER]: (props) => (
    <ManageWritingActAuthorWriterDialog {...props} />
  ),
  [EditorConstants.dialogTypes.PUBLISH_LETTER]: (props) => <PublishLetterDialog {...props} />,
  [EditorConstants.dialogTypes.RESET_LETTER]: (props) => <ResetLetterDialog {...props} />,
};

const EditorFormDialog = (props: EditorFormDialogProps) => {
  const dispatch = useAppDispatch();

  const dialogType = useSelector((state: RootState) => state.editorLetter.dialogType);
  const [dialogWidth, _setDialogWidth] = useState<string | number>('auto');
  const [isOpen, setIsOpen] = React.useState(props.open);
  const xmlRef = props.xmlRef;
  const [xmlDoc, setXmlDoc] = React.useState<XMLDocument | null>(null);
  const [dialogTitle, setDialogTitle] = React.useState('');

  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter);
  const stateTeiXml = useSelector((state: RootState) => state.editorLetter.letter.xmlContent);

  useEffect(() => {
    if (!stateTeiXml) {
      dispatch(setReloadLetterContent({ reloadLetterContent: true }));
      return;
    }

    try {
      const xmlDoc = EditorUtils.xmlCheck.extractTeiDocumentFromString(stateTeiXml);
      setXmlDoc(xmlDoc);
    } catch (err) {
      enqueueSnackbar(MiscUtils.misc.getErrorMessage(err), { variant: 'error' });
      setXmlDoc(null);
    }
  }, [stateTeiXml, dispatch]);

  const handleClose = () => {
    setIsOpen(false);

    // delay Redux updates until after unmount
    setTimeout(() => {
      if (!stateTeiXml) {
        dispatch(setDialogType({ dialogType: null }));
        return;
      }

      dispatch(setDialogType({ dialogType: null }));
    }, 0);
  };

  useEffect(() => {
    const initDialog = () => {
      if (dialogType !== null) {
        setIsOpen(true);
        setDialogTitle(DialogTitles[dialogType]);
      }
    };
    initDialog();
  }, [dialogType]);

  const onSaveDialogHandler = async (
    updatedXmlDoc: Document,
    changeType: string,
    successMessage: string,
    _xmlId: string,
    extraFn?: (doc: Document) => void,
  ) => {
    try {
      updatedXmlDoc.querySelectorAll('[tmp_id]').forEach((node) => {
        node.removeAttribute('tmp_id');
      });

      if (extraFn) {
        extraFn(updatedXmlDoc);
      }

      const xmlSerializer = new XMLSerializer();
      const xmlString = xmlSerializer.serializeToString(updatedXmlDoc);

      await EditorUtils.backendOrchestrator.patchWithDispatch(
        dispatch,
        [xmlString, stateEditorLetter.id, changeType, null],
        {
          actionsOnSuccess: [
            setXmlLetterContent({ content: { xmlContent: xmlString } }),
            setReloadLetterContent({ reloadLetterContent: true }),
          ],
          successMessage,
          errorMessage: 'Data could not be updated on backend side',
        },
      );
    } catch (err) {
      enqueueSnackbar(MiscUtils.misc.getErrorMessage(err), { variant: 'error' });
    }

    handleClose();
  };

  return (
    <React.Fragment>
      <Dialog
        onClose={handleClose}
        open={isOpen}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle id="alert-dialog-title">
          {dialogTitle}
          <hr />
        </DialogTitle>

        <DialogContent sx={{ p: 2, width: dialogWidth }}>
          {dialogType &&
            DialogContentComponents[dialogType]({
              xmlDoc,
              xmlRef,
              onSave: onSaveDialogHandler,
              onClose: handleClose,
            })}
        </DialogContent>
        <DialogActions>
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" color="textSecondary">
            Zum Schließen auf den Hintergrund klicken oder ESC drücken
          </Typography>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
};

export default EditorFormDialog;
