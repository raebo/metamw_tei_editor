import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchAutoAnnoLetter } from "../../services/autoAnno.service";
import { enqueueSnackbar } from "notistack";
import XMLDisplayParser from "../support/XmlDisplayParser";
import { RootState } from "../../redux/redux.store";
import {  useSelector } from "react-redux";
import AutoAnnoSnippetForm from "./AutoAnnoSnippetForm";
import AutoAnnoSnippetList from "./AutoAnnoSnippetList";
import AutoAnnoLetterHandle from "./AutoAnnoLetterHandle";
import { domReplaceNodeWithMarkedSpan } from "../../utils/auto_anno/domHandling";
import { setAutoAnnoLetter } from "../../redux/slices/auto.letter.snippet.slice";
import { Box, Typography } from "@mui/material";
import { useAppDispatch } from "../../redux/hooks";

const AutoAnnoLetters: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { job_id } = useParams<{ job_id: string }>();

  const dispatch = useAppDispatch();
  const autoAnnoLetterId = Number(id);
  const autoAnnoJobId = Number(job_id);

  const reloadLetter = useSelector((state: RootState) =>
    state.autoLetterSnippet.letter?.reloadStatus?? false
  );

  useEffect(() => {
    // Set reloadLetter to true after the component is mounted
    dispatch(setAutoAnnoLetter({ letter: { id: autoAnnoLetterId, reloadStatus: true } }));
  }, [dispatch, autoAnnoLetterId]);

  const [transformedData, setTransformedData] = useState<any>({xmlContent: null, letterName: null});

  const sharedSnippet = useSelector((state: RootState) => state.autoLetterSnippet.snippet);

  useEffect(() => {
    const getData = async () => {
      if (autoAnnoLetterId && reloadLetter) {
        try {
          const result = await fetchAutoAnnoLetter(id);

          if (result && result.xml_content_updated) {
            setTransformedData({xmlContent: result.xml_content_updated, letterName: result.letter_name});
          } else if (result && result.xml_content) {
            setTransformedData({xmlContent: result.xml_content, letterName: result.letter_name});
          } else {
            setTransformedData({xmlContent: null, letterName: result?.letter_name ? result.letter_name : null});
          }

          dispatch(setAutoAnnoLetter({letter: {id: autoAnnoLetterId, reloadStatus: false} }))
        } catch (err) {
          enqueueSnackbar(err instanceof Error ? err.message : 'An unknown error occurred', { variant: 'error' });
        } finally {
          // setLoading(false);
        }
      }
    };

    getData();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadLetter, dispatch]);

  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollToId = () => {
      if (sharedSnippet) {
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

  return (
    <>
      <div>
        <Box>
          {transformedData?.letterName? (
            <Typography variant="h3">{transformedData.letterName}</Typography>
          ) : (
            <Typography variant="h3">No data available</Typography>
          )}
        </Box>
      </div>
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
              <AutoAnnoLetterHandle autoJobId={autoAnnoJobId} autoJobLetterId={autoAnnoLetterId} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AutoAnnoLetters;
