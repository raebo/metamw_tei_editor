import { DefaultDialogProps } from '../EditorFormDialog';
import DynamicDataDisplay from '../../../../support/DynamicDataDisplay';
import { DISPLAY_NAME_MAP } from '../../../../../utils/entityMappings';
import React, { useEffect, useRef } from 'react';
import { Divider } from '@mui/material';
import TeiHeaderFirstHeadline from './TeiHeaderDialog/01TeiHeaderFirstHeadline';
import TeiHeaderSndHeadline from './TeiHeaderDialog/02TeiHeaderSndHeadline';
import TeiHeaderPrevLetter from './TeiHeaderDialog/03TeiHeaderPrevLetter';
import TeiHeaderNextLetter from './TeiHeaderDialog/04TeiHeaderNextLetter';
import TeiHeaderTransEdition from './TeiHeaderDialog/05TeiHeaderTransEdition';
import { MiscUtils } from '../../../../../utils/misc';
import TeiHeaderWritingReceivingPlace from './TeiHeaderDialog/06TeiHeaderWritingReceivingPlace';
import { SnippetEntity } from '../../../../../services/mappings/autoAnnoMappings';
import { EditorLetter } from '../../../../../services/mappings/editorMappings';
import TeiHeaderReceivingPerson from './TeiHeaderDialog/07TeiHeaderReceivingPerson';


export type TeiHeaderDialogProps = {
  autoAvailable: boolean | null;
  completionState: CompletionState;
  onChange: (updates: Partial<CompletionState>) => void;
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
  receiverAutoAvailable: boolean, receiverEntity: SnippetEntity | null,
  receivingPlaceAutoAvailable: boolean, receivingPlace: SnippetEntity | null,
  letterLanguage: null | "de" | "en" | "fr" | "it" | "la" | "grc" | "he",
}

const AddTeiHeaderDialog = (props: DefaultDialogProps) => {

  const [displayData, setDisplayData] = React.useState<{ [key: string]:string}|null>(null)

  const [completionState, setCompletionState] = React.useState<CompletionState>({
    firstHeaderComplete: false, firstHeaderContent: null,
    sndHeaderComplete: false, sndHeaderContent: null,
    prevLetterAutoAvailable: false, prevLetterType: null, prevLetter: null,
    nextLetterAutoAvailable: false, nextLetterType: null, nextLetter: null,
    transkriptionValue: "FMB-C", editionValue: "FMB-C",
    writingPlaceAutoAvailable: false, writingPlace: null,
    receiverAutoAvailable: true, receiverEntity: null,
    receivingPlaceAutoAvailable: false, receivingPlace: null,
    letterLanguage: null
  })

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const width = ref.current.scrollWidth;
      props.setWidth(`${width}px`); // add some padding if needed
    }
  }, []);

  const childOnChange = MiscUtils.stateHandling.createHandleChange(setCompletionState);

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
      <TeiHeaderFirstHeadline autoAvailable={completionState.firstHeaderComplete} completionState={completionState} onChange={childOnChange} />
      <TeiHeaderSndHeadline autoAvailable={completionState.sndHeaderComplete} completionState={completionState} onChange={childOnChange} />
      <TeiHeaderPrevLetter autoAvailable={completionState.prevLetterAutoAvailable} completionState={completionState} onChange={childOnChange}  />
      <TeiHeaderNextLetter autoAvailable={completionState.nextLetterAutoAvailable} completionState={completionState} onChange={childOnChange} />
      <TeiHeaderWritingReceivingPlace autoAvailable={null} completionState={completionState} onChange={childOnChange} dialogType={"writing"} textFieldValue={'Schreibort Auswählen'}/>
      <TeiHeaderReceivingPerson autoAvailable={completionState.receiverAutoAvailable} completionState={completionState} onChange={childOnChange} />
      <TeiHeaderWritingReceivingPlace autoAvailable={null} completionState={completionState} onChange={childOnChange} dialogType={"receiving"} textFieldValue={'Empfängerort Auswählen'}/>
      <TeiHeaderTransEdition autoAvailable={null} completionState={completionState} onChange={childOnChange} />

      <Divider orientation="vertical" flexItem />
    </div>
  )
}

export default AddTeiHeaderDialog;


