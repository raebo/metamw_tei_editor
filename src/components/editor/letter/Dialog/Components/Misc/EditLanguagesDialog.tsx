import {DefaultDialogProps} from "../../EditorFormDialog";
import {useAppDispatch} from "../../../../../../redux/hooks";
import {useSelector} from "react-redux";
import {RootState} from "../../../../../../redux/redux.store";
import React, {useEffect, useState} from "react";
import {setReloadLetterContent} from "../../../../../../redux/slices/editor.letter.slice";
import {EditorUtils} from "../../../../../../utils/editor";
import {enqueueSnackbar} from "notistack";
import {MiscUtils} from "../../../../../../utils/misc";
import {EditorConstants, LanguageOption} from "../../../../../../constants/editor";
import {Box, Chip, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Stack} from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import DialogContent from "@mui/material/DialogContent";
import {DialogActionButton} from "./DialogActionButton";

const EditLanguagesDialog = (props: DefaultDialogProps) => {
  const [letterLanguages, setLetterLanguages] = useState<LanguageOption[]>([])
  const dispatch = useAppDispatch();
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter)
  const [selectedLang, setSelectedLang] = useState("");
  const stateTeiXml = useSelector((state: RootState) => state.editorLetter.letter.xmlContent)
  
  const [parsedXml, setParsedXml] = React.useState<{
    xmlDoc: XMLDocument | null;
    teiHeader: Element | null;
  }>({ xmlDoc: null, teiHeader: null });
  
  useEffect(() => {
    if (!stateTeiXml) {
      dispatch(setReloadLetterContent({ reloadLetterContent: true }));
      return;
    }
    
   	try {
			const xmlDoc = EditorUtils.xmlCheck.extractTeiDocumentFromString(stateTeiXml);
			const teiHeader = EditorUtils.teiHeaderContent.extractTeiHeader(xmlDoc);
			setParsedXml({ xmlDoc, teiHeader });
		} catch (err) {
			enqueueSnackbar(MiscUtils.misc.getErrorMessage(err), { variant: "error" });
			setParsedXml({ xmlDoc: null, teiHeader: null });
		}
  }, [stateTeiXml, dispatch]);
  
  useEffect(() => {
    
    
    if(parsedXml && parsedXml.teiHeader) {
      const assignedLanguages : LanguageOption[] = EditorUtils.teiHeaderContent.extractLanguages(parsedXml.teiHeader)
      setLetterLanguages(Array.from(new Set([...assignedLanguages, ...letterLanguages])));
    }
  }, [parsedXml]);
  
  const handleLanguageChange = (event: SelectChangeEvent) => {
    const value = event.target.value as 'de' | 'en' | 'fr' | 'it' | 'la' | 'grc' | 'he';
    
    const language = EditorConstants.LANGUAGES.find( lang => lang.value === value)
    
    if (language) {
      setLetterLanguages(Array.from(new Set([...letterLanguages, language])));
      setSelectedLang("");
    }
  }
  
  const handleRemoveLanguage = (lang: LanguageOption) => {
    const updatedLanguages = letterLanguages.filter((l) => l !== lang);
    setLetterLanguages(updatedLanguages);
  }
  
  const handleSave = async () => {
    try {
      if (!parsedXml.xmlDoc || !parsedXml.teiHeader) {
        throw new Error("No xml content found");
      }
      
      EditorUtils.teiHeaderContent.setLanguages(parsedXml.teiHeader, letterLanguages);
      
      const xmlSerializer = new XMLSerializer();
      
      const result = await EditorUtils.backendService.patchContent(
        xmlSerializer.serializeToString(parsedXml.xmlDoc) , stateEditorLetter.id, EditorConstants.changeTypes.misc.HEADER_LANGUAGES_UPDATED, null
      )
      
      if (result) {
        dispatch(setReloadLetterContent( { reloadLetterContent: true } ));
        enqueueSnackbar("Languages updated", { variant: "success" });
      } else {
        enqueueSnackbar("Data could not be updated on backend side", { variant: "error" });
      }
    } catch (error) {
      enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: "error" });
    }
    
    props.onClose();
  }

  
  
  return (
    <>
      <DialogContent>
        <div className="autoSnippetFormRow" style={ { marginTop: "25px", width: "98%" } }>
          <Stack direction="row" spacing={2}>
            <FormControl variant="outlined" sx={{m: 1, minWidth: 120, width: '98%'}}>
              <InputLabel id="auto-anno-snippet-reference-type">Sprache des Briefes</InputLabel>
              <Select
                value={selectedLang}
                disabled={false}
                labelId="simple-select-filled-label"
                id="simple-select-filled"
                onChange={(event) => handleLanguageChange(event)}
              >
                <MenuItem value="">
                  <em>Sprache Auswählen</em>
                </MenuItem>
                { EditorConstants.LANGUAGES.map((item) => {
                  const isAdded = letterLanguages.some(lang => lang.value === item.value );
                  return (
                    <MenuItem
                      key={item.value}
                      value={item.value}
                      disabled={isAdded}
                      sx={isAdded ? { color: "gray" } : {}}
                    >
                      {item.label}
                    </MenuItem>
                  );
                })}
              </Select>
              <Box mt={2} sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                { letterLanguages.map((lang) => {
                  const label =
                    EditorConstants.LANGUAGES.filter((l) => l.value === lang.value)[0].label || ""
                  
                  return (
                    <Chip
                      key={lang.value}
                      label={label}
                      onDelete={() => handleRemoveLanguage(lang)}
                      deleteIcon={<CancelIcon />}
                      color="primary"
                      variant="outlined"
                    />
                  );
                }) }
              </Box>
            </FormControl>
          </Stack>
        </div>
      </DialogContent>
      <DialogActionButton label={"Sprachen Speichern"} onClick={ handleSave } disabled={letterLanguages.length == 0} />
    </>
  )
}

export default EditLanguagesDialog;
