import { DefaultDialogProps} from '../EditorFormDialog';
import DynamicDataDisplay from '../../../../support/DynamicDataDisplay';
import { DISPLAY_NAME_MAP } from '../../../../../utils/entityMappings';
import React, { useEffect, useRef } from 'react';
import {Divider} from '@mui/material';
import TeiHeaderFirstHeadline from './TeiHeaderDialog/10TeiHeaderFirstHeadline';
import TeiHeaderSndHeadline from './TeiHeaderDialog/20TeiHeaderSndHeadline';
import TeiHeaderPrevLetter from './TeiHeaderDialog/30TeiHeaderPrevLetter';
import TeiHeaderNextLetter from './TeiHeaderDialog/40TeiHeaderNextLetter';
import TeiHeaderTransEdition from './TeiHeaderDialog/70TeiHeaderTransEdition';
import { MiscUtils } from '../../../../../utils/misc';
import TeiHeaderWritingReceivingPlace from './TeiHeaderDialog/50TeiHeaderWritingReceivingPlace';
import { SnippetEntity } from '../../../../../services/mappings/autoAnnoMappings';
import { EditorLetter } from '../../../../../services/mappings/editorMappings';
import {EditorUtils} from "../../../../../utils/editor";
import {enqueueSnackbar} from "notistack";
import {EditorConstants, HeaderPerson, LanguageOption} from "../../../../../constants/editor";
import TeiHeaderEditorTranskriptor from "./TeiHeaderDialog/80EditorTranskriptor";
import TeiHeaderReceivers from "./TeiHeaderDialog/60TeiHeaderReceivers";
import DialogContent from "@mui/material/DialogContent";
import {DialogActionButton} from "./Misc/DialogActionButton";


export type TeiHeaderDialogProps = {
  autoAvailable: boolean | null;
  completionState: CompletionState;
  onChange: (updates: Partial<CompletionState>) => void;
	teiHeader: Element | null;
}

export type TeiHeaderWritingReceivingPlaceProps = TeiHeaderDialogProps & {
  dialogType: 'writing' | 'receiving',
  textFieldValue: 'Schreibort Auswählen' | 'Empfängerort Auswählen',
};

type CompletionState = {
  firstHeaderComplete: boolean, firstHeaderContent: string | null,
  sndHeaderComplete: boolean, sndHeaderContent: string | null,
  prevLetterAutoAvailable: boolean, prevLetterType: 'unknown' | 'not_identified' | 'select' | null, prevLetter: EditorLetter | null,
  nextLetterAutoAvailable: boolean, nextLetterType: 'unknown' | 'not_identified' | 'select' | null, nextLetter: EditorLetter | null,
  transkriptionValue: string, editionValue: string
  writingPlaceAutoAvailable: boolean, writingPlace: SnippetEntity | null,
  receiverAutoAvailable: boolean, receivers: HeaderPerson[],
  receivingPlaceAutoAvailable: boolean, receivingPlace: SnippetEntity | null,
  letterLanguage: LanguageOption[] | []
	editorValue: string | null,
	transkriptorValue: string | null,
}

