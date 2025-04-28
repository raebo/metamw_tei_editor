import { Stack, TextField } from '@mui/material';
import { TeiHeaderDialogProps } from '../AddTeiHeaderDialog';

const TeiHeaderTransEdition = (props: TeiHeaderDialogProps) => {

  const completionState = props.completionState

  const setTranskriptionValue = (value: string) => {
    console.log(value)
    props.onChange({ transkriptionValue: value })
  }

  const setEditionValue = (value: string) => {
    props.onChange({ editionValue: value })
  }

  return (
    <>
      <div className="autoSnippetFormRow" style={ { marginTop: "25px" }}>
        <Stack direction="row" spacing={2}>
          <TextField
            id="outlined-basic"
            label="Transkription"
            variant="outlined"
            value={completionState.transkriptionValue}
            onChange={(event) => setTranskriptionValue(event.target.value)}
          />
          <TextField
          id="outlined-basic"
          label="Edition"
          variant="outlined"
          value={completionState.editionValue}
          onChange={(event) => setEditionValue(event.target.value)}
        />
        </Stack>
      </div>
    </>
  )
}

export default TeiHeaderTransEdition
