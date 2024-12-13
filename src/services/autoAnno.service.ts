import initApi from './apiRequest.service';
import {
  AutoAnnoJobLetter,
  AutoAnnoSnippet,
  AutoAnnoType,
  SnippetApiEntity,
  SnippetEntity
} from "./mappings/autoAnnoMappings";


export const fetchAutoAnnoListData = async (): Promise<AutoAnnoType[] | undefined> => {
  try {
  const response = await initApi.initApi().get('/jwt/automatic_annotations')

  return response.data;
  } catch (err) {
    console.error(err);
  }
};

export const fetchAutoAnnoJobLetters = async (id: string): Promise<AutoAnnoJobLetter[]| undefined> => {
  try {
    const response = await initApi.initApi().get(`/jwt/automatic_annotations/${id}/letters`);

    return response.data;
  } catch (err) {
    console.error(err);
  }
}

export const fetchAutoAnnoLetter = async (id: string | undefined): Promise<AutoAnnoJobLetter | undefined> => {
  try {
    const response = await initApi.initApi().get(`/jwt/automatic_annotation_letters/${id}`);

    return response.data;
  } catch (err) {
    console.error(err);
  }
}


export const fetchAutoAnnoLetterSnippets = async (id: number | undefined): Promise<AutoAnnoSnippet[]| undefined> => {
  try {
    const response = await initApi.initApi().get(`/jwt/automatic_annotation_letters/${id}/snippets`);

    return response.data;
  } catch (err) {
    console.error(err);
  }
}

export const searchAutoAnnoSnippetEntities = async (annoLetterId: number, searchString: string, entityType: string): Promise<SnippetEntity[]| undefined> => {
  try {
    const entityMapping: Record<string, string> = {
      Person: 'person',
      Institution: 'institution',
      Sight: 'sight',
      Settlement: 'settlement',
    };

    const entityKey = entityMapping[entityType];
    if (!entityKey) {
      throw new Error(`Unsupported entity type: ${entityType}`);
    }

    const response = await initApi
      .initApi()
      .get(
        `/jwt/automatic_annotation_letters/${annoLetterId}/snippets/search_entity/${searchString}/${entityType.toLowerCase()}?per_page=20`
      );

    return response?.data?.[entityKey]?.entries || undefined;

  } catch (err) {

    throw new Error("Error updating anno letter content: " + err);
  }
}


const mapApiToSnippetEntity = (apiEntity: SnippetApiEntity): SnippetEntity => {
  return {
    entityId: apiEntity.entity_id,
    entityType: apiEntity.entity_type,
    entityKey: apiEntity.entity_key,
    entityName: apiEntity.entity_name,
    entityDisplayName: apiEntity.entity_display_name,
    entitySettlementKind: apiEntity.entity_settlement_kind,
    entityParentName: apiEntity.entity_parent_name,
    entityPlaceCountryName: apiEntity.entity_place_country_name
  }
}

export const fetchAutoAnnoSnippetEntityData = async (annoLetterId: number, snippetId: number, entityKey: string, entityType: string): Promise<SnippetEntity> => {
  const response = await initApi
    .initApi()
    .get(
      `/jwt/automatic_annotation_letters/${annoLetterId}/snippets/${snippetId}/entity_data/${entityType.toLowerCase()}/${entityKey}`
    );

  // return response.data.map((apiEntity: SnippetApiEntity) => mapApiToSnippetEntity(apiEntity));
  return mapApiToSnippetEntity(response.data);
}

type SnippetStatus = "REJECTED" | "ACCEPTED" | "UPDATED";

export const setAutoAnnoSnippetStatus = async (annoLetterId: number, snippetId: number, status: SnippetStatus): Promise<boolean> => {
  try {
    await initApi.initApi().patch(`/jwt/automatic_annotation_letters/${annoLetterId}/snippets/${snippetId}/set_status`, { status });

    return true;
  } catch (err) {
    throw new Error("Error updating snippet status: " + err);
  }
}

export const updateAnnoLetterContent = async (id: number, xmlContent: String): Promise<boolean> => {
  try {
    await initApi.initApi().patch(`/jwt/automatic_annotation_letters/${id}/patch_xml_content`, { xmlContent });

  } catch (err) {
    // @ts-ignore
    throw new Error("Error updating anno letter content: " + err.message?.toString());
  }
  return true
}