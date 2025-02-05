import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { fetchAutoAnnoJobLetters, fetchAutoAnnoLetter, fetchAutoAnnoJobs } from "../../services/auto_anno/apiAutoAnno.service";
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import { Box, IconButton, Typography } from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';
import {
  AutoAnnoJobLetter,
  AutoAnnoJob, getStatusDetails,
} from "../../services/mappings/autoAnnoMappings";
import { enqueueSnackbar } from "notistack";
import { ComponentMappingItem } from "../../services/mappings/editorMappings";
import { format, parse } from "date-fns";
import { dateFnsFormat, dateFnsParseFormat } from "../../constants/snack";


const AutoAnnoList: React.FC = () => {

  const { id } = useParams<{ id: string }>();
  const [autoAnnoJobId, setAutoAnnoJobId] = useState<number | undefined>();

  const [autoAnnoData, setJobRows] = useState<AutoAnnoJob[] | undefined>();
  const [autoAnnoLetters, setLetterRows] = useState<AutoAnnoJobLetter[] | undefined>();
  const [error, setError] = useState<string | null>(null);

  const _navigate = useNavigate()

  useEffect(() => {
    const getData = async () => {
      try {
        const result = await fetchAutoAnnoJobs();
        setJobRows(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        // setLoading(false);
      }
    };
    getData();
  }, []);

  useEffect(() => {
    if (id) {
      const parsedId = parseInt(id, 10);
      if (!isNaN(parsedId)) {
        fetchAutoAnnoJobLetters(parsedId).then((result) => {
          setLetterRows(result);
          setAutoAnnoJobId(parsedId);
        }).catch((err) => {
          enqueueSnackbar(err instanceof Error ? err.message : 'An unknown error occurred', { variant: 'error' });
        })
      } else {
        console.error(`Invalid id: ${id}`);
      }
    }
  }, [id]);


  const jobColumns: GridColDef[] = [
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
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
    {field: 'id', headerName: 'ID', width: 90},
    {
      field: 'job_updated_at', headerName: 'Service Identifier', width: 180,
      renderCell: (params) => {
        return format(
          parse(params.row.updated_at, dateFnsParseFormat, new Date()),
          dateFnsFormat)
      }
    },
    {field: 'search_string', headerName: 'Suchbegriff', width: 200},
    {
      field: 'letters_open',
      headerName: 'Briefe',
      width: 100,
      sortable: false,
      renderCell: (params) => {
        return `${params.row.letters_closed}/${params.row.letters_count}`;
      }
    },
    {
      field: 'snippets_open',
      headerName: 'Auszeichnungen',
      width: 150,
      sortable: false,
      renderCell: (params) => {
        return `${params.row.snippets_closed}/${params.row.snippets_count}`;
      }
    },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      renderCell: (params) => {
        const handleIconClick = async () => {
          try {
            const result = await fetchAutoAnnoJobLetters(params.row.id);
            setLetterRows(result);
            setAutoAnnoJobId(params.row.id);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
          }
        };

        return (
          <IconButton onClick={handleIconClick} aria-label="info">
            <InfoIcon color="primary"/>
          </IconButton>
        );
      },
    }
  ];

  const letterColumns: GridColDef[] = [
    {field: 'status',
      headerName: 'Status',
      width: 150,
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
    {field: 'letter_name', headerName: 'Brief', width: 150},
    {
      field: 'snippets_count',
      headerName: 'Auszeichnungen',
      width: 150,
      sortable: false,
      renderCell: (params) => {
        return `${params.row.snippets_closed}/${params.row.snippets_count}`;
      }
    },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      renderCell: (params) => {
        const handleIconDetailClick = () => {
          _navigate(`/automatic_annotations/${autoAnnoJobId}/letters/${params.row.id}`);
        }
        return (
          <IconButton onClick={handleIconDetailClick} aria-label="info">
            <InfoIcon color="primary"/>
          </IconButton>
        );
      }
    }
  ];

  const paginationModel = {page: 0, pageSize: 5};

  return (
    <>
      <Paper sx={{height: 400, width: '100%'}}>
        <DataGrid
          rows={autoAnnoData}
          columns={jobColumns}
          initialState={{pagination: {paginationModel}}}
          pageSizeOptions={[5, 10]}
          sx={{border: 0}}
        />
      </Paper>
      {autoAnnoLetters !== undefined && autoAnnoLetters.length > 0 ? (
        <div style={{marginTop: '40px', width: '100%'}}>
          <Paper sx={{height: 400, width: '100%'}}>
            <DataGrid
              rows={autoAnnoLetters}
              columns={letterColumns}
              initialState={{pagination: {paginationModel}}}
              pageSizeOptions={[5, 10]}
              sx={{border: 0}}
            />
          </Paper>
        </div>
        ) : (
        <div style={{marginTop: '40px', width: '100%'}}>
          <Box>
            <Typography variant="h4">Bitte wählen Sie einen Eintrag in der oberen Tabelle aus.</Typography>
          </Box>
        </div>
        )}
    </>

  )
}

export default AutoAnnoList
