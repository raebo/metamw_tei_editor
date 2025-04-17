import React from 'react'
import { DefaultDialogProps } from '../EditorFormDialog'
import { EditorConstants, EntityType } from '../../../../../constants/editor'
import FormAutocomplete from '../../Util/FormAutocomplete'
import { Box, Divider, IconButton } from '@mui/material'
import { InfoOutlined, InfoSharp } from '@mui/icons-material'
import DynamicDataDisplay from '../../../../support/DynamicDataDisplay'
import { DISPLAY_NAME_MAP } from '../../../../../utils/entityMappings'
import { fetchAndMapPersonEntityData, fetchMetamwEntityData } from '../../../../../services/auto_anno/apiMetaMw.service';
import { enqueueSnackbar } from 'notistack'
import Button from '@mui/material/Button'
import { fetchLetterData } from '../../../../../services/editor/apiLettersRequest.service'
import { useSelector } from 'react-redux'
import { RootState } from '../../../../../redux/redux.store'
import { markupGeneration } from '../../../../../utils/editor/markupGeneration'
import { xmlCheck } from '../../../../../utils/editor/xmlCheck'
import { EditorUtils } from '../../../../../utils/editor'
import { setReloadLetterContent } from '../../../../../redux/slices/editor.letter.slice'
import { useAppDispatch } from '../../../../../redux/hooks'
import { ActOfWritingElement, PersonEntity } from '../../../../../services/mappings/editorMappings';

type CompletionState = {
  authorCompleteAvailable: boolean
  nameAuthor: string | null
  keyAuthor: string | null
  writerCompleteAvailable: boolean
  nameWriter: string | null
  keyWriter: string | null
}

