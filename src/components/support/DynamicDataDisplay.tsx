import React from "react";
import { Typography, Paper, Box } from "@mui/material";

interface DynamicDataDisplayProps {
  data: { [key: string]: string } | null;
  displayNameMap: { [key: string]: string };
}

const DynamicDataDisplay: React.FC<DynamicDataDisplayProps> = ({
                                                                 data,
                                                                 displayNameMap,
                                                               }) => {

  if (!data) {
    return (
      <Paper elevation={3} style={{ padding: "16px", margin: "16px" }}>
        <Typography variant="body1">
          No data available.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} style={{ padding: "16px", margin: "16px" }}>
      <Box
        display="grid"
        gridTemplateColumns="repeat(4, 1fr)" // Four equal columns
        gap={2}
      >
        {Object.entries(data).map(([key, value]) => (
          <Box key={key} display="flex" flexDirection="column">
            {/* Label */}
            <Typography variant="subtitle1" fontWeight="bold">
              {displayNameMap[key] || key}:
            </Typography>
            {/* Value */}
            <Typography variant="body1">
              {value !== null && value !== undefined ? value : "N/A"}
            </Typography>
          </Box>
        ))}
      </Box>

    </Paper>
  );
};

export default DynamicDataDisplay;
