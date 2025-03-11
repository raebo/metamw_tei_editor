import { initApi } from '../../services/apiRequest.service'

export const backendService = {
  patchContent: async (content: string, letterId: number | null, changeType: string, xmlId: string): Promise<boolean> => {
    if (!letterId) {
      throw new Error("No letter id provided");
    }

    try {
      await initApi().patch(`/jwt/editor/pinned_letters/${letterId}/set_content/`, { changes: { new_content: content, xml_id: xmlId, change_type: changeType  } } );
    } catch (err: any) {
      const response = err.response;

      if (response !== undefined) {
        throw new Error("Error updating letter content: " + response.data.error);
      } else {
        throw new Error("Error updating letter content: " + err);
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
  }
}
