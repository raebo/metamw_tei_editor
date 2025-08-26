import { DefaultDialogProps } from '../EditorFormDialog';
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
import {useSelector} from "react-redux";
import {RootState} from "../../../../../redux/redux.store";
import {setReloadLetterContent} from "../../../../../redux/slices/editor.letter.slice";
import {useAppDispatch} from "../../../../../redux/hooks";
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

	const dispatch = useAppDispatch();
  const [displayData] = React.useState<{ [key: string]:string}|null>(null)
	const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter)
	const stateTeiXml = useSelector((state: RootState) => state.editorLetter.letter.xmlContent)

	const [formIsValid, setFormIsValid] = React.useState<boolean>(false);

	const [parsedXml, setParsedXml] = React.useState<{
		xmlDoc: XMLDocument | null;
		teiHeader: Element | null;
	}>({ xmlDoc: null, teiHeader: null });

	React.useEffect(() => {
		if (!stateTeiXml) {
			dispatch(setReloadLetterContent({ reloadLetterContent: true }));
			return;
		}

		try {
			const xmlDoc = EditorUtils.xmlCheck.extractTeiDocumentFromString(stateTeiXml);
			const teiHeader = EditorUtils.teiHeaderContent.extractTeiHeader(xmlDoc);
			setParsedXml({ xmlDoc, teiHeader });
		} catch (err) {
			enqueueSnackbar(MiscUtils.misc.getErrorMessage(err), { variant: "error" });
			setParsedXml({ xmlDoc: null, teiHeader: null });
		}
	}, [stateTeiXml, dispatch]);

	const { xmlDoc, teiHeader } = parsedXml;

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
    if (ref.current) {
      const width = ref.current.scrollWidth;
      props.setWidth(`${width}px`); // add some padding if needed
    }
  }, []);

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

			return !formStatus.some((status) =>  !status );
		}
		setFormIsValid(saveIsAvailable)

	}, [completionState])

	const writeHeaderData = () : boolean => {
		if (teiHeader === null) {
			enqueueSnackbar("TEI-Header ist nicht verfügbar", { variant: "error" });
			return false;
		}

		try {
			EditorUtils.teiHeaderContent.setTitleElementHeadlines(teiHeader, completionState.firstHeaderContent, completionState.sndHeaderContent);
			EditorUtils.teiHeaderContent.setPrevNextLetter(teiHeader, "precursor", completionState.prevLetterType, completionState.prevLetter);
			EditorUtils.teiHeaderContent.setPrevNextLetter(teiHeader, "successor", completionState.nextLetterType, completionState.nextLetter);
			EditorUtils.teiHeaderContent.setWritingPlace(teiHeader, completionState.writingPlace);
			EditorUtils.teiHeaderContent.setReceivingPlace(teiHeader, completionState.receivingPlace);
			EditorUtils.teiHeaderContent.setReceivers(teiHeader, completionState.receivers);
			EditorUtils.teiHeaderContent.setLanguages(teiHeader, completionState.letterLanguage);
			EditorUtils.teiHeaderContent.setEditorTranskriptorName(teiHeader, 'edition', completionState.editorValue);
			EditorUtils.teiHeaderContent.setEditorTranskriptorName(teiHeader, 'transcription', completionState.transkriptorValue);


		} catch (error) {
			enqueueSnackbar("Fehler beim Schreiben der TEI-Header-Daten: " + MiscUtils.misc.getErrorMessage(error), { variant: "error" });
			return false;
		}

		return true;
	}


	const submitSaveHandler = async () => {
		try {

			if(!xmlDoc || !teiHeader) {
				enqueueSnackbar("Ungültiges XML-Dokument oder kein TEI-Header gefunden", { variant: "error" });
				return;
			}

			writeHeaderData()

			const serializer = new XMLSerializer();
			const updatedXml = serializer.serializeToString(xmlDoc);

			const result = await EditorUtils.backendService.patchContent(
				updatedXml, stateEditorLetter.id, EditorConstants.changeTypes.misc.HEADER_UPDATED, null)

			if (result) {
				dispatch(setReloadLetterContent({ reloadLetterContent: true }))
				enqueueSnackbar("Die Kopfdaten des Briefes wurden erfolgreich gespeichert", { variant: "success" })
			}

		} catch (error) {
			enqueueSnackbar("Fehler beim Speichern des TEI-Headers: " + MiscUtils.misc.getErrorMessage(error), { variant: "error" });
		}

		props.onClose()

	}

  const childOnChange = MiscUtils.stateHandling.createHandleChange(setCompletionState);

  return (
    <div ref={ref}>
			<DialogContent>
				<div className="autoSnippetFormRow">
					{ displayData !== null ? (
						<DynamicDataDisplay data={displayData} displayNameMap={DISPLAY_NAME_MAP} />
					) : (
						<>
						</>
					)
					}
				</div>
				<TeiHeaderFirstHeadline teiHeader={teiHeader} autoAvailable={completionState.firstHeaderComplete} completionState={completionState} onChange={childOnChange} />
				<TeiHeaderSndHeadline teiHeader={teiHeader} autoAvailable={completionState.sndHeaderComplete} completionState={completionState} onChange={childOnChange} />
				<TeiHeaderPrevLetter teiHeader={teiHeader} autoAvailable={completionState.prevLetterAutoAvailable} completionState={completionState} onChange={childOnChange}  />
				<TeiHeaderNextLetter teiHeader={teiHeader} autoAvailable={completionState.nextLetterAutoAvailable} completionState={completionState} onChange={childOnChange} />
				<TeiHeaderWritingReceivingPlace teiHeader={teiHeader} autoAvailable={null} completionState={completionState} onChange={childOnChange} dialogType={"writing"} textFieldValue={'Schreibort Auswählen'}/>
				<TeiHeaderReceivers teiHeader={teiHeader} autoAvailable={completionState.receiverAutoAvailable} completionState={completionState} onChange={childOnChange} />
				<TeiHeaderWritingReceivingPlace teiHeader={teiHeader} autoAvailable={null} completionState={completionState} onChange={childOnChange} dialogType={"receiving"} textFieldValue={'Empfängerort Auswählen'}/>
				<TeiHeaderTransEdition teiHeader={teiHeader} autoAvailable={null} completionState={completionState} onChange={childOnChange} />
				<TeiHeaderEditorTranskriptor teiHeader={teiHeader} autoAvailable={null} completionState={completionState} onChange={childOnChange} />

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
