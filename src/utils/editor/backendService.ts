import { initApi } from '../../services/apiRequest.service'
import { replaceDataKeys, replaceWithCamelCase } from '../auto_anno/domHandling';
import { EntityType } from '../../constants/editor';
import { MiscUtils } from '../misc';

export const backendService = {
  fetchCountryEntries: async (): Promise<{name: string, id: number}[]> => {
    try {
      const response = await initApi().get('/jwt/misc/countries');

      if (!response) {
        throw new Error("No response from server for country entries");
      }

      return response.data
    } catch (error: any) {
      const response = error.response;

      if (response !== undefined) {
        throw new Error(`Error response is undefined  ${response.data.error}`);
      } else {
        throw new Error(`backendService.fetchCountryEntries: ${error.message}`);
      }
    }
  },
  fetchKindEntries: async (): Promise<string[]> => {
    try {
      const response = await initApi().get('/jwt/misc/place_kinds');

      if (!response) {
        throw new Error("No response from server for place kind entries");
      }

      return response.data
    } catch (error: any) {
      const response = error.response;

      if (response !== undefined) {
        throw new Error(`Error response is undefined  ${response.data.error}`);
      } else {
        throw new Error(`backendService.fetchKindEntries: ${error.message}`);
      }
    }
  },
  createEntity: async (entityData: any, entityType: string): Promise<{newId: number }> => {
    try {
      if (!Object.values(EntityType).includes(entityType as EntityType)) {
        throw new Error(`Invalid entity type: ${entityType}`);
      }
      const response = await initApi().post(`/jwt/editor/entities?entity_type=${entityType}`, {
        entityData: {
          ...entityData
        }
      });

      return response.data;
    } catch (error: any) {
      const response = error.response;

      if (response !== undefined) {
        throw new Error(response.data.error);
      } else {
        throw new Error(`backendService.createEntity: ${error.message}`);
      }
    }
  },
  patchContent: async (content: string, letterId: number | null, changeType: string, xmlId: string | null): Promise<boolean> => {
    if (!letterId) {
      throw new Error("No letter id provided");
    }

    try {
      await initApi()
        .patch(`/jwt/editor/pinned_letters/${letterId}/set_content/`, {
          changes: {
            new_content: MiscUtils.misc.pipeFunctions(content, replaceWithCamelCase, replaceDataKeys),
            xml_id: xmlId,
            change_type: changeType
          }
        } );
    } catch (err: any) {
      const response = err.response;

      if (response !== undefined) {
        throw new Error(response.data.error);
      } else {
        throw new Error(err);
      }
    }
    return true
  },
  resetLetter: async (letterId: number): Promise<boolean> => {
    try {
      await initApi().delete(`/jwt/editor/pinned_letters/${letterId}/reset_letter/`);

      return true;

    } catch (err: any) {
      const response = err.response;

      if (response !== undefined) {
        throw new Error("Error resetting letter content: " + response.data.error);
      } else {
        throw new Error("Error resetting letter content: " + err);
      }
    }
  },
  publishLetter: async (letterId: number): Promise<boolean> => {
    try {
      await initApi().post(`/jwt/editor/pinned_letters/${letterId}/publish/`);

      return true;
    } catch (err: any) {

      const response = err.response;

      if (response !== undefined) {
        throw new Error(response.data.error);
      } else {
        throw new Error("Error publishing letter content: " + err);
      }
    }
  }
}