const AddWritingAct = (props: DefaultDialogProps) => {

  const dispatch = useAppDispatch()
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter)
  const [keyAuthor, setKeyAuthor] = React.useState<string | null>(null)
  const [keyWriter, setKeyWriter] = React.useState<string | null>(null)
  const [displayData, setDisplayData] = React.useState<{ [key: string]:string}|null>(null)

  const [completionState, setCompletionState] = React.useState<CompletionState>({
    authorCompleteAvailable: true,
    nameAuthor: null,
    keyAuthor: null,
    writerCompleteAvailable: false,
    nameWriter: null,
    keyWriter: null
  })

  const authorChoosed = async (authorKey: string) => {
    if (authorKey === null) {
      enqueueSnackbar("No author selected", { variant: "error" })
      return
    }

    try  {
      const result : PersonEntity = await fetchAndMapPersonEntityData(authorKey)

      if (result !== null) {

        setCompletionState(prev => {
          const newState = {
            ...prev,
            authorCompleteAvailable: false,
            writerCompleteAvailable: true,
            nameAuthor: result.fullName,
            keyAuthor: authorKey,
          };
          return newState;
        });
      }
    } catch (error) {
      enqueueSnackbar(`Error fetching data for entity with key: ${keyAuthor}` , { variant: "error" })
    }
  }

  const writerChoosed = async (writerKey: string) => {
    if (writerKey === null) {
      enqueueSnackbar("No writer selected", { variant: "error" })
      return
    }

    try  {
      const result : PersonEntity = await fetchAndMapPersonEntityData(writerKey)

      if (result !== null) {
        setCompletionState(prev => {
          const newState = {
            ...prev,
            authorCompleteAvailable: false,
            writerCompleteAvailable: false,
            nameWriter: result.fullName,
            keyWriter: writerKey
          }
          return newState
        })

        setKeyWriter(writerKey)
      }

    } catch (error) {
      enqueueSnackbar(`Error fetching data for entity with key: ${keyAuthor}` , { variant: "error" })
    }
  }


  const handleInfoIconClick = async (referenceKey: string | null) => {
    if (!referenceKey) { return }
    try {
      const result = await fetchMetamwEntityData(referenceKey)
      setDisplayData(result)
    } catch (error) {
      enqueueSnackbar(`Error fetching data for entity with key: ${referenceKey}` , { variant: "error" })
    }

  }

  const handleAddClick = async () => {
    if (!stateEditorLetter.id) {
      enqueueSnackbar("No letter ID found", { variant: "error" })
      return
    }

    if (!keyAuthor) {
      enqueueSnackbar("No key for Author set", { variant: "error" })
      return
    }

    if (!keyWriter) {
      enqueueSnackbar("No key for Writer set", { variant: "error" })
      return
    }

    try {
      const result = await fetchLetterData(stateEditorLetter.id)

      if (!result?.xmlContent) {
        enqueueSnackbar("Remote letter data is null or empty", { variant: "error" })
        return
      }

      const authorWriters: ActOfWritingElement[] = [
        { role: 'author', key: keyAuthor, name: completionState.nameAuthor ?? "" },
        { role: 'writer', key: keyWriter, name: completionState.nameWriter ?? "" }
      ]

      const { xmlString } = markupGeneration.insertActOfWritingBlock(
        xmlCheck.parseXml(result.xmlContent),
        authorWriters
      )

      const patchResult = await EditorUtils.backendService.patchContent(
        xmlString,
        stateEditorLetter.id,
        EditorConstants.changeTypes.note.ADDED,
        null
      )

      if (patchResult) {
        dispatch(setReloadLetterContent({ reloadLetterContent: true }))
        enqueueSnackbar("Neuer Schreibakt wurde hinzugefügt", { variant: "success" })
      } else {
        enqueueSnackbar("Daten konnten nicht aktualisiert werden", { variant: "error" })
      }
    } catch (error) {
      enqueueSnackbar(`Fehler beim Hinzufügen des Schreibakts: ${String(error)}`, { variant: "error" })
    }

    props.onClose()
  }


  return (
    <>
      <div className="autoSnippetFormRow">
        { displayData !== null ? (
          <DynamicDataDisplay data={displayData} displayNameMap={DISPLAY_NAME_MAP} />
        ) : (
          <>
          </>
        )
        }
      </div>
      <div className="autoSnippetFormRow">
        <div className="form-item form-item--key">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Autor Auswählen:
            {keyAuthor && (
              <>
                <span style={{ fontWeight: 'bold' }}>{keyAuthor}</span>
                <IconButton
                  onClick={() => handleInfoIconClick(keyAuthor)}
                  edge="end"
                  size="small"
                >
                  <InfoSharp />
                </IconButton>
              </>
            )}
            {!keyAuthor && (
              <IconButton
                onClick={() => handleInfoIconClick(null)}
                edge="end"
                size="small"
              >
                <InfoOutlined />
              </IconButton>
            )}
          </label>
          <FormAutocomplete
            isDisabled={!completionState.authorCompleteAvailable}
            entityType={EntityType.PERSON}
            entityKey={keyAuthor}
            setFormEntityKey={setKeyAuthor}
            afterClickHandler={authorChoosed}
          />
        </div>
      </div>

      <div className="autoSnippetFormRow">
        <div className="form-item form-item--key">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Schreiber Auswählen:
            { keyWriter && (
              <>
                <span style={{ fontWeight: 'bold' }}>{keyWriter}</span>
                <IconButton
                  onClick={() => handleInfoIconClick(keyWriter)}
                  edge="end"
                  size="small"
                >
                  <InfoSharp />
                </IconButton>
              </>
            )}
            { !keyWriter && (
              <IconButton
                onClick={() => handleInfoIconClick(null)}
                edge="end"
                size="small"
              >
                <InfoOutlined />
              </IconButton>
            )}
          </label>
          <FormAutocomplete
            isDisabled={!completionState.writerCompleteAvailable}
            entityType={EntityType.PERSON}
            entityKey={keyWriter}
            setFormEntityKey={setKeyWriter}
            afterClickHandler={writerChoosed}
          />
        </div>
      </div>
      <Divider orientation="vertical" flexItem />
      <div>
        <Box display="flex" justifyContent="flex-end" sx={{marginTop: '10%'}}>
          <Button
            disabled={keyAuthor === null || keyWriter === null}
            variant="contained"
            onClick={handleAddClick}
          >
            Schreibakt Hinzufügen
          </Button>
        </Box>
      </div>
    </>
  )
}

export default AddWritingAct
