import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";

const AutoAnnoSnippetForm = () => {
  const sharedSnippet = useSelector((state: RootState) => state.autoLetterSnippet.snippet);

  return (
    <div>
      <h2>Sub Box 1</h2>
      <p>Shared Value: { sharedSnippet?.referenceName }</p>
    </div>
  );
};

export default AutoAnnoSnippetForm;