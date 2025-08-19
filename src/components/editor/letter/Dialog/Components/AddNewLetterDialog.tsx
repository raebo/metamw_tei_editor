import { DefaultDialogProps } from '../EditorFormDialog';
import DynamicDataDisplay from '../../../../support/DynamicDataDisplay';
import { DISPLAY_NAME_MAP } from '../../../../../utils/entityMappings';
import React, { useEffect, useRef } from 'react';
import { Box, Divider } from '@mui/material';
import TeiHeaderFirstHeadline from './TeiHeaderDialog/10TeiHeaderFirstHeadline';
import TeiHeaderSndHeadline from './TeiHeaderDialog/20TeiHeaderSndHeadline';
import TeiHeaderPrevLetter from './TeiHeaderDialog/30TeiHeaderPrevLetter';
import TeiHeaderNextLetter from './TeiHeaderDialog/40TeiHeaderNextLetter';
import TeiHeaderTransEdition from './TeiHeaderDialog/70TeiHeaderTransEdition';
import { MiscUtils } from '../../../../../utils/misc';
import NewLetterLetterName from './NewLetterDialog/10NewLetterLetterName';
import Button from '@mui/material/Button';
import { enqueueSnackbar } from 'notistack';
import { createNewLetter } from '../../../../../services/editor/apiLettersRequest.service';
import TeiHeaderWritingReceivingPlace from './TeiHeaderDialog/50TeiHeaderWritingReceivingPlace';
import { EditorLetter } from '../../../../../services/mappings/editorMappings';
import { SnippetEntity } from '../../../../../services/mappings/autoAnnoMappings';
import TeiHeaderReceivingPerson from './TeiHeaderDialog/60TeiHeaderReceivingPerson';
import TeiHeaderWritingPerson from './NewLetterDialog/20TeiHeaderWritingPerson';
import { useAppDispatch } from '../../../../../redux/hooks';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../redux/redux.store';
import { EditorUtils } from '../../../../../utils/editor';
import { setEditorPinnedLetters } from '../../../../../redux/slices/editor.letter.slice';
import {LanguageOption} from "../../../../../constants/editor";

export type NewLetterDialogProps = {
  autoAvailable: boolean | null;
  completionState: NewLetterCompletionState;
  onChange: (updates: Partial<NewLetterCompletionState>) => void;
}

export type NewLetterCompletionState = {
  isFmbLetter: boolean, letterNameComplete: boolean, letterName: string | null,
  firstHeaderComplete: boolean, firstHeaderContent: string | null,
  sndHeaderComplete: boolean, sndHeaderContent: string | null,
  prevLetterAutoAvailable: boolean, prevLetterType: 'unknown' | 'not_identified' | 'select' | null, prevLetter: EditorLetter | null,
  nextLetterAutoAvailable: boolean, nextLetterType: 'unknown' | 'not_identified' | 'select' | null, nextLetter: EditorLetter | null,
  transkriptionValue: string, editionValue: string
  writerAutoAvailable: boolean, writerEntity: SnippetEntity | null,
  writingPlaceAutoAvailable: boolean, writingPlace: SnippetEntity | null,
  receiverAutoAvailable: boolean, receiverEntity: SnippetEntity | null,
  receivingPlaceAutoAvailable: boolean, receivingPlace: SnippetEntity | null,
  letterLanguage: LanguageOption[] | []
}

