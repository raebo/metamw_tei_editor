import React, { useEffect, useState } from "react";
import { fetchLetterData } from "../../../../services/editor/apiLettersRequest.service";
import XMLDisplayParser from "../../../support/XmlDisplayParser";

interface LetterViewContainerProps {
  letterId: number
}

const LetterViewContainer = (props: LetterViewContainerProps) => {

  const [letterXmlContent, setLetterXmlContent] = useState<string>("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getLetterXmlContent = async () => {
      if (props.letterId) {
        const result = await fetchLetterData(props.letterId);

        if (result) {
          setLetterXmlContent(result.xmlContent);
        } else {
          setLetterXmlContent("ERROR: Letter content not found");
        }
      }
    }

    getLetterXmlContent()
  }, [props.letterId]);


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
