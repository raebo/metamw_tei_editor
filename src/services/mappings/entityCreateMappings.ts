import { EntityType } from '@src/constants/editor';
import { MarkupCreationData, MarkupPersonData, MarkupPlaceData, MarkupProtagCreationData } from '@src/services/mappings/editorMappings';
import { EntityCreateRequest } from '@src/schemas/entityCreate';

interface PersonEntryInput {
  key: string;
  nameFull: string | null;
  nameLast: string | null;
  nameFirst: string | null;
}

export const mapPersonFormToMarkupPersonData = (person: PersonEntryInput, isNewEntry: boolean): MarkupPersonData => ({
  id: null,
  key: person.key,
  nameDisplay: person.nameFull ?? `${person.nameFirst ?? ''} ${person.nameLast ?? ''}`.trim(),
  nameLast: person.nameLast,
  nameFirst: person.nameFirst,
  isNewEntry,
});

export const mapPersonEntityCreateRequest = (person: MarkupPersonData): EntityCreateRequest => ({
  entity_type: EntityType.PERSON,
  entityData: {
    key: person.key,
    first_name: person.nameFirst,
    last_name: person.nameLast,
  },
});

export const mapPlaceEntityCreateRequest = (place: MarkupPlaceData): EntityCreateRequest => {
  if (place.country.id === null) throw new Error('Country id is required to create a place');

  const country = { id: place.country.id };

  switch (place.placeType) {
    case EntityType.SETTLEMENT:
      return {
        entity_type: EntityType.SETTLEMENT,
        entityData: {
          key: place.key,
          name: place.name,
          kind: place.kind,
          country,
        },
      };
    case EntityType.SIGHT:
    case EntityType.INSTITUTION: {
      const settlementKey = place.settlement?.key;
      if (!settlementKey) throw new Error('Settlement key is required to create this place');

      if (place.placeType === EntityType.SIGHT) {
        return {
          entity_type: EntityType.SIGHT,
          entityData: {
            key: place.key,
            name: place.name,
            settlement: { key: settlementKey },
            country,
          },
        };
      }

      return {
        entity_type: EntityType.INSTITUTION,
        entityData: {
          key: place.key,
          name: place.name,
          kind: place.kind,
          settlement: { key: settlementKey },
          country,
        },
      };
    }
    default:
      throw new Error(`Unsupported place type: ${place.placeType}`);
  }
};

type CreationAuthor = NonNullable<MarkupCreationData['author']>;
type Creation = NonNullable<MarkupCreationData['creation']>;

export const mapCreationAuthorEntityCreateRequest = (author: CreationAuthor): EntityCreateRequest => ({
  entity_type: EntityType.PERSON,
  entityData: {
    key: author.key,
    first_name: author.firstName,
    last_name: author.lastName,
  },
});

export const mapCreationEntityCreateRequest = (creation: Creation, authorKey: string): EntityCreateRequest => ({
  entity_type: EntityType.CREATION,
  entityData: {
    key: creation.key,
    name: creation.name,
    kind: creation.kind,
    author: { key: authorKey },
  },
});

export const mapProtagCreationEntityCreateRequest = (creation: MarkupProtagCreationData): EntityCreateRequest => ({
  entity_type: EntityType.PROTAG_CREATION,
  entityData: {
    key: creation.key,
    name: creation.name,
    mwv: creation.mwv,
    op: creation.opus,
    protag_creation_category: {
      id: creation.protagCreationCategory.id,
    },
  },
});
