import { fireEvent, render, screen } from '@testing-library/react';
import LetterEntitySuggestionList from '@src/components/editor/letter/Right/EntitySuggestions/LetterEntitySuggestionList';
import { EntityType } from '@src/constants/editor';
import { LetterEntitySuggestion } from '@src/utils/editor/letterEntitySuggestions';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { name?: string }) => options?.name ?? key,
  }),
}));

const suggestions: LetterEntitySuggestion[] = [
  {
    entityKey: 'PSN0000001',
    entityName: 'Felix Mendelssohn Bartholdy',
    entityType: EntityType.PERSON,
    contexts: ['receiver', 'mentioned'],
  },
  {
    entityKey: 'PSN0000002',
    entityName: 'Clara Beispiel',
    entityType: EntityType.PERSON,
    contexts: ['writer'],
  },
];

describe('LetterEntitySuggestionList', () => {
  it('selects an available letter entity and hides excluded keys', () => {
    const onSelect = jest.fn();

    render(
      <LetterEntitySuggestionList
        suggestions={suggestions}
        excludedKeys={new Set(['PSN0000002'])}
        onSelect={onSelect}
        onOpenSearch={jest.fn()}
      />,
    );

    expect(screen.queryByText('Clara Beispiel')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Felix Mendelssohn Bartholdy' }));
    expect(onSelect).toHaveBeenCalledWith(suggestions[0]);
  });

  it('offers the search when no suggestions are available', () => {
    const onOpenSearch = jest.fn();

    render(
      <LetterEntitySuggestionList
        suggestions={suggestions}
        excludedKeys={new Set(suggestions.map((suggestion) => suggestion.entityKey))}
        onSelect={jest.fn()}
        onOpenSearch={onOpenSearch}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'editor:dialog.entitySelection.openSearch' }));
    expect(onOpenSearch).toHaveBeenCalledTimes(1);
  });
});
