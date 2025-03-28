import initApi from '../apiRequest.service';
import {
  AutoAnnoJobLetter,
  AutoAnnoSnippet,
  AutoAnnoJob,
  SnippetApiEntity,
  SnippetEntity
} from "../mappings/autoAnnoMappings";
import axios from "axios";


export const fetchAutoAnnoJobs = async (): Promise<AutoAnnoJob[] | undefined> => {
  try {
  const response = await initApi.initApi().get('/jwt/automatic_annotations')

  return response.data;
  } catch (err) {
    console.error(err);
  }
};

export const fetchAutoAnnoJobLetters = async (id: number): Promise<AutoAnnoJobLetter[]| undefined> => {
  try {
    const response = await initApi.initApi().get(`/jwt/automatic_annotations/${id}/letters`);

    return response.data;
  } catch (err) {
    console.error(err);
  }
}

export const fetchAutoAnnoLetter = async (annoLetterId: number): Promise<AutoAnnoJobLetter | undefined> => {
  try {
    const response = await initApi.initApi().get(`/jwt/automatic_annotation_letters/${annoLetterId}`);

    return response.data;
  } catch (err) {
    console.error(err);
  }
}

export const patchAutoAnnoLetterLockingUser = async (annoLetterId: number, userId: number | null): Promise<boolean> => {
  try {
    await initApi.initApi().patch(`/jwt/automatic_annotation_letters/${annoLetterId}/set_locking_user`, { userId: userId });

    return true;
  } catch (err) {
    throw new Error("patchAutoAnnoLetterLockingUser failed with error: " + err);
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
    entityPlaceCountryName: apiEntity.entity_place_country_name,
    entityKind: apiEntity.entity_kind
  }
}

export const fetchAutoAnnoSnippetEntityData = async (annoLetterId: number, snippetId: number, entityKey: string, entityType: string): Promise<SnippetEntity> => {
  const response = await initApi
    .initApi()
    .get(
      `/jwt/automatic_annotation_letters/${annoLetterId}/snippets/${snippetId}/entity_data/${entityType.toLowerCase()}/${entityKey}`
    );

  return mapApiToSnippetEntity(response.data);
}

//TODO: Why cant we move this to autoAnnoMappings.ts?
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
    await initApi.initApi().patch(`/jwt/automatic_annotation_letters/${id}/set_xml_content`, { xmlContent });

  } catch (err) {
    // @ts-ignore
    throw new Error("Error updating anno letter content: " + err.message?.toString());
  }
  return true
}

export const setAnnoSnippetEntity= async (annoLetterId: number, snippetId: number, entityType: string, entityKey: string): Promise<boolean> => {
  try {
    await initApi.initApi().patch(`/jwt/automatic_annotation_letters/${annoLetterId}/snippets/${snippetId}/set_entity`, { entityType, entityKey });

  } catch (err) {
    // @ts-ignore
    throw new Error("Error updating snippet entity: " + err.message?.toString());
  }

  return true;
}

export const writeAnnoLetter = async (id: number): Promise<boolean> => {
  try {
    await initApi.initApi().patch(`/jwt/automatic_annotation_letters/${id}/write_letter_to_file`);

    return true
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(`Error writing anno letter: ${err.response?.data?.status || err.message}`);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
}

export const resetAnnoLetter = async (id: number): Promise<boolean> => {
  try {
    await initApi.initApi().patch(`/jwt/automatic_annotation_letters/${id}/reset_letter`);

    return true

  } catch (err) {
    if (axios.isAxiosError(err)) {
      // Handle Axios-specific error
      throw new Error(`Error resetting anno letter: ${err.response?.data?.status || err.message}`);
    } else {
      // Handle unknown errors
      throw new Error('An unknown error occurred');
    }
  }
}
