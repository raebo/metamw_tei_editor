import { DefaultDialogProps } from '../EditorFormDialog';
import DynamicDataDisplay from '../../../../support/DynamicDataDisplay';
import { DISPLAY_NAME_MAP } from '../../../../../utils/entityMappings';
import React, { useEffect, useRef } from 'react';
import { Box, Divider } from '@mui/material';
import TeiHeaderFirstHeadline from './TeiHeaderDialog/10TeiHeaderFirstHeadline';
import TeiHeaderSndHeadline from './TeiHeaderDialog/20TeiHeaderSndHeadline';
import TeiHeaderPrevLetter from './TeiHeaderDialog/30TeiHeaderPrevLetter';
import TeiHeaderNextLetter from './TeiHeaderDialog/40TeiHeaderNextLetter';
import TeiHeaderTransEdition from './TeiHeaderDialog/50TeiHeaderTransEdition';
import { MiscUtils } from '../../../../../utils/misc';
import NewLetterLetterName from './NewLetterDialog/10NewLetterLetterName';
import Button from '@mui/material/Button';
import { enqueueSnackbar } from 'notistack';
import { createNewLetter } from '../../../../../services/editor/apiLettersRequest.service';
import TeiHeaderWritingReceivingPlace from './TeiHeaderDialog/60TeiHeaderWritingReceivingPlace';
import { EditorLetter } from '../../../../../services/mappings/editorMappings';
import { SnippetEntity } from '../../../../../services/mappings/autoAnnoMappings';
import TeiHeaderReceivingPerson from './TeiHeaderDialog/70TeiHeaderReceivingPerson';
import TeiHeaderWritingPerson from './NewLetterDialog/20TeiHeaderWritingPerson';
import { useAppDispatch } from '../../../../../redux/hooks';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../redux/redux.store';
import { EditorUtils } from '../../../../../utils/editor';
import { setEditorPinnedLetters } from '../../../../../redux/slices/editor.letter.slice';

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
  letterLanguage: null | "de" | "en" | "fr" | "it" | "la" | "grc" | "he",
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
    letterLanguage: null
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
  const saveIsAvailable = [
    completionState.letterNameComplete,
    completionState.firstHeaderComplete,
    completionState.sndHeaderComplete,
    completionState.prevLetterType !== null,
    completionState.nextLetterType !== null,
    validWriterCheck(),
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
      <TeiHeaderFirstHeadline autoAvailable={completionState.firstHeaderComplete} completionState={completionState} onChange={childOnChange} />
      <TeiHeaderSndHeadline autoAvailable={completionState.sndHeaderComplete} completionState={completionState} onChange={childOnChange} />
      <TeiHeaderPrevLetter autoAvailable={completionState.prevLetterAutoAvailable} completionState={completionState} onChange={childOnChange}  />
      <TeiHeaderNextLetter autoAvailable={completionState.nextLetterAutoAvailable} completionState={completionState} onChange={childOnChange} />
      <TeiHeaderWritingPerson autoAvailable={completionState.letterNameComplete} completionState={completionState} onChange={childOnChange} />
      <TeiHeaderWritingReceivingPlace autoAvailable={null} completionState={completionState} onChange={childOnChange} dialogType={"writing"} textFieldValue={"Schreibort Auswählen"}/>
      <TeiHeaderReceivingPerson autoAvailable={completionState.receiverAutoAvailable} completionState={completionState} onChange={childOnChange} />
      <TeiHeaderWritingReceivingPlace autoAvailable={null} completionState={completionState} onChange={childOnChange} dialogType={"receiving"} textFieldValue={"Empfängerort Auswählen"}/>
      <TeiHeaderTransEdition autoAvailable={null} completionState={completionState} onChange={childOnChange} />

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
