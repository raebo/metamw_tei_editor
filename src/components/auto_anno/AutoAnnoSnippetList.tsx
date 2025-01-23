import React, { useEffect, useState } from "react";
import {  useSelector } from "react-redux";
import {
  setAutoAnnoSnippet,
  setAutoAnnoLetter,
  setAutoAnnoSnippetShow
} from "../../redux/slices/auto.letter.snippet.slice";
import { fetchAutoAnnoLetterSnippets } from "../../services/autoAnno.service";
import {
  AutoAnnoSnippet,
  getStatusDetails,
} from "../../services/mappings/autoAnnoMappings";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { IconButton } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import Paper from "@mui/material/Paper";
import { Edit } from "@mui/icons-material";
import { RootState } from "../../redux/redux.store";
import { useAppDispatch } from "../../redux/hooks";

interface AutoAnnoSnippetListProps {
  autoJobLetterId: number
}

interface SnippetUpdateParams {
  snippetId: string;
  xmlId: string;
  referenceName: string;
  [key: string]: any; // Optional: Allows additional dynamic fields
}

const AutoAnnoSnippetList = ( { autoJobLetterId }: AutoAnnoSnippetListProps) => {
  const dispatch = useAppDispatch();

  const [autoAnnoSnippetData, setAutoAnnoSnippetData] = useState<AutoAnnoSnippet[] | undefined>();

  const reloadStatusSnippets = useSelector((state: RootState) =>
    state.autoLetterSnippet.letter?.reloadSnippetsStatus?? false
  );

  useEffect(() => {
    // reload Snippets after the component is mounted
    dispatch(setAutoAnnoLetter({ letter: { id: autoJobLetterId, reloadSnippetsStatus: true } }));
  }, [dispatch, autoJobLetterId]);


  useEffect(() => {
    const getAutoAnnoSnippetData = async () => {
      if (autoJobLetterId && reloadStatusSnippets) {
        const result = await fetchAutoAnnoLetterSnippets(autoJobLetterId);
        setAutoAnnoSnippetData(result);
        dispatch(setAutoAnnoLetter({letter: {id: autoJobLetterId, reloadSnippetsStatus: false} }))
      }
    }
    getAutoAnnoSnippetData()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoJobLetterId, reloadStatusSnippets]);

  const handleSnippetUpdate = (params: SnippetUpdateParams) => {
    const { snippetId, xmlId, referenceName, referenceKey, referenceType, ...rest } = params;

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
    );
    dispatch(
      setAutoAnnoSnippetShow({
        snippetShow: {
          referenceName: referenceName,
          referenceKey: referenceKey,
          referenceType: referenceType
        }
      }
      )
    )
  };

  const snippetColumns: GridColDef[] = [
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      sortable: false,
      renderCell: (params) => {
        const { label, backgroundColor, foregroundColor } = getStatusDetails(params.row.status);

        return (
          <div
            style={{
              backgroundColor,
              padding: '0',
              borderRadius: '4px',
              textAlign: 'center',
              color: foregroundColor
            }}
          >
            { label }
          </div>
        );
      }
    },
    {field: 'reference_key_orig', headerName: 'Wert (Sempria)', width: 150},
    {field: 'reference_name_orig', headerName: 'Wert (Sempria)', width: 450},
    {field: 'reference_key_final', headerName: 'Wert (Übernommen)', width: 150},
    {field: 'reference_name_final', headerName: 'Wert (Übernommen)', width: 150},
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      renderCell: (params) => {
        let isEditable = true

        if (params.row.status !== 'open') { isEditable = false; }

        const handleIconClick = async () => {
          try {
           handleSnippetUpdate({
              snippetId: String(params.row.id),
              xmlId: params.row.xml_id,
              referenceName: params.row.reference_name_orig,
              referenceKey: params.row.reference_key_orig,
              referenceType: params.row.reference_type_orig
           })
          } catch (err) {
            enqueueSnackbar(err instanceof Error ? err.message : 'An unknown error occurred', { variant: 'error' });
          }
        };

        if (isEditable) {
          return (
            <IconButton onClick={handleIconClick} disabled={!isEditable} aria-label="info">
              <Edit color="primary"/>
            </IconButton>
          );
        } else {
          return ("")
        }
      }
    }
  ]

  const paginationModel = {page: 0, pageSize: 5};

  return (
    <>
      <Paper>
        <DataGrid
          columns={snippetColumns}
          rows={autoAnnoSnippetData}
          initialState={{pagination: { paginationModel }}}
          pageSizeOptions={[5, 10]}
          sx={{border: 0}}
        />
      </Paper>
    </>
  );
};

export default AutoAnnoSnippetList;