const ManageTeiHeaderDialog = (props: DefaultDialogProps) => {

  const [displayData] = React.useState<{ [key: string]:string}|null>(null)
	const [formIsValid, setFormIsValid] = React.useState<boolean>(false);
	const [docData, setDocData] = React.useState<{
		xmlDoc: XMLDocument | null;
		teiHeader: Element | null;
	}>({ xmlDoc: props.xmlDoc, teiHeader: null });

	React.useEffect(() => {
		if (!docData.xmlDoc) {
			enqueueSnackbar("Kein XML-Dokument zum Parsen vorhanden", { variant: "error" });
			return
		}

		try {
			const teiHeader = EditorUtils.teiHeaderContent.extractTeiHeader(docData.xmlDoc);

			if (!teiHeader) {
				enqueueSnackbar("Kein TEI-Header im XML-Dokument gefunden", { variant: "error" });
				setDocData({ xmlDoc: null, teiHeader: null });
				return;
			}

			setDocData((prevState) => ({ ...prevState, teiHeader }));
		} catch (err) {
			enqueueSnackbar(MiscUtils.misc.getErrorMessage(err), { variant: "error" });
			setDocData({ xmlDoc: null, teiHeader: null });
		}
	}, [props]);

  const [completionState, setCompletionState] = React.useState<CompletionState>({
    firstHeaderComplete: false, firstHeaderContent: null,
    sndHeaderComplete: false, sndHeaderContent: null,
    prevLetterAutoAvailable: false, prevLetterType: null, prevLetter: null,
    nextLetterAutoAvailable: false, nextLetterType: null, nextLetter: null,
    transkriptionValue: "FMB-C", editionValue: "FMB-C",
    writingPlaceAutoAvailable: false, writingPlace: null,
    receiverAutoAvailable: true, receivers: [],
    receivingPlaceAutoAvailable: false, receivingPlace: null,
    letterLanguage: [],
		editorValue: null, transkriptorValue: null
  })

  const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const saveIsAvailable  = () : boolean => {
			const formStatus : boolean[] = []

			if (completionState.firstHeaderContent === null || completionState.sndHeaderContent === null) {
				formStatus.push(false)
			}
			if (completionState.prevLetterType === 'select' && completionState.prevLetter === null) {
				formStatus.push(false)
			}
			if (completionState.nextLetterType === 'select' && completionState.nextLetter === null) {
				formStatus.push(false)
			}
			if (completionState.prevLetterType === null || completionState.nextLetterType === null) {
				formStatus.push(false)
			}

			return !formStatus.some((status) =>  !status );
		}
		setFormIsValid(saveIsAvailable)

	}, [completionState])

	const writeHeaderData = () : boolean => {
		if (docData.teiHeader === null) {
			enqueueSnackbar("TEI-Header ist nicht verfügbar", { variant: "error" });
			return false;
		}

		try {
			EditorUtils.teiHeaderContent.setTitleElementHeadlines(docData.teiHeader, completionState.firstHeaderContent, completionState.sndHeaderContent);
			EditorUtils.teiHeaderContent.setPrevNextLetter(docData.teiHeader, "precursor", completionState.prevLetterType, completionState.prevLetter);
			EditorUtils.teiHeaderContent.setPrevNextLetter(docData.teiHeader, "successor", completionState.nextLetterType, completionState.nextLetter);
			EditorUtils.teiHeaderContent.setWritingPlace(docData.teiHeader, completionState.writingPlace);
			EditorUtils.teiHeaderContent.setReceivingPlace(docData.teiHeader, completionState.receivingPlace);
			EditorUtils.teiHeaderContent.setReceivers(docData.teiHeader, completionState.receivers);
			EditorUtils.teiHeaderContent.setLanguages(docData.teiHeader, completionState.letterLanguage);
			EditorUtils.teiHeaderContent.setEditorTranskriptorName(docData.teiHeader, 'edition', completionState.editorValue);
			EditorUtils.teiHeaderContent.setEditorTranskriptorName(docData.teiHeader, 'transcription', completionState.transkriptorValue);

		} catch (error) {
			enqueueSnackbar("Fehler beim Schreiben der TEI-Header-Daten: " + MiscUtils.misc.getErrorMessage(error), { variant: "error" });
			return false;
		}

		return true;
	}

	const submitSaveHandler = async () => {
		if(!docData.xmlDoc|| !docData.teiHeader) {
			enqueueSnackbar("Ungültiges XML-Dokument oder kein TEI-Header gefunden", { variant: "error" });
			return;
		}

		try {
			writeHeaderData()

			props.onSave(docData.xmlDoc, EditorConstants.changeTypes.misc.HEADER_UPDATED, "Der HEI-Header wurde aktualisiert.", null );

		} catch (error) {
			enqueueSnackbar("Fehler beim Speichern des TEI-Headers: " + MiscUtils.misc.getErrorMessage(error), { variant: "error" });
			props.onClose()
		}
	}

  const childOnChange = MiscUtils.stateHandling.createHandleChange(setCompletionState);

  return (
    <div ref={ref}>
			<DialogContent>
				<div className="autoSnippetFormRow">
					{ displayData !== null && (
						<DynamicDataDisplay data={displayData} displayNameMap={DISPLAY_NAME_MAP} />
					)}
				</div>
				<TeiHeaderFirstHeadline teiHeader={docData.teiHeader} autoAvailable={completionState.firstHeaderComplete} completionState={completionState} onChange={childOnChange} />
				<TeiHeaderSndHeadline teiHeader={docData.teiHeader} autoAvailable={completionState.sndHeaderComplete} completionState={completionState} onChange={childOnChange} />
				<TeiHeaderPrevLetter teiHeader={docData.teiHeader} autoAvailable={completionState.prevLetterAutoAvailable} completionState={completionState} onChange={childOnChange}  />
				<TeiHeaderNextLetter teiHeader={docData.teiHeader} autoAvailable={completionState.nextLetterAutoAvailable} completionState={completionState} onChange={childOnChange} />
				<TeiHeaderWritingReceivingPlace teiHeader={docData.teiHeader} autoAvailable={null} completionState={completionState} onChange={childOnChange} dialogType={"writing"} textFieldValue={'Schreibort Auswählen'}/>
				<TeiHeaderReceivers teiHeader={docData.teiHeader} autoAvailable={completionState.receiverAutoAvailable} completionState={completionState} onChange={childOnChange} />
				<TeiHeaderWritingReceivingPlace teiHeader={docData.teiHeader} autoAvailable={null} completionState={completionState} onChange={childOnChange} dialogType={"receiving"} textFieldValue={'Empfängerort Auswählen'}/>
				<TeiHeaderTransEdition teiHeader={docData.teiHeader} autoAvailable={null} completionState={completionState} onChange={childOnChange} />
				<TeiHeaderEditorTranskriptor teiHeader={docData.teiHeader} autoAvailable={null} completionState={completionState} onChange={childOnChange} />

				<Divider orientation="vertical" flexItem />
			</DialogContent>
			<Divider />
			<DialogActionButton label={"Header Speichern"} onClick={submitSaveHandler} disabled={!formIsValid}/>

			{/*<div>*/}
			{/*	<pre>{JSON.stringify(completionState, null, 2)}</pre>*/}
			{/*</div>*/}
    </div>
  )
}

export default ManageTeiHeaderDialog;