// Erste Kopfzeile des Briefes einfügen
// Anna Mustermann an Felix Mendelssohn Bartholdy in Musterstadt
// Anna Mustermann an Felix Mendelssohn Bartholdy und Otto Mustermann in Musterstadt
// Anna Mustermann und Otto Mustermann an Felix Mendelssohn Bartholdy in Musterstadt
// Anna Mustermann und Otto Mustermann an Felix Mendelssohn Bartholdy und Amalie Musterfrau in Musterstadt
// Anna Mustermann an Felix Mendelssohn Bartholdy
// Felix Mendelssohn Bartholdy an Anna Mustermann in Musterstadt
//
//Zweite Kopfzeile des Briefes einfügen
// 'Musterstadt, 01. Januar 1821'
// 'Musterstadt, 1. und 15. Januar 1821'
// '1. Januar 1821'
// 'vor dem 1. Januar'
// 'nach dem 5. Februar'
// 'zwischen dem 1. und 5. Januar'
// 'zwischen dem 1. Januar und 7. Februar'
// 'Musterstadt, 1821'
// '1821'
// 'Musterstadt, 1. Januar 1821'
//
// Auswahl Vorgängerbrief
// unbekannt
// noch nicht ermittelt
// Auswahl Briefe
//
// Auswahl Nachfolgebrief
//
//
// Transkription: FMB-C
//
// Edition: FMB-C
//
// Schreibort auswählen
// Schreibeort auswählen (wenn Ort nicht vorhanden, "eigener Eintrag" wählen und später nachtragen)
//
// Empfänger auswählen -> Person
//
// Empfängerort auwählen
// EigenerEintrag
// Empfängerort auswählen (wenn Ort nicht vorhanden, "eigener Eintrag" wählen und später nachtragen
//
// Sprache des Briefes auswählen
// Sprache des Briefes (weitere Sprachen können später hinzugefügt werden)', combobox, ('de': 'Deutsch'; 'en': 'Englisch';'fr': 'Französisch';'it':'Italienisch';'la':'Lateinisch';'grc':'Altgriechisch';'he':'Hebräisch'),
//
//
//         <fileDesc>
//             <titleStmt>
//                 <title key="gb-1842-01-03-01">Felix Mendelssohn Bartholdy an Anna Mustermann in
//                     Musterstadt <lb/>Musterstadt, 1821</title>
//                 <title type="incipit" level="s"
//                     ><?oxy_custom_start type="oxy_content_highlight" color="211,255,143"?>wird durch
//                     Klick auf Publish-Button automatisch eingetragen!<?oxy_custom_end?></title>
//                 <title type="sub" level="s">Felix Mendelssohn Bartholdy Correspondence Online
//                     (FMB-C)</title>
//                 <title type="precursor" key="fmb-1820-08-02-01">Felix Mendelssohn Bartholdy an
//                     Johann Ludwig Casper in Paris; Berlin, 2. August 1820</title>
//                 <title type="successor" key="fmb-1820-08-02-01">Felix Mendelssohn Bartholdy an
//                     Johann Ludwig Casper in Paris; Berlin, 2. August 1820</title>
//                 <respStmt resp="transcription">
//                     <resp resp="transcription">Transkription: </resp>
//                     <name resp="transcription">FMB-C</name>
//                 </respStmt>
//                 <respStmt resp="edition">
//                     <resp resp="edition">Edition: </resp>
//                     <name resp="edition">FMB-C</name>
//                 </respStmt>
//             </titleStmt>
//             <publicationStmt>
//                 <publisher>Felix Mendelssohn Bartholdy Correspondence Online-Ausgabe (FMB-C).
//                     Institut für Musikwissenschaft und Medienwissenschaft. Humboldt-Universität zu
//                     Berlin</publisher>
//                 <address>
//                     <street>Am Kupfergraben 5</street>
//                     <placeName><settlement>10117
//                         Berlin</settlement><country>Deutschland</country></placeName>
//                 </address>
//                 <idno type="URI">http://www.mendelssohn-online.com</idno>
//                 <availability>
//                     <licence target="http://creativecommons.org/licenses/by/4.0/">Creative Commons
//                         Attribution 4.0 International (CC BY 4.0)</licence>
//                 </availability>
//             </publicationStmt>
//             <seriesStmt>
//                 <p>Maschinenlesbare Übertragung der vollständigen Korrespondenz Felix Mendelssohn
//                     Bartholdys (FMB-C)</p>
//             </seriesStmt>
//         </fileDesc>
