import React from 'react';
import { Typography, Paper, Box, Alert } from '@mui/material';

type DataValue = string | number | boolean | null | DataValue[] | { [key: string]: DataValue };

interface DynamicDataDisplayProps {
  data: { [key: string]: DataValue } | null;
  displayNameMap: { [key: string]: string };
}

const RenderValue = ({ value }: { value: any }) => {
  // Null / undefined
  if (value === null || value === undefined) return <>N/A</>;

  // Primitive types
  if (['string', 'number', 'boolean'].includes(typeof value)) {
    return <>{value.toString()}</>;
  }

  // Array
  if (Array.isArray(value)) {
    return (
      <Box paddingLeft={1} borderLeft="2px solid #ddd">
        {value.length === 0 ? (
          <Typography variant="body2">[]</Typography>
        ) : (
          value.map((item, index) => (
            <Box key={index} marginBottom={1}>
              <Typography variant="caption" color="textSecondary">
                [{index}]
              </Typography>
              <RenderValue value={item} />
            </Box>
          ))
        )}
      </Box>
    );
  }

  // Object
  if (typeof value === 'object') {
    return <Alert severity="info">Complex object not displayed</Alert>;
  }

  return <>N/A</>;
};

const DynamicDataDisplay: React.FC<DynamicDataDisplayProps> = ({ data, displayNameMap }) => {
  if (!data) {
    return (
      <Paper elevation={3} style={{ padding: '16px', margin: '16px' }}>
        <Typography variant="body1">No data available.</Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={3}
      style={{ padding: '16px', margin: '16px' }}
      sx={{
        maxHeight: '80vh',
        overflowY: 'auto',
      }}
    >
      <Box
        display="grid"
        gridTemplateColumns="repeat(3, 1fr)" // three equal columns
        gap={2}
      >
        {Object.entries(data).map(([key, value]) => (
          <Box
            key={key}
            display="flex"
            flexDirection="column"
            sx={{
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              minWidth: 0, // IMPORTANT for CSS grid shrink behavior
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              {displayNameMap[key] || key}:
            </Typography>
            <Typography variant="body1">
              <RenderValue value={value} />
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default DynamicDataDisplay;
