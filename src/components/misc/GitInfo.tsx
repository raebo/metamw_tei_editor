import React, { useEffect, useState } from 'react';
import { Typography, Box } from '@mui/material';

interface GitInfo {
  commitHash: string;
  commitDate: string;
}

const GitInfo: React.FC = () => {
  const [gitInfo, setGitInfo] = useState<GitInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGitInfo = async () => {
      try {
        const response = await fetch('/git-info.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch Git info: ${response.statusText}`);
        }
        const data: GitInfo = await response.json();
        setGitInfo(data);
      } catch (err) {
        console.error('Failed to load Git info:', err);
        setError('Failed to load Git information.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGitInfo();
  }, []);

  if (isLoading) {
    return null;
  }

  if (error) {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          backgroundColor: 'background.paper',
          padding: 1,
          borderRadius: 1,
          boxShadow: 1,
        }}
      >
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!gitInfo) {
    return null; // Don't render anything if Git info is not available
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        backgroundColor: 'background.paper',
        padding: 1,
        borderRadius: 1,
        boxShadow: 1,
      }}
    >
      <Typography variant="body2" color="textSecondary" sx={{fontSize: '0.4rem'}}>
        Last commit: {gitInfo.commitHash} on {new Date(gitInfo.commitDate).toLocaleString()}
      </Typography>
    </Box>
  );
};

export default GitInfo;
