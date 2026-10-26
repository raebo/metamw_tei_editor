import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormAutocomplete from '@src/components/editor/letter/Util/FormAutocomplete';
import { EntityType } from '@src/constants/editor';
import { searchEditortEntities } from '@src/services/editor/apiLetterRequest.service';
import type { SnippetEntity } from '@src/services/mappings/autoAnnoMappings';

jest.mock('@src/services/editor/apiLetterRequest.service', () => ({
  searchEditortEntities: jest.fn(),
}));

const mockSearchEditorEntities = searchEditortEntities as jest.MockedFunction<typeof searchEditortEntities>;

describe('FormAutocomplete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the ranked server result without applying another contiguous text filter', async () => {
    const person: SnippetEntity = {
      entityId: 18613,
      entityType: EntityType.PERSON,
      entityKey: 'PSN0000001',
      entityName: 'Mendelssohn Bartholdy (bis 1816: Mendelssohn), Jacob Ludwig Felix (1809-1847)',
      entityDisplayName: 'Mendelssohn Bartholdy (bis 1816: Mendelssohn), Jacob Ludwig Felix (1809-1847)',
      extraData: {},
    };
    mockSearchEditorEntities.mockResolvedValue([person]);

    render(
      <FormAutocomplete
        entityType={EntityType.PERSON}
        entityKey={null}
        isDisabled={false}
        selectedValue={null}
        initialOptions={[]}
        label="Person suchen"
      />,
    );

    await userEvent.type(screen.getByRole('combobox', { name: 'Person suchen' }), 'bartholdy felix');

    await waitFor(() => expect(mockSearchEditorEntities).toHaveBeenCalledWith('bartholdy felix', EntityType.PERSON));
    expect(await screen.findByRole('option', { name: person.entityName })).toBeVisible();
    expect(screen.getByText('Bartholdy')).toHaveStyle({ backgroundColor: 'yellow' });
    expect(screen.getByText('Felix')).toHaveStyle({ backgroundColor: 'yellow' });
  });
});
