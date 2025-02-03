import React, { ReactNode, useEffect, useRef, useState } from "react";
import { ComponentMappingItem } from "../../../services/mappings/editorMappings";
import Paper from "@mui/material/Paper";
import { Divider } from "@mui/material";
import BlankForm from "./BlankForm";
import BlankButtons from "./BlankButtons";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";
import ShowButtons from "./ShowButtons";
import ShowForm from "./ShowForm";
import EditForm from "./EditForm";
import EditButtons from "./EditButtons";

interface SnippetFormContainerProps {
  autoAnnoLetterId: number
}

interface SnippetComponentMappingItem {
  component: ReactNode | null
}


const SnippetFormContainer = (props: SnippetFormContainerProps) => {

  const [selectedComponentForm, setSelectedComponentForm] = useState<SnippetComponentMappingItem| null>(null)
  const [selectedComponentButtons, setSelectedComponentButtons] = useState<SnippetComponentMappingItem | null>(null)
  const isMounted = useRef(false);

  useEffect(() => {
    if(!isMounted.current) {
      setSelectedComponentForm(componentFormArea["BLANK_Form"])
      setSelectedComponentButtons(componentButtonsArea["BLANK_BUTTONS"])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const snippetFormContainer = useSelector((state: RootState) => state.autoLetterSnippet.snippetFormContainer);
  useEffect(() => {
    const setComponentForm = () => {
      if (snippetFormContainer) {
        setSelectedComponentForm(componentFormArea[snippetFormContainer.form])
        setSelectedComponentButtons(componentButtonsArea[snippetFormContainer.buttons])
      }
    }
    setComponentForm()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snippetFormContainer]);

  const componentFormArea : Record<string, SnippetComponentMappingItem> = {
    "BLANK_FORM": { component: <BlankForm />},
    "SHOW_FORM": { component: <ShowForm /> },
    "EDIT_FORM": { component: <EditForm autoAnnoLetterId={props.autoAnnoLetterId}/>}
  }

  const componentButtonsArea : Record<string, SnippetComponentMappingItem> = {
    "BLANK_BUTTONS": { component: <BlankButtons /> },
    "SHOW_BUTTONS": { component: <ShowButtons autoJobLetterId={props.autoAnnoLetterId} /> },
    "EDIT_BUTTONS": { component: <EditButtons autoJobLetterId={props.autoAnnoLetterId}/> }
  }

  return (
    <div>
      <>
        <Paper>
          <div className={"autoSnippetFormBox"}>
            { selectedComponentForm?.component }
            { selectedComponentButtons?.component }
          </div>
        </Paper>
      </>
    </div>
  )
}

export default SnippetFormContainer
