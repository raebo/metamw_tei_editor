import { backendService } from '@src/utils/editor/backendService';

const mockPatch = jest.fn();

jest.mock('@src/services/apiRequest.service', () => ({
  initApi: () => ({ patch: mockPatch }),
}));

describe('backendService.patchContent', () => {
  beforeEach(() => {
    mockPatch.mockReset();
  });

  it('normalizes and validates editor XML before sending it', async () => {
    mockPatch.mockResolvedValue({});

    await expect(
      backendService.patchContent(
        '<TEI xmlns:tmp="urn:tmp"><persname data-key="p1" tmp:id="temporary">Anna</persname></TEI>',
        7,
        'manual_change',
        null,
      ),
    ).resolves.toBe(true);

    expect(mockPatch).toHaveBeenCalledWith('/jwt/editor/pinned_letters/7/set_content/', {
      changes: {
        new_content: '<TEI xmlns:tmp="urn:tmp"><persName key="p1">Anna</persName></TEI>',
        xml_id: null,
        change_type: 'manual_change',
      },
    });
  });

  it('does not send malformed editor XML', async () => {
    await expect(
      backendService.patchContent('<TEI><text></TEI>', 7, 'manual_change', null),
    ).rejects.toThrow('XML content is not well-formed.');
    expect(mockPatch).not.toHaveBeenCalled();
  });
});
