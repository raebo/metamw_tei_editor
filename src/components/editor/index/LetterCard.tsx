import React from 'react';
import { Box, Card, CardActions, CardContent, IconButton, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import { EditorLetter } from '../../../services/mappings/editorMappings';
import { Link } from 'react-router-dom';
import EditNote from '@mui/icons-material/EditNote';

const bull = (
  <Box component="span" sx={{ display: 'inline-block', mx: '2px', transform: 'scale(0.8)' }}>
    •
  </Box>
);

interface LetterCardProps {
  letter: EditorLetter;
}

const LetterCard = (props: LetterCardProps) => {
  return (
    <Card sx={{ height: '17vh', minWidth: 200 }}>
      <CardContent>
        <Typography variant="h6" component="div">
          {props.letter.name}
        </Typography>
        <Typography sx={{ color: 'text.secondary', mb: 1.5, fontSize: '80%' }}>{props.letter.title}</Typography>
        <Typography variant="body2" sx={{ fontSize: '80%' }}>
          Last Letter Update by User...
          {/*<br />*/}
          {'"a user"'}
        </Typography>
      </CardContent>
      <CardActions sx={{ pl: '70%' }}>
        <Button component={Link} to={`/editor/letters/${props.letter.id}/${props.letter.name}`} size="small" startIcon={<EditNote />} />
      </CardActions>
    </Card>
  );
};

export default LetterCard;
