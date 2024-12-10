import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setCurrentSnippet } from "../../redux/slices/auto.letter.snippet.slice";
import { AutoAnnoSnippet, fetchAutoAnnoLetterSnippets } from "../../services/autoAnno.service";

interface AutoAnnoSnippetListProps {
  autoJobLetterId: number
}

interface SnippetUpdateParams {
  snippetId: string;
  xmlId: string;
  referenceName: string;
  [key: string]: any; // Optional: Allows additional dynamic fields
}


const AutoAnnoSnippetList = ( { autoJobLetterId}: AutoAnnoSnippetListProps) => {
  const dispatch = useDispatch();

  const [autoAnnoSnippetData, setAutoAnnoSnippetData] = useState<AutoAnnoSnippet[] | undefined>();

  useEffect(() => {
    const getAutoAnnoSnippetData = async () => {
      const result = await fetchAutoAnnoLetterSnippets(autoJobLetterId);
      setAutoAnnoSnippetData(result);
    }

    getAutoAnnoSnippetData()
  }, []);


  const handleSnippetUpdate = (params: SnippetUpdateParams) => {
    const { snippetId, xmlId, referenceName, referenceKey, ...rest } = params;

    dispatch(
      setCurrentSnippet({
        snippet: {
          id: snippetId,
          xmlId: xmlId,
          referenceName: referenceName,
          referenceKey: referenceKey,
          ...rest
        }
      })
    );
  };

  return (
    <div>
      <h2>Snippet Liste</h2>
      <div>
        <table>
          <thead>
          <tr>
            <th>XML-ID</th>
            <th>Status</th>
            <th>Wert (Sempria)</th>
            <th>Typ (Sempria)</th>
            <th>Wert (Final)</th>
            <th>Typ (Final)</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
          {autoAnnoSnippetData && autoAnnoSnippetData.length > 0 ? (
            autoAnnoSnippetData.map((snippet) => (
              <tr key={snippet.id}>
                <td>{snippet.xml_id}</td>
                <td>{snippet.status}</td>
                <td>{snippet.reference_key_orig}</td>
                <td>{snippet.reference_type_orig}</td>
                <td>{snippet.reference_key_final}</td>
                <td>{snippet.reference_type_final}</td>
                <td>
                  <button onClick={() => handleSnippetUpdate({
                    snippetId: String(snippet?.id),
                    xmlId: snippet?.xml_id,
                    referenceName: snippet?.reference_name_orig,
                    referenceKey: snippet.reference_key_orig,
                    referenceType: snippet.reference_type_orig
                  })
                  }>
                    Action</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7}>No data available</td>
            </tr>
          )}
          </tbody>
        </table>

      </div>
      {/*<input*/}
      {/*  type="text"*/}
      {/*  placeholder="Type to update"*/}
      {/*  onChange={(e) => handleSnippetUpdate(e.target.value as string, "value")}*/}
      {/*/>*/}
    </div>
  );
};

export default AutoAnnoSnippetList;