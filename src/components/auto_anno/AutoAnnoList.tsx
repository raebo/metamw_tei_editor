import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { fetchAutoAnnoJobLetters, fetchAutoAnnoListData } from "../../services/autoAnno.service";
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import { IconButton } from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';
import {
  AutoAnnoJobLetter,
  AutoAnnoType, getStatusDetails,
} from "../../services/mappings/autoAnnoMappings";


const AutoAnnoList: React.FC = () => {

  const [autoAnnoData, setJobRows] = useState<AutoAnnoType[] | undefined>();
  const [autoAnnoLetters, setLetterRows] = useState<AutoAnnoJobLetter[] | undefined>();
  const [error, setError] = useState<string | null>(null);

  const _navigate = useNavigate()

  useEffect(() => {
    const getData = async () => {
      try {
        const result = await fetchAutoAnnoListData();
        setJobRows(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        // setLoading(false);
      }
    };

    getData();
  }, []);


  const jobColumns: GridColDef[] = [
    {field: 'id', headerName: 'ID', width: 90},
    {field: 'service_identifier', headerName: 'Service Identifier', width: 150},
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
    {field: 'search_string', headerName: 'Search String', width: 200},
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      renderCell: (params) => {
        const handleIconClick = async () => {
          try {
            const result = await fetchAutoAnnoJobLetters(params.row.id.toString());
            setLetterRows(result);
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
    {field: 'id', headerName: 'ID', width: 90},
    {field: 'letter_name', headerName: 'Brief', width: 150},
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
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      renderCell: (params) => {
        const handleIconDetailClick = () => {
          _navigate(`/automatic_annotations/${params.row.id}`);
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
            <h2>Bitte einen Eintrag auswählen</h2>
          </div>
          )}
        </>
        )
      }

      export default AutoAnnoList
