import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { styled } from "@mui/material";
import Paper from "@mui/material/Paper";
import { AutoAnnoJobLetter, fetchAutoAnnoLetter } from "../../services/autoAnno.service";
import { enqueueSnackbar } from "notistack";
import XMLDisplayParser from "../support/XmlDisplayParser";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import AutoAnnoSnippetForm from "./AutoAnnoSnippetForm";
import AutoAnnoSnippetList from "./AutoAnnoSnippetList";
import AutoAnnoLetterHandle from "./AutoAnnoLetterHandle";
import { domReplaceNodeWithMarkedSpan } from "../../utils/domHandling";

const AutoAnnoLetters: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const autoAnnoLetterId = Number(id);

  const [autoLetterData, setAutoLetterData] = useState<AutoAnnoJobLetter| undefined>();

  const sharedSnippet = useSelector((state: RootState) => state.autoLetterSnippet.snippet);
  const sharedJob = useSelector((state: RootState) => state.autoLetterSnippet.job);


  useEffect(() => {
    const getData = async () => {
      try {
        const result = await fetchAutoAnnoLetter(id);
        setAutoLetterData(result);
      } catch (err) {
        enqueueSnackbar(err instanceof Error ? err.message : 'An unknown error occurred', { variant: 'error' });
      } finally {
        // setLoading(false);
      }
    };

    getData();
  }, []);



  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollToId = () => {
      if (sharedSnippet) {
        // const targetElement = document.getElementById(sharedSnippet.id);
        const targetElement= document.querySelector('[xml\\:id="' + sharedSnippet.xmlId + '"]');

        if (targetElement && containerRef.current) {
          targetElement.scrollIntoView({
            behavior: 'smooth', // Smooth scrolling
            block: 'start',     // Scroll to the top of the element
          });

          domReplaceNodeWithMarkedSpan(targetElement);
        }
      }
    };
    scrollToId();
  }, [sharedSnippet]);

  const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    scrollbarColor: '#1A2027 #1A2027',
    height: '100%',
    ...theme.applyStyles('dark', {
      backgroundColor: '#1A2027',
    }),
  }));

  const transformedData = autoLetterData
    ? {
      xmlContent: autoLetterData.xml_content,
    }
    : null;

  const xmlContent = `
  <text>
    <body>
  <div class=""><p style="paragraph_without_indent">Wahrhaftig, <seg type="salute">liebe Fanny</seg>, ich war heute Morgen Willens, dir einen langen, langen Brief zu schreiben, und mit diesem Vorsatze fuhr ich auch ins Bad. Doch auf dem Hinwege fiel mir ein <title xml:id="title_17b49076-92a3-42ee-8557-52bdba08680c">Thema<list style="hidden" type="fmb_works_directory" xml:id="title_clj2sjdg-pzuq-dytq-n2nb-ayaquvjz0n8a"> <item n="1" sortKey="musical_works" style="hidden"></item> <item n="2" sortKey="instrumental_music" style="hidden"></item> <item n="3" sortKey="piano_music" style="hidden"></item> <item n="4" sortKey="works_for_piano_two_hands" style="hidden"></item></list><name key="PSN0000001" style="hidden" type="author">Mendelssohn Bartholdy (bis 1816: Mendelssohn), Jacob Ludwig Felix (1809-1847)</name><name key="PRC0100409" style="hidden">Charakterstück (Mit heftiger Bewegung) h-Moll, 17. Juli 1824<idno type="MWV">U 44</idno><idno type="op">7/2</idno></name></title> ein, das ich auf dem Rückwege ausführte; und als wir nun zu Hause kamen, schrieb ich’s auf, und schicke es hier vor deinen Richterstuhl. Du weißt wenn die Richter den Dieb nicht kriegen können so nehmen sie das Gestohlne. So gehts auch hier. Kaum war mir das Thema eingefallen, so dacht ich: halt; Dieb! <persName xml:id="persName_e4ec2b63-8497-4cee-9158-3a5097016ace">Sebastian<name key="PSN0109617" style="hidden">Bach, Johann Sebastian (1685-1750)</name></persName>! Aber wie ein tröstender Engel stand mir dein <title xml:id="title_3dbb47c8-6411-4e1e-a023-36a07ab4673f">1000 stimmiges Stück aus Cmoll<name key="PSN0111893" style="hidden" type="author">Hensel, Fanny Cäcilia (1805-1847)</name><name key="CRT0111478" style="hidden" type="music">»Toccata« c-Moll für Klavier HU 114 (13. März 1824)</name></title> zur Seite, und ich dachte: wenn’s Fanny selbst gethan hat, so wird sie mich wol nicht derohalben verdammen, und weiter will ich nichts. Nimm’s ja nicht zu langsam, und spann den Engländer vor!</p>
  </div>
    </body>
  </text>
`;

  return (
    <>
      <div className="container-fmbc-letter">
        <div className="box-1">
          {transformedData?.xmlContent ? (
            <div className="letter-xml" id="letterXml" ref={containerRef}>
              <XMLDisplayParser xmlString={transformedData.xmlContent}/>;
            </div>
          ) : (
            <p>
              No data available
            </p>
          )}
        </div>
        <div className="box-2">
          <div className="sub-box">
            <div className="sub-box-element sub-box-top">
              <AutoAnnoSnippetForm autoJobLetterId={autoAnnoLetterId}/>
            </div>
            <div className="sub-box-element sub-box-center">
              <AutoAnnoSnippetList autoJobLetterId={autoAnnoLetterId}/>
            </div>
            <div className="sub-box-element sub-box-bottom">
              <AutoAnnoLetterHandle autoJobLetterId={autoAnnoLetterId}/>
            </div>
          </div>
        </div>
      </div>
    </>


    // <Grid container spacing={2}>
    //   <Grid size={{xs: 6, md: 6, lg: 6, xl: 6}} height="40%">
    //     {transformedData?.xmlContent ? (
    //             <div className="letter-xml" id="letterXml">
    //               {/*<div dangerouslySetInnerHTML={{ __html: xmlContent}} />*/}
    //               <XMLDisplayParser xmlString={transformedData.xmlContent} />;
  //                   {/*<XMLDisplayParser xmlString={transformedData.xmlContent} />*/}
  //                   {/*<XMLDisplayParser xmlString={xmlContent} />*/}
  //                     {/*<div>*/}
  //                     {/*  <pre lang={"xml"}>*/}
  //                     {/*    {{ transformedData.xmlContent }}*/}
  //                     {/*  </pre>*/}
  //                     {/*</div>*/}
  //             </div>
  //         ) : (
  //             <Item>
  //               <p>
  //                 No data available
  //               </p>
  //             </Item>
  //         )}
  //       </Grid>
  //       <Grid size={{ xs: 6, md: 4 }}>
  //         <Item>xs=6 md=4</Item>
  //       </Grid>
  //       <Grid size={{ xs: 6, md: 4 }}>
  //         <Item>xs=6 md=4</Item>
  //       </Grid>
  //       <Grid size={{ xs: 6, md: 8 }}>
  //         <Item>xs=6 md=8</Item>
  //       </Grid>
  //     </Grid>
  )
}

export default AutoAnnoLetters;
