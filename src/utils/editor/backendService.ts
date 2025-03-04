import { initApi } from '../../services/apiRequest.service'

export const backendService = {
  patchContent: async (content: string, letterId: number): Promise<boolean> => {
    try {
      await initApi().patch(`/jwt/editor/pinned_letters/${letterId}/set_content/`, { changes: { new_content: content  } } );
    } catch (err) {
      throw new Error("Error updating letter content: " + err);
    }
    return true
  }
}
