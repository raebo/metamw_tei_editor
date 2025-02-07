import React, { useEffect, useState } from "react";
import {  useSelector } from "react-redux";
import {
  setAutoAnnoLetter,
} from "../../redux/slices/auto.letter.snippet.slice";
import { fetchAutoAnnoLetterSnippets } from "../../services/auto_anno/apiAutoAnno.service";
import {
  AutoAnnoSnippet,
  getStatusDetails, SnippetReference,
} from "../../services/mappings/autoAnnoMappings";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { IconButton } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import Paper from "@mui/material/Paper";
import { Edit } from "@mui/icons-material";
import { RootState } from "../../redux/redux.store";
import { useAppDispatch } from "../../redux/hooks";
import { setAutoAnnoSnippetAndShow, setAutoSnippetAndSnippetReferences } from "../../redux/thunks/auto.snippet.thunks";
import { markSpanAndScrollToId, referenceTypeForXmlId } from "../../utils/auto_anno/domHandling";

interface AutoAnnoSnippetListProps {
  autoJobLetterId: number
}

export interface SnippetUpdateParams {
  snippetId: string
  xmlId: string
  [key: string]: any // Optional: Allows additional dynamic fields
}

const AutoAnnoSnippetList = ( { autoJobLetterId }: AutoAnnoSnippetListProps) => {
  const dispatch = useAppDispatch();

  const [autoAnnoSnippetData, setAutoAnnoSnippetData] = useState<AutoAnnoSnippet[] | undefined>();

  const reloadStatusSnippets = useSelector((state: RootState) =>
    state.autoLetterSnippet.letter?.reloadSnippetsStatus?? false
  )

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
  }, [autoJobLetterId, reloadStatusSnippets])

  const showSnippetReferences = (snippetParams: SnippetUpdateParams, snippetReferences: SnippetReference[] ) => {
    dispatch(
      setAutoSnippetAndSnippetReferences({
        snippetUpdateParams: snippetParams,
        references: snippetReferences,
        showSnippetReferences: snippetReferences.length > 1
      })
    )
  }

  const handleSnippetUpdate = (params: SnippetUpdateParams) => {
    dispatch(setAutoAnnoSnippetAndShow({ snippetUpdateParams: params }));
  }

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
    { field: 'references',
      headerName: 'Zuordnungen (Sempria)',
      width: 150,
      sortable: false,
      renderCell: (params) => {
        return `${params.row.references.length}`
      }
    },
    // {field: 'reference_name_orig', headerName: 'Wert (Sempria)', width: 450},
    {field: 'reference_key_final', headerName: 'Wert (Übernommen)', width: 150},
    {field: 'reference_name_final', headerName: 'Wert (Übernommen)', width: 350},
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      renderCell: (params) => {
        const editableStatuses = new Set(['open', 'open_no_recommendation']);

        const handleIconClick = async () => {
          const snippetParams =  {
            snippetId: String(params.row.id),
            xmlId: params.row.xml_id,
          }

          const references = params.row.references

          try {
            const actions = {
              moreThanOne: () =>
                showSnippetReferences(
                  { referenceType: references[0].type, ...snippetParams }, references
                ),
              exactlyOne: () =>
                handleSnippetUpdate({
                  referenceName: references[0].name,
                  referenceKey: references[0].key,
                  referenceType: references[0].type,
                  snippetFormContainer: { form: "SHOW_FORM", buttons: "SHOW_BUTTONS" },
                  ...snippetParams
                }),
              none: () =>
                handleSnippetUpdate({
                  referenceName: null,
                  referenceKey: null,
                  referenceType: referenceTypeForXmlId(snippetParams.xmlId),
                  snippetFormContainer: { form: "SHOW_FORM", buttons: "SHOW_BUTTONS" },
                  ...snippetParams
                })
            };

            (references.length > 1 && actions.moreThanOne()) ||
            (references.length === 1 && actions.exactlyOne()) || (
              references.length === 0 && actions.none()
            )
          } catch (err) {
            enqueueSnackbar(err instanceof Error ? err.message : 'An unknown error occurred', { variant: 'error' });
          }
        };

        if (editableStatuses.has(params.row.status)) {
          return (
            <IconButton onClick={handleIconClick} aria-label="info">
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
          getRowId={(row) => row.id}
          slotProps={{
            row: {
              onMouseOver: (event: React.MouseEvent<HTMLDivElement>) => {
                const rowElement = event.currentTarget;
                const rowId = rowElement.dataset.id;

                if (rowId && autoAnnoSnippetData) {
                  const rowData = autoAnnoSnippetData.find((row) => row.id === parseInt(rowId)); // Find full row data
                  if (rowData && rowData.xml_id) {
                    markSpanAndScrollToId(rowData?.xml_id)
                  }
                }
              },
              onMouseOut: (event: React.MouseEvent<HTMLDivElement>) => {
                const rowElement = event.currentTarget;
                const rowId = rowElement.dataset.id;

                if (rowId && autoAnnoSnippetData) {
                  const rowData = autoAnnoSnippetData.find((row) => row.id === parseInt(rowId)); // Find full row data
                  if (rowData && rowData.xml_id) {
                    const existingMarkedSpans = document.querySelectorAll("span.marked");
                    existingMarkedSpans.forEach((span) => span.replaceWith(...span.childNodes));
                  }
                }
              }
            },
          }}
        />
      </Paper>
    </>
  );
};

export default AutoAnnoSnippetList;
