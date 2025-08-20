import {TeiHeaderDialogProps} from "../ManageTeiHeaderDialog";
import React, {useEffect, useState} from "react";
import {EditorUtils} from "../../../../../../utils/editor";
import {Stack, TextField} from "@mui/material";

const TeiHeaderEditorTranskriptor = (props: TeiHeaderDialogProps) => {

	const [transkriptorValue, setTranskriptorValue] = useState<string | null>(props.completionState.transkriptorValue)
	const [editorValue, setEditorValue] = useState<string | null>(props.completionState.editorValue)

	useEffect(() => {
		const { name: editorName  } = EditorUtils.teiHeaderContent.extractEditorTranskriptorName(props.teiHeader, 'edition')
		const { name: transkriptorName } = EditorUtils.teiHeaderContent.extractEditorTranskriptorName(props.teiHeader, 'transcription')

		if (editorName) {
			props.onChange({ editorValue: editorName });
			setEditorValue(editorName);
		}

		if (transkriptorName) {
			props.onChange({transkriptorValue: transkriptorName});
			setTranskriptorValue(transkriptorName);
		}

	}, [props.teiHeader])

	const changeTranskriptorValue = (value: string) => {
		props.onChange({ transkriptorValue: value })
		setTranskriptorValue(value);
	}

	const changeEditorValue = (value: string) => {
		props.onChange({ editorValue: value })
		setEditorValue(value);
	}


	return (
		<>
			<div className="autoSnippetFormRow" style={ { marginTop: "25px", width: "98%" } }>
				<Stack direction="row" spacing={2} sx={{width: '100%' }}>
					<TextField
						fullWidth={true}
						id="outlined-basic"
						label="Transkriptor"
						variant="outlined"
						disabled={false}
						value={transkriptorValue}
						onChange={(event) => changeTranskriptorValue(event.target.value)}
					/>
					<TextField
						fullWidth={true}
						id="outlined-basic"
						label="Editior"
						variant="outlined"
						disabled={false}
						value={editorValue}
						onChange={(event) => changeEditorValue(event.target.value)}
					/>
				</Stack>
			</div>
		</>
	)
}

export default TeiHeaderEditorTranskriptor
