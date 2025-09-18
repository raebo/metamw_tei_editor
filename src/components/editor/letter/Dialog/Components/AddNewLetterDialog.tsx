import { DefaultDialogProps } from '../EditorFormDialog';
import DynamicDataDisplay from '../../../../support/DynamicDataDisplay';
import { DISPLAY_NAME_MAP } from '../../../../../utils/entityMappings';
import React from 'react';
import { Divider } from '@mui/material';
import TeiHeaderFirstHeadline from './TeiHeaderDialog/10TeiHeaderFirstHeadline';
import TeiHeaderSndHeadline from './TeiHeaderDialog/20TeiHeaderSndHeadline';
import TeiHeaderPrevLetter from './TeiHeaderDialog/30TeiHeaderPrevLetter';
import TeiHeaderNextLetter from './TeiHeaderDialog/40TeiHeaderNextLetter';
import TeiHeaderTransEdition from './TeiHeaderDialog/70TeiHeaderTransEdition';
import { MiscUtils } from '../../../../../utils/misc';
import NewLetterLetterName from './NewLetterDialog/10NewLetterLetterName';
import { enqueueSnackbar } from 'notistack';
import { createNewLetter } from '../../../../../services/editor/apiLettersRequest.service';
import TeiHeaderWritingReceivingPlace from './TeiHeaderDialog/50TeiHeaderWritingReceivingPlace';
import { EditorLetter } from '../../../../../services/mappings/editorMappings';
import { SnippetEntity } from '../../../../../services/mappings/autoAnnoMappings';
import TeiHeaderWritingPerson from './NewLetterDialog/20TeiHeaderWritingPerson';
import { useAppDispatch } from '../../../../../redux/hooks';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import { EditorUtils } from '../../../../../utils/editor';
import { setEditorPinnedLetters } from '../../../../../redux/slices/editor.letter.slice';
import { HeaderPerson, LanguageOption } from '../../../../../constants/editor';
import TeiHeaderEditorTranskriptor from './TeiHeaderDialog/80EditorTranskriptor';
import TeiHeaderReceivers from './TeiHeaderDialog/60TeiHeaderReceivers';
import DialogContent from '@mui/material/DialogContent';
import { DialogActionButton } from './Misc/DialogActionButton';

export type NewLetterDialogProps = {
  autoAvailable: boolean | null;
  completionState: NewLetterCompletionState;
  onChange: (updates: Partial<NewLetterCompletionState>) => void;
};

export type NewLetterCompletionState = {
  isFmbLetter: boolean;
  letterNameComplete: boolean;
  letterName: string | null;
  firstHeaderComplete: boolean;
  firstHeaderContent: string | null;
  sndHeaderComplete: boolean;
  sndHeaderContent: string | null;
  prevLetterAutoAvailable: boolean;
  prevLetterType: 'unknown' | 'not_identified' | 'select' | null;
  prevLetter: EditorLetter | null;
  nextLetterAutoAvailable: boolean;
  nextLetterType: 'unknown' | 'not_identified' | 'select' | null;
  nextLetter: EditorLetter | null;
  transkriptionValue: string;
  editionValue: string;
  writerAutoAvailable: boolean;
  writerEntity: SnippetEntity | null;
  writingPlaceAutoAvailable: boolean;
  writingPlace: SnippetEntity | null;
  receiverAutoAvailable: boolean;
  receivers: HeaderPerson[];
  receivingPlaceAutoAvailable: boolean;
  receivingPlace: SnippetEntity | null;
  letterLanguage: LanguageOption[] | [];
  editorValue: string | null;
  transkriptorValue: string | null;
};

