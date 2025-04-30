import { DefaultDialogProps } from '../EditorFormDialog';
import DynamicDataDisplay from '../../../../support/DynamicDataDisplay';
import { DISPLAY_NAME_MAP } from '../../../../../utils/entityMappings';
import React, { useEffect, useRef } from 'react';
import { Box, Divider } from '@mui/material';
import TeiHeaderFirstHeadline from './TeiHeaderDialog/01TeiHeaderFirstHeadline';
import TeiHeaderSndHeadline from './TeiHeaderDialog/02TeiHeaderSndHeadline';
import TeiHeaderPrevLetter from './TeiHeaderDialog/03TeiHeaderPrevLetter';
import TeiHeaderNextLetter from './TeiHeaderDialog/04TeiHeaderNextLetter';
import TeiHeaderTransEdition from './TeiHeaderDialog/05TeiHeaderTransEdition';
import { MiscUtils } from '../../../../../utils/misc';
import NewLetterLetterName from './NewLetterDialog/01NewLetterLetterName';
import Button from '@mui/material/Button';
import { enqueueSnackbar } from 'notistack';
import { createNewLetter } from '../../../../../services/editor/apiLettersRequest.service';
import TeiHeaderWritingReceivingPlace from './TeiHeaderDialog/06TeiHeaderWritingReceivingPlace';
import { EditorLetter } from '../../../../../services/mappings/editorMappings';
import { SnippetEntity } from '../../../../../services/mappings/autoAnnoMappings';
import TeiHeaderReceivingPerson from './TeiHeaderDialog/07TeiHeaderReceivingPerson';


export type NewLetterDialogProps = {
  autoAvailable: boolean | null;
  completionState: NewLetterCompletionState;
  onChange: (updates: Partial<NewLetterCompletionState>) => void;
}

export type NewLetterCompletionState = {
  letterNameComplete: boolean, letterName: string | null,
  firstHeaderComplete: boolean, firstHeaderContent: string | null,
  sndHeaderComplete: boolean, sndHeaderContent: string | null,
  prevLetterAutoAvailable: boolean, prevLetterType: 'unknown' | 'not_identified' | 'select' | null, prevLetter: EditorLetter | null,
  nextLetterAutoAvailable: boolean, nextLetterType: 'unknown' | 'not_identified' | 'select' | null, nextLetter: EditorLetter | null,
  transkriptionValue: string, editionValue: string
  writingPlaceAutoAvailable: boolean, writingPlace: SnippetEntity | null,
  receiverAutoAvailable: boolean, receiverEntity: SnippetEntity | null,
  receivingPlaceAutoAvailable: boolean, receivingPlace: SnippetEntity | null,
  letterLanguage: null | "de" | "en" | "fr" | "it" | "la" | "grc" | "he",
}

const AddNewLetterDialog= (props: DefaultDialogProps) => {

  const [displayData, setDisplayData] = React.useState<{ [key: string]:string}|null>(null)

  const [completionState, setCompletionState] = React.useState<NewLetterCompletionState>({
    letterNameComplete: false, letterName: "FMB-1899-01-01-01",
    firstHeaderComplete: false, firstHeaderContent: null,
    sndHeaderComplete: false, sndHeaderContent: null,
    prevLetterAutoAvailable: false, prevLetterType: null, prevLetter: null,
    nextLetterAutoAvailable: false, nextLetterType: null, nextLetter: null,
    transkriptionValue: "FMB-C", editionValue: "FMB-C",
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
      const result = await createNewLetter(completionState)

      enqueueSnackbar("New letter created successfully " + result, { variant: "success" });
      // if (result) {
      //   props.handleClose();
      // } else {
      //   enqueueSnackbar("Error creating new letter", { variant: "error" });
      // }
    } catch (error) {
      enqueueSnackbar("Error creating new letter", { variant: "error" });
    }
  }

  const childOnChange = MiscUtils.stateHandling.createHandleChange(setCompletionState);

  const saveIsAvailable = (
    completionState.letterNameComplete &&
    completionState.firstHeaderComplete &&
    completionState.sndHeaderComplete
  )

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
          disabled={saveIsAvailable}
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
