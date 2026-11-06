import AddIcon from '@mui/icons-material/Add';
import { Box, Button, List, ListItemButton, ListItemText, Paper, Typography } from '@mui/material';
import { LetterEntitySuggestion } from '@src/utils/editor/letterEntitySuggestions';
import { useTranslation } from 'react-i18next';

interface LetterEntitySuggestionListProps {
  suggestions: LetterEntitySuggestion[];
  excludedKeys: Set<string>;
  onSelect: (suggestion: LetterEntitySuggestion) => void;
  onOpenSearch: () => void;
}

const LetterEntitySuggestionList = ({ suggestions, excludedKeys, onSelect, onOpenSearch }: LetterEntitySuggestionListProps) => {
  const { t } = useTranslation();
  const availableSuggestions = suggestions.filter((suggestion) => !excludedKeys.has(suggestion.entityKey));

  if (availableSuggestions.length === 0) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 2,
          height: 280,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {t('editor:dialog.entitySelection.empty')}
        </Typography>
        <Button size="small" onClick={onOpenSearch}>
          {t('editor:dialog.entitySelection.openSearch')}
        </Button>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ mb: 2 }}>
      <List disablePadding sx={{ height: 280, overflowY: 'auto' }}>
        {availableSuggestions.map((suggestion) => (
          <ListItemButton
            key={suggestion.entityKey}
            divider
            onClick={() => onSelect(suggestion)}
            aria-label={t('editor:dialog.entitySelection.select', {
              name: suggestion.entityName,
            })}
          >
            <ListItemText
              primary={suggestion.entityName}
              secondary={suggestion.contexts.map((context) => t(`editor:dialog.entitySelection.context.${context}`)).join(' · ')}
              primaryTypographyProps={{ fontWeight: 500 }}
            />
            <Box component="span" sx={{ display: 'inline-flex', color: 'primary.main', ml: 1 }}>
              <AddIcon fontSize="small" aria-hidden="true" />
            </Box>
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
};

export default LetterEntitySuggestionList;