const AddNewLetterDialog= (props: DefaultDialogProps) => {

  const dispatch = useAppDispatch();
  const statePinnedLetters = useSelector((state: RootState) => state.editorLetter.pinnedLetters);

  const [displayData] = React.useState<{ [key: string]:string}|null>(null)

  const [completionState, setCompletionState] = React.useState<NewLetterCompletionState>({
    isFmbLetter: false, letterNameComplete: false, letterName: null,
    firstHeaderComplete: false, firstHeaderContent: null,
    sndHeaderComplete: false, sndHeaderContent: null,
    prevLetterAutoAvailable: false, prevLetterType: null, prevLetter: null,
    nextLetterAutoAvailable: false, nextLetterType: null, nextLetter: null,
    transkriptionValue: "FMB-C", editionValue: "FMB-C",
    writerAutoAvailable: true, writerEntity: null,
    writingPlaceAutoAvailable: true, writingPlace: null,
    receiverAutoAvailable: true, receiverEntity: null,
    receivingPlaceAutoAvailable: true, receivingPlace: null,
    letterLanguage: []
  })

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const width = ref.current.scrollWidth;
      props.setWidth(`${width}px`); // add some padding if needed
    }
  }, []);

  const submitCreateHandler= async () => {
    try {
      const { newLetterId, newLetterName } = await createNewLetter(completionState)

      const newPinnedLetters = EditorUtils.pinnedLetters.computeNewPinnedLetters(statePinnedLetters, {
        id: newLetterId,
        name: newLetterName,
        isPinned: true,
        viewMode: "WYSIWYG"
      })
      dispatch(setEditorPinnedLetters({ pinnedLetters: newPinnedLetters }));

      enqueueSnackbar(`New letter '${completionState.letterName}' created successfully` , { variant: "success" });
      props.onClose();

    } catch (error) {
      enqueueSnackbar("Error creating new letter", { variant: "error" });
    }
  }

  const childOnChange = MiscUtils.stateHandling.createHandleChange(setCompletionState);

  const validWriterCheck = () : boolean => {
    if (completionState.isFmbLetter && completionState.writerEntity === null) {
      return true
    } else if (!completionState.isFmbLetter && completionState.writerEntity === null) {
      return false
    } else {
      return false
    }
  }
  const validPrevLetterCheck = () : boolean => {
    if (completionState.prevLetterType !== null && completionState.prevLetterType === 'unknown' || completionState.prevLetterType === 'not_identified') {
      return true
    } else return completionState.prevLetterType === "select" && completionState.prevLetter !== null;
  }

  const validNextLetterCheck = () : boolean => {
    if (completionState.nextLetterType !== null && completionState.nextLetterType === 'unknown' || completionState.nextLetterType === 'not_identified') {
      return true
    } else return completionState.nextLetterType === "select" && completionState.nextLetter !== null;
  }

  const saveIsAvailable = [
    completionState.letterNameComplete,
    completionState.firstHeaderComplete,
    completionState.sndHeaderComplete,
    completionState.nextLetterType !== null,
    validWriterCheck(),
    validPrevLetterCheck(),
    validNextLetterCheck(),
    completionState.writingPlace !== null,
    completionState.receiverEntity !== null,
    completionState.receivingPlace !== null,
    completionState.letterLanguage !== null,
  ].every(Boolean);

  return (
    <div ref={ref}>
      <div className="autoSnippetFormRow">
        { displayData !== null ? (
          <DynamicDataDisplay data={displayData} displayNameMap={DISPLAY_NAME_MAP} />
        ) : (
          <>
          </>
        )
        }
      </div>
      <NewLetterLetterName autoAvailable={null} completionState={completionState} onChange={childOnChange} />
      <TeiHeaderFirstHeadline teiHeader={null} autoAvailable={completionState.firstHeaderComplete} completionState={completionState} onChange={childOnChange} />
      <TeiHeaderSndHeadline teiHeader={null} autoAvailable={completionState.sndHeaderComplete} completionState={completionState} onChange={childOnChange} />
      <TeiHeaderPrevLetter teiHeader={null} autoAvailable={completionState.prevLetterAutoAvailable} completionState={completionState} onChange={childOnChange}  />
      <TeiHeaderNextLetter teiHeader={null} autoAvailable={completionState.nextLetterAutoAvailable} completionState={completionState} onChange={childOnChange} />
      <TeiHeaderWritingPerson autoAvailable={completionState.letterNameComplete} completionState={completionState} onChange={childOnChange} />
      <TeiHeaderWritingReceivingPlace teiHeader={null} autoAvailable={null} completionState={completionState} onChange={childOnChange} dialogType={"writing"} textFieldValue={"Schreibort Auswählen"}/>
      <TeiHeaderReceivingPerson teiHeader={null} autoAvailable={completionState.receiverAutoAvailable} completionState={completionState} onChange={childOnChange} />
      <TeiHeaderWritingReceivingPlace teiHeader={null} autoAvailable={null} completionState={completionState} onChange={childOnChange} dialogType={"receiving"} textFieldValue={"Empfängerort Auswählen"}/>
      <TeiHeaderTransEdition teiHeader={null} autoAvailable={null} completionState={completionState} onChange={childOnChange} />

      <Divider orientation="vertical" flexItem />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          mt: 10,
          borderTop: '2px solid',
          borderColor: 'lightgray',
          // borderColor: 'primary.main',
          pt: 2,
        }}
      >
        <Button
          variant="contained"
          color="success"
          size="medium"
          disabled={!saveIsAvailable}
          onClick={submitCreateHandler}
        >
          Brief Erstellen
        </Button>
      </Box>

      <div>
        <pre>{JSON.stringify(completionState, null, 2)}</pre>
      </div>
    </div>
  )
}

export default AddNewLetterDialog;
