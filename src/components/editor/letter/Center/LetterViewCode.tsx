import React, { useMemo, useRef, useState } from 'react';
import { RootState } from "../../../../redux/redux.store";
import Editor, { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import vkbeautify from 'vkbeautify';
import { XMLParser } from "fast-xml-parser";
import { Badge, Box } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Button from '@mui/material/Button';
import { useDispatch, useSelector } from 'react-redux';
import { EditorUtils } from '../../../../utils/editor';
import { EditorConstants } from '../../../../constants/editor';
import { enqueueSnackbar } from 'notistack';
import { setReloadLetterContent } from '../../../../redux/slices/editor.letter.slice';

type LetterViewCodeProps = {
  xmlString: string;
};

const validateXml = (xmlString: string): { line: number; column: number; message: string }[] => {
  const parser = new XMLParser({
    ignoreAttributes: false, // Don't ignore attributes (keep them for parsing)
    parseTagValue: false, // Disable parsing tag values
    parseAttributeValue: true, // Disable parsing attribute values
    //stopAtFirstError: true // Stop on first error to capture it
  });

  try {
    parser.parse(xmlString, true); // Try parsing XML
    return [];
  } catch (error: any) {

    console.log(error);
    const errorMessage = error.message || 'Invalid XML structure';
    const errorLine = 1; // Use a default value or improve with further parsing
    const errorColumn = 1; // Same as above

    return [
      {
        line: errorLine,
        column: errorColumn,
        message: errorMessage
      }
    ];
  }
};

const setXmlMarkers = (xml: string, model: monaco.editor.ITextModel) => {
  const errors = validateXml(xml);

  const markers: monaco.editor.IMarkerData[] = errors.map((error) => ({
    severity: monaco.MarkerSeverity.Error,
    message: error.message,
    startLineNumber: error.line,
    startColumn: error.column,
    endLineNumber: error.line,
    endColumn: error.column + 1
  }));

  monaco.editor.setModelMarkers(model, 'xml', markers);
};

interface IPositionState {
  lineNumber: number | null;
  column: number | null;
}

const LetterViewCode = ({ xmlString }: LetterViewCodeProps) => {
  const dispatch = useDispatch();
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter);
  const formattedXml = useMemo(() => {
    return vkbeautify.xml(xmlString);
  }, [xmlString]);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null); //This refers to the editor instance itself (i.e., the Monaco editor's UI and editor functionality like setting the cursor position, handling events, etc.). It's used for interacting with the editor as a whole, such as setting or getting the cursor position (editor.getPosition()), or setting editor options.
  const modelRef = useRef<monaco.editor.ITextModel | null>(null); // This refers to the text model behind the editor (i.e., the underlying data model that holds the content of the file). It's where you can manipulate the text content directly, set markers (for syntax errors), and track changes in the content. A model is required to do things like setting or getting markers (monaco.editor.setModelMarkers(model, ...)) or retrieving the content (model.getValue()).
  const [cursorPosition, setCursorPosition] = React.useState<IPositionState>({
    lineNumber: null,
    column: null,
  });

  const [errorCount, setErrorCount] = useState<number>(0);

  const handleEditorMount: OnMount = (editor) => {
    const model = editor.getModel();
    if (model) {
      modelRef.current = model;
      editorRef.current = editor

      const updateMarkers = () => {
        const markers = monaco.editor.getModelMarkers({ resource: model.uri });
        setErrorCount(markers.length);
      };

      updateMarkers();
      const disposable = editor.onDidChangeModelDecorations(() => {
        updateMarkers();
      });

      if (cursorPosition.lineNumber && cursorPosition.column) {
        editor.setPosition({
          lineNumber: cursorPosition.lineNumber,
          column: cursorPosition.column,
        });
        editor.revealPositionInCenter({
          lineNumber: cursorPosition.lineNumber,
          column: cursorPosition.column,
        });
      }

      return () => disposable.dispose();
    }
  }

  const handleEditorChange = (value: string | undefined) => {
    const model = modelRef.current;

    if (model && value !== undefined) {
      setXmlMarkers(value, model);
    }
  };

  const handleSave = async () => {
    if (!stateEditorLetter.id) {
      enqueueSnackbar("No letter ID given from state", { variant: "error" });
      return;
    }

    if (editorRef.current) {
      const content = editorRef.current.getValue();

      const currentPosition = editorRef.current.getPosition();
      if (currentPosition) {
        setCursorPosition({
          lineNumber: currentPosition.lineNumber,
          column: currentPosition.column,
        });
      }

      try {
        await EditorUtils.backendService.patchContent(content, stateEditorLetter.id, EditorConstants.changeTypes.MANUAL_CODE_CHANGE, null)

        dispatch(setReloadLetterContent({ reloadLetterContent: true }))
        enqueueSnackbar("Änderungen wurden gespeichert", { variant: "success" });

      } catch (error: any) {
        const response = error.response;

        if (response !== undefined) {
          enqueueSnackbar("Error saving content: " + response.data.error, { variant: "error" });
        } else {
          enqueueSnackbar("Error saving content: " + error, { variant: "error" });
        }
      }
    }
  }

  return (
    <>
      <Box display="flex" flexDirection="column" gap={2} sx={ { width: "100%" }}>
        <div className="letterViewCodeContainer">
          <Editor
            key={xmlString}
            defaultLanguage="xml"
            value={formattedXml}
            options={{
              readOnly: false,
              minimap: { enabled: true },
              lineNumbers: 'on',
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              formatOnPaste: true,
              formatOnType: true
            }}
            onMount={handleEditorMount}
            onChange={handleEditorChange}
          />
        </div>
        <Box
          component="hr"
          sx={{
            borderColor: 'gray',
            borderWidth: 1,
            my: 2,
          }}
        />
        <Box
          display="flex"
          alignItems="center"
          gap={2}
          justifyContent="flex-end"
          bgcolor="white"
          p={2}
          borderRadius={1}
          boxShadow={2}
          width="100%"
          >
          <Badge
            badgeContent={errorCount}
            color={errorCount > 0 ? "error" : "success"}
            overlap="circular"
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
            {errorCount > 0 ? <ErrorIcon color="error" /> : <CheckCircleIcon color="success" />}
          </Badge>

          <Button
            variant="contained"
            color="primary"
            disabled={errorCount > 0}
            onClick={handleSave}
            sx={{marginRight: "20px" }}
          >
            Inhalt Speichern
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default LetterViewCode;
