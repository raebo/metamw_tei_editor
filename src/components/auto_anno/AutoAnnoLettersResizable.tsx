import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchAutoAnnoLetter } from "../../services/auto_anno/apiAutoAnno.service";
import { enqueueSnackbar } from "notistack";
import XMLDisplayParser from "../support/XmlDisplayParser";
import { RootState } from "../../redux/redux.store";
import {  useSelector } from "react-redux";
import AutoAnnoSnippetList from "./AutoAnnoSnippetList";
import AutoAnnoLetterHandle from "./AutoAnnoLetterHandle";
import { markSpanAndScrollToId } from "../../utils/auto_anno/domHandling";
import { setAutoAnnoLetter, setSnippetEntityInfo } from "../../redux/slices/auto.letter.snippet.slice";
import { Box, Divider, Typography } from "@mui/material";
import { useAppDispatch } from "../../redux/hooks";
import { ComponentMappingItem } from "../../services/mappings/editorMappings";
import SnippetReferencesList from "./snippet_form/SnippetReferencesList";
import SnippetFormContainer from "./snippet_form/SnippetFormContainer";
import SnippetEntityInfoDialog from "./snippet_form/SnippetEntityInfoDialog";

const AutoAnnoLettersResizable: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { job_id } = useParams<{ job_id: string }>();

  const dispatch = useAppDispatch();
  const autoAnnoLetterId = Number(id);
  const autoAnnoJobId = Number(job_id);
  const [selectedComponentList, setSelectedComponentList] = useState<ComponentMappingItem| null>(null)

  const reloadLetter = useSelector((state: RootState) =>
    state.autoLetterSnippet.letter?.reloadStatus?? false
  )
  const snippetReferences = useSelector((state: RootState) =>
    state.autoLetterSnippet.snippetReferences
  )

  // useMemo ensures that componentMappingList is not recreated on every render.
  const componentMappingList = useMemo(() => ({
    "SNIPPET_LIST": {
      showContainer: true,
      component: <AutoAnnoSnippetList autoJobLetterId={autoAnnoLetterId} />,
      action: () => true,
    },
    "REFERENCE_LIST": {
      showContainer: true,
      component: <SnippetReferencesList autoAnnoLetterId={autoAnnoLetterId} references={snippetReferences.items} />,
      action: () => true,
    },
  }), [autoAnnoLetterId, snippetReferences.items]);


  // handling the dialog for the snippet references
  const [refInfoDialogOpen, setRefInfoDialogOpen] = useState(false)
  const [refInfoDialogKey, setRefInfoDialogKey] = useState<string | null>(null)
  const stateEntityInfo = useSelector((state: RootState) => state.autoLetterSnippet.entityInfo)

  useEffect(() => {
    const handleStateEntityInfo = () => {
      if (stateEntityInfo && stateEntityInfo.key) {
        setRefInfoDialogKey(stateEntityInfo.key)
        setRefInfoDialogOpen(true)
      } else if (stateEntityInfo && stateEntityInfo.key === null) {
        setRefInfoDialogOpen(false)
      }
    }
    handleStateEntityInfo()
  }, [stateEntityInfo]);
  const handleInfoDialogClose = () => {
    dispatch(setSnippetEntityInfo({key: null}))
  }
  /////////

  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) {
      dispatch(setAutoAnnoLetter({ letter: { id: autoAnnoLetterId, reloadStatus: true } }));
      isMounted.current = true;
    }
    // Set reloadLetter to true after the component is mounted
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
          setSelectedComponentList(componentMappingList["SNIPPET_LIST"])
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

  useEffect(() => {
    // This ensures that setSelectedComponentList always gets the latest componentMappingList and triggers a re-render when necessary.
    setSelectedComponentList(prevState => {
      return snippetReferences.showReferences
        ? componentMappingList["REFERENCE_LIST"]
        : componentMappingList["SNIPPET_LIST"];
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snippetReferences.showReferences, componentMappingList]);

  const containerRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    const snippetScrollToId = () => {
      if (sharedSnippet) {
        markSpanAndScrollToId(sharedSnippet.xmlId);
      }
    };
    snippetScrollToId();
  }, [sharedSnippet])


  const [box1Width, setBox1Width] = useState(600);
  const isResizing = useRef(false);
  const [boxResizing, setBoxIsResizing] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    console.log("handleMouseDown");
    isResizing.current = true;
    setBoxIsResizing(true);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isResizing.current) {
      const newWidth = Math.max(200, Math.min(window.innerWidth - 200, e.clientX));
      setBox1Width(newWidth);
    }

    if (boxResizing) {
      const newWidth = Math.max(200, Math.min(window.innerWidth - 200, e.clientX));
      setBox1Width(newWidth);
    }
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    setBoxIsResizing(false);


    const dividerBoxes = document.getElementById("dividerBoxes")
    if (dividerBoxes) {
      // dividerBoxes.removeEventListener("mousemove", handleMouseMove);
      // dividerBoxes.removeEventListener("mouseup", handleMouseUp);
    }

    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);


  return (
    <>
      <>
        <Box>
          {transformedData?.letterName? (
          <Typography variant="h3">{transformedData.letterName}</Typography>
          ) : (
           <Typography variant="h3">No data available</Typography>
          )}
        </Box>
      </>
      <Box display="flex" width="100vw" height="100vh">
        {/* Left Panel */}
        <Box sx={{ width: `${box1Width}px`, bgcolor: "#f5f5f5", p: 2, borderRight: "1px solid #ddd" }}>
          {transformedData?.xmlContent ? (
            <div className="letter-xml letter-xml--auto-anno" id="letterXml" ref={containerRef}>
              <XMLDisplayParser xmlString={transformedData.xmlContent}/>;
            </div>
            ) : (
            <p>
              No data available
            </p>
            )}
        </Box>

        {/* Resizer Handle */}
        <Divider
          orientation="vertical"
          sx={{
            cursor: "ew-resize",
            width: "5px",
            bgcolor: "grey.400",
            "&:hover": { bgcolor: "grey.600" },
          }}
          onMouseDown={handleMouseDown}
        />

        {/* Right Panel */}
        <Box sx={{ flex: 1, bgcolor: "#eaeaea", p: 2 }}>
          <Box className="sub-box">
            <div className="sub-box-element sub-box-top">
              <SnippetFormContainer autoAnnoLetterId={autoAnnoLetterId} />
              {/*<AutoAnnoSnippetForm autoJobLetterId={autoAnnoLetterId}/>*/}
            </div>
            <div className="sub-box-element sub-box-center" style={{marginTop: "2%"}}>
              <AutoAnnoSnippetList autoJobLetterId={autoAnnoLetterId}/>
            </div>
            <div className="sub-box-element sub-box-bottom">
              <AutoAnnoLetterHandle autoJobId={autoAnnoJobId} autoJobLetterId={autoAnnoLetterId} />
            </div>

          </Box>
        </Box>
      </Box>
    </>
  //   <>
  //     <div>
  //       <Box>
  //         {transformedData?.letterName? (
  //           <Typography variant="h3">{transformedData.letterName}</Typography>
  //         ) : (
  //           <Typography variant="h3">No data available</Typography>
  //         )}
  //       </Box>
  //     </div>
  //     <div className="container-fmbc-letter">
  //       <Box display="flex" width="100vw" height="100vh">
  //         <Box sx={{ width: `${box1Width}px`, bgcolor: "#f5f5f5", p: 2, borderRight: "1px solid #ddd" }}>
  //         {/*<div className="box-1">*/}
  //           {transformedData?.xmlContent ? (
  //             <div className="letter-xml letter-xml--auto-anno" id="letterXml" ref={containerRef}>
  //               <XMLDisplayParser xmlString={transformedData.xmlContent}/>;
  //             </div>
  //           ) : (
  //             <p>
  //               No data available
  //             </p>
  //           )}
  //         {/*</div>*/}
  //         </Box>
  //         <Divider
  //           orientation="vertical"
  //           id={"dividerBoxes"}
  //           sx={{
  //             cursor: "ew-resize",
  //             width: "5px",
  //             bgcolor: "grey.400",
  //             "&:hover": { bgcolor: "grey.600" },
  //           }}
  //           onMouseDown={handleMouseDown}
  //         />
  //         <Box sx={{ flex: 1, bgcolor: "#eaeaea", p: 2 }}>
  //         {/*<div className="box-2">*/}
  //           <div className="sub-box">
  //             <div className="sub-box-element sub-box-top">
  //               <SnippetFormContainer autoAnnoLetterId={autoAnnoLetterId} />
  //               {/*<AutoAnnoSnippetForm autoJobLetterId={autoAnnoLetterId}/>*/}
  //             </div>
  //             <div className="sub-box-element sub-box-center" style={{marginTop: "2%"}}>
  //               { selectedComponentList?.component }
  //               {/*<AutoAnnoSnippetList autoJobLetterId={autoAnnoLetterId}/>*/}
  //             </div>
  //             <div className="sub-box-element sub-box-bottom">
  //               <AutoAnnoLetterHandle autoJobId={autoAnnoJobId} autoJobLetterId={autoAnnoLetterId} >
  //             </div>
  //           </div>
  //         {/*</div>*/}
  //         </Box>
  //       </Box>
  //     </div>
  //     <SnippetEntityInfoDialog
  //       open={refInfoDialogOpen}
  //       referenceKey={refInfoDialogKey}
  //       handleClose={handleInfoDialogClose}
  //     />
  //   </>
  )
}

export default AutoAnnoLettersResizable;
