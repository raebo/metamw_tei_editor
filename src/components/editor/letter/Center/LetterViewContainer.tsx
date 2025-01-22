import React, { useEffect, useState } from "react";
import { fetchLetterData } from "../../../../services/editor/apiLettersRequest.service";
import XMLDisplayParser from "../../../support/XmlDisplayParser";
import { useSelector } from "react-redux";
import { RootState } from "../../../../redux/redux.store";

const LetterViewContainer = () => {

  const [letterXmlContent, setLetterXmlContent] = useState<string>("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter)

  useEffect(() => {
    const returnLetterData = (letterId: number) => {
      fetchLetterData(letterId)
        .then((result) => {
          if (result) {
            setLetterXmlContent(result.xmlContent);
          } else {
            setLetterXmlContent("ERROR: Letter content not found");
          }
        })
        .catch(() => {
          setLetterXmlContent("ERROR: Failed to fetch letter content");
        });
    }

    if (stateEditorLetter.id) {
      returnLetterData(stateEditorLetter.id)
    }

  }, [stateEditorLetter]);


  return (
    <div className="letter-view-container">
      <div className="container-fmbc-letter">
        <div className="box-1">
          {letterXmlContent ? (
            <div className="letter-xml" id="letterXml" ref={containerRef}>
              <XMLDisplayParser xmlString={letterXmlContent}/>;
            </div>
          ) : (
            <p>
              No data available
            </p>
          )}
        </div>
       </div>
     </div>
    );
   }

   export default LetterViewContainer;
