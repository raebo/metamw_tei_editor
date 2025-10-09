import React from 'react';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import EditNote from '@mui/icons-material/EditNote';

interface SearchResultEntryProps {
  letter: {
    id: number;
    name: string;
  };
  clickHandler: (letterId: number, letterName: string) => void;
}

const SearchResultEntry = ({ letter, clickHandler }: SearchResultEntryProps) => {
  return (
    <ListItemButton onClick={() => clickHandler(letter.id, letter.name)}>
      <ListItemIcon>
        <EditNote />
      </ListItemIcon>
      <ListItemText primary={letter.name} />
    </ListItemButton>
  );
};

export default SearchResultEntry;
