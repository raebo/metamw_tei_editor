import { createAsyncThunk } from "@reduxjs/toolkit";
import { SnippetUpdateParams } from "../../components/auto_anno/AutoAnnoSnippetList";
import {
  setAutoAnnoSnippet,
  setAutoSnippetFormContainer,
  setSnippetReferences
} from "../slices/auto.letter.snippet.slice";
import { SnippetReference } from "../../services/mappings/autoAnnoMappings";


export const setAutoAnnoSnippetAndShow = createAsyncThunk(
  'snippet/setSnippetAndShow',
  async (
    { snippetUpdateParams }: { snippetUpdateParams: SnippetUpdateParams },
    { dispatch }
  ) => {
    const {snippetId, xmlId, referenceName, referenceKey, referenceType, ...rest} = snippetUpdateParams

    dispatch(
      setAutoAnnoSnippet({
        snippet: {
          id: snippetId,
          xmlId: xmlId,
          referenceName: referenceName,
          referenceKey: referenceKey,
          referenceType: referenceType,
          referenceNameChanged: referenceName,
          referenceKeyChanged: referenceKey,
          referenceTypeChanged: referenceType,
          ...rest
        }
      })
    )
    dispatch(
      setAutoSnippetFormContainer({
        snippetFormContainer: {
          form: snippetUpdateParams.snippetFormContainer.form,
          buttons: snippetUpdateParams.snippetFormContainer.buttons,
        }
      })
    )
  }
)

export const setAutoSnippetAndSnippetReferences = createAsyncThunk(
  'snippet/setSnippetAndReferences',
  async (
    { snippetUpdateParams, references, showSnippetReferences }: { snippetUpdateParams: SnippetUpdateParams, references: SnippetReference[], showSnippetReferences: boolean },
    { dispatch }
  ) => {
    const { snippetId, xmlId, referenceName, referenceKey, referenceType, ...rest } = snippetUpdateParams

    dispatch(
      setSnippetReferences({
        references: {
          items: references,
          showReferences: showSnippetReferences,
          referenceFormActive: true
        }
      })
    )
    dispatch(
      setAutoSnippetFormContainer({
        snippetFormContainer: {
          form: "BLANK_FORM",
          buttons: "BLANK_BUTTONS",
          actionButtonDisabled: true
        }
      })
    )
    dispatch(
      setAutoAnnoSnippet({
        snippet: {
          id: snippetId,
          xmlId: xmlId,
          referenceName: referenceName,
          referenceKey: referenceKey,
          referenceType: referenceType,
          referenceNameChanged: referenceName,
          referenceKeyChanged: referenceKey,
          referenceTypeChanged: referenceType,
          ...rest
        }
      })
    )
  }
)
