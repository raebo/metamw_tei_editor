import { EntityType } from '@src/constants/editor';
import {
  mapCreationAuthorEntityCreateRequest,
  mapCreationEntityCreateRequest,
  mapPersonEntityCreateRequest,
  mapPersonFormToMarkupPersonData,
  mapPlaceEntityCreateRequest,
  mapProtagCreationEntityCreateRequest,
} from '@src/services/mappings/entityCreateMappings';
import { MarkupPersonData, MarkupPlaceData, MarkupProtagCreationData } from '@src/services/mappings/editorMappings';

describe('entity create request mappings', () => {
  it('preserves new person names and marks the entry for creation', () => {
    expect(
      mapPersonFormToMarkupPersonData(
        {
          key: 'PSN1234567',
          nameFull: null,
          nameFirst: 'Ada',
          nameLast: 'Example',
        },
        true,
      ),
    ).toEqual({
      id: null,
      key: 'PSN1234567',
      nameDisplay: 'Ada Example',
      nameFirst: 'Ada',
      nameLast: 'Example',
      isNewEntry: true,
    });
  });

  it('maps a person to snake-case API fields', () => {
    const person: MarkupPersonData = {
      id: null,
      key: 'PSN1234567',
      nameDisplay: 'Ada Example',
      nameFirst: 'Ada',
      nameLast: 'Example',
      isNewEntry: true,
    };

    expect(mapPersonEntityCreateRequest(person)).toEqual({
      entity_type: EntityType.PERSON,
      entityData: {
        key: 'PSN1234567',
        first_name: 'Ada',
        last_name: 'Example',
      },
    });
  });

  it.each([
    [
      EntityType.SETTLEMENT,
      null,
      {
        entity_type: EntityType.SETTLEMENT,
        entityData: {
          key: 'STM1234567',
          name: 'Leipzig',
          kind: 'Stadt',
          country: { id: 1 },
        },
      },
    ],
    [
      EntityType.SIGHT,
      { key: 'STM1234567', type: null, name: 'Leipzig' },
      {
        entity_type: EntityType.SIGHT,
        entityData: {
          key: 'SGH1234567',
          name: 'Gewandhaus',
          settlement: { key: 'STM1234567' },
          country: { id: 1 },
        },
      },
    ],
    [
      EntityType.INSTITUTION,
      { key: 'STM1234567', type: null, name: 'Leipzig' },
      {
        entity_type: EntityType.INSTITUTION,
        entityData: {
          key: 'NST1234567',
          name: 'Gewandhausorchester',
          kind: 'Orchester',
          settlement: { key: 'STM1234567' },
          country: { id: 1 },
        },
      },
    ],
  ] as const)('maps %s place references to the documented shape', (placeType, settlement, expected) => {
    const prefixes = {
      [EntityType.SETTLEMENT]: 'STM',
      [EntityType.SIGHT]: 'SGH',
      [EntityType.INSTITUTION]: 'NST',
    };
    const names = {
      [EntityType.SETTLEMENT]: 'Leipzig',
      [EntityType.SIGHT]: 'Gewandhaus',
      [EntityType.INSTITUTION]: 'Gewandhausorchester',
    };
    const place: MarkupPlaceData = {
      key: `${prefixes[placeType]}1234567`,
      placeType,
      name: names[placeType],
      settlement,
      country: { id: 1, name: 'Deutschland' },
      kind: placeType === EntityType.INSTITUTION ? 'Orchester' : 'Stadt',
      kindOriginal: null,
      isNewEntry: true,
    };

    expect(mapPlaceEntityCreateRequest(place)).toEqual(expected);
  });

  it('maps a new creation author and creation', () => {
    const author = {
      key: 'PSN1234567',
      firstName: 'Ada',
      lastName: 'Example',
      isNewEntry: true,
    };
    const creation = {
      key: 'CRT1234567',
      name: 'Example work',
      kind: 'Bühnenwerk',
      isNewEntry: true,
    };

    expect(mapCreationAuthorEntityCreateRequest(author)).toEqual({
      entity_type: EntityType.PERSON,
      entityData: {
        key: 'PSN1234567',
        first_name: 'Ada',
        last_name: 'Example',
      },
    });
    expect(mapCreationEntityCreateRequest(creation, author.key)).toEqual({
      entity_type: EntityType.CREATION,
      entityData: {
        key: 'CRT1234567',
        name: 'Example work',
        kind: 'Bühnenwerk',
        author: { key: 'PSN1234567' },
      },
    });
  });

  it('maps opus to the documented protag-creation op field', () => {
    const creation: MarkupProtagCreationData = {
      key: 'PRC1234567',
      name: 'Example protagonist work',
      mwv: 'A1',
      opus: '12',
      isNewEntry: true,
      parentProtagCreations: null,
      protagCreationCategory: {
        id: 5,
        name: 'Werk',
        name_en: 'Work',
        protagCreationCategoryId: null,
      },
    };

    expect(mapProtagCreationEntityCreateRequest(creation)).toEqual({
      entity_type: EntityType.PROTAG_CREATION,
      entityData: {
        key: 'PRC1234567',
        name: 'Example protagonist work',
        mwv: 'A1',
        op: '12',
        protag_creation_category: { id: 5 },
      },
    });
  });
});
