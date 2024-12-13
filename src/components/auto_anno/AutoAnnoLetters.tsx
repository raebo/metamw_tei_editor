import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { styled } from "@mui/material";
import Paper from "@mui/material/Paper";
import { fetchAutoAnnoLetter } from "../../services/autoAnno.service";
import { enqueueSnackbar } from "notistack";
import XMLDisplayParser from "../support/XmlDisplayParser";
import { RootState } from "../../redux/redux.store";
import { useSelector } from "react-redux";
import AutoAnnoSnippetForm from "./AutoAnnoSnippetForm";
import AutoAnnoSnippetList from "./AutoAnnoSnippetList";
import AutoAnnoLetterHandle from "./AutoAnnoLetterHandle";
import { domReplaceNodeWithMarkedSpan } from "../../utils/auto_anno/domHandling";
import { AutoAnnoJobLetter } from "../../services/mappings/autoAnnoMappings";

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

  const transformedData = autoLetterData
    ? {
      xmlContent: autoLetterData.xml_content,
    }
    : null;

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
  )
}

export default AutoAnnoLetters;