const AddNewLetterDialog = (props: DefaultDialogProps) => {
  const dispatch = useAppDispatch();
  const statePinnedLetters = useSelector((state: RootState) => state.editorLetter.pinnedLetters);

  const [displayData] = React.useState<{ [key: string]: string } | null>(null);

  const [completionState, setCompletionState] = React.useState<NewLetterCompletionState>({
    isFmbLetter: false,
    letterNameComplete: false,
    letterName: null,
    firstHeaderComplete: false,
    firstHeaderContent: null,
    sndHeaderComplete: false,
    sndHeaderContent: null,
    prevLetterAutoAvailable: false,
    prevLetterType: null,
    prevLetter: null,
    nextLetterAutoAvailable: false,
    nextLetterType: null,
    nextLetter: null,
    transkriptionValue: 'FMB-C',
    editionValue: 'FMB-C',
    writerAutoAvailable: true,
    writerEntity: null,
    writingPlaceAutoAvailable: true,
    writingPlace: null,
    receiverAutoAvailable: true,
    receivers: [],
    receivingPlaceAutoAvailable: true,
    receivingPlace: null,
    letterLanguage: [],
    editorValue: null,
    transkriptorValue: null,
  });

  const submitCreateHandler = async () => {
    try {
      const { newLetterId, newLetterName } = await createNewLetter(completionState);

      const newPinnedLetters = EditorUtils.pinnedLetters.computeNewPinnedLetters(statePinnedLetters, {
        id: newLetterId,
        name: newLetterName,
        isPinned: true,
        viewMode: 'WYSIWYG',
      });
      dispatch(setEditorPinnedLetters({ pinnedLetters: newPinnedLetters }));

      enqueueSnackbar(`New letter '${completionState.letterName}' created successfully`, {
        variant: 'success',
      });
      props.onClose();
    } catch (error) {
      enqueueSnackbar('Error creating new letter: ' + MiscUtils.misc.getErrorMessage(error), {
        variant: 'error',
      });
    }
  };

  const childOnChange = MiscUtils.stateHandling.createHandleChange(setCompletionState);

  const validWriterCheck = (): boolean => {
    if (completionState.isFmbLetter && completionState.writerEntity === null) {
      return true;
    } else if (!completionState.isFmbLetter && completionState.writerEntity === null) {
      return false;
    } else {
      return false;
    }
  };
  const validPrevLetterCheck = (): boolean => {
    if (
      completionState.prevLetterType !== null &&
      (completionState.prevLetterType === 'unknown' || completionState.prevLetterType === 'not_identified')
    ) {
      return true;
    } else return completionState.prevLetterType === 'select' && completionState.prevLetter !== null;
  };

  const validNextLetterCheck = (): boolean => {
    if (
      completionState.nextLetterType !== null &&
      (completionState.nextLetterType === 'unknown' || completionState.nextLetterType === 'not_identified')
    ) {
      return true;
    } else return completionState.nextLetterType === 'select' && completionState.nextLetter !== null;
  };

  const saveIsAvailable = [
    completionState.letterNameComplete,
    completionState.firstHeaderComplete,
    completionState.sndHeaderComplete,
    validWriterCheck(),
    validPrevLetterCheck(),
    validNextLetterCheck(),
    completionState.writingPlace !== null,
    completionState.receivers.length > 0,
    completionState.receivingPlace !== null,
    completionState.letterLanguage.length > 0,
    completionState.editorValue !== null,
    completionState.transkriptorValue !== null,
  ].every(Boolean);

  return (
    <div>
      <DialogContent>
        <div className="autoSnippetFormRow">
          {displayData !== null ? <DynamicDataDisplay data={displayData} displayNameMap={DISPLAY_NAME_MAP} /> : <></>}
        </div>
        <NewLetterLetterName autoAvailable={null} completionState={completionState} onChange={childOnChange} />
        <TeiHeaderFirstHeadline
          teiHeader={null}
          autoAvailable={completionState.firstHeaderComplete}
          completionState={completionState}
          onChange={childOnChange}
        />
        <TeiHeaderSndHeadline
          teiHeader={null}
          autoAvailable={completionState.sndHeaderComplete}
          completionState={completionState}
          onChange={childOnChange}
        />
        <TeiHeaderPrevLetter
          teiHeader={null}
          autoAvailable={completionState.prevLetterAutoAvailable}
          completionState={completionState}
          onChange={childOnChange}
        />
        <TeiHeaderNextLetter
          teiHeader={null}
          autoAvailable={completionState.nextLetterAutoAvailable}
          completionState={completionState}
          onChange={childOnChange}
        />
        <TeiHeaderWritingPerson
          autoAvailable={completionState.letterNameComplete}
          completionState={completionState}
          onChange={childOnChange}
        />
        <TeiHeaderWritingReceivingPlace
          teiHeader={null}
          autoAvailable={null}
          completionState={completionState}
          onChange={childOnChange}
          dialogType={'writing'}
          textFieldValue={'Schreibort Auswählen'}
        />
        <TeiHeaderReceivers
          teiHeader={null}
          autoAvailable={completionState.receiverAutoAvailable}
          completionState={completionState}
          onChange={childOnChange}
        />
        <TeiHeaderWritingReceivingPlace
          teiHeader={null}
          autoAvailable={null}
          completionState={completionState}
          onChange={childOnChange}
          dialogType={'receiving'}
          textFieldValue={'Empfängerort Auswählen'}
        />
        <TeiHeaderTransEdition teiHeader={null} autoAvailable={null} completionState={completionState} onChange={childOnChange} />
        <TeiHeaderEditorTranskriptor teiHeader={null} autoAvailable={null} completionState={completionState} onChange={childOnChange} />
      </DialogContent>
      <Divider />
      <DialogActionButton label={'Brief Erstellen'} onClick={submitCreateHandler} disabled={!saveIsAvailable} />

      {/*<div>*/}
      {/*  <pre>{JSON.stringify(completionState, null, 2)}</pre>*/}
      {/*</div>*/}
    </div>
  );
};

export default AddNewLetterDialog;
