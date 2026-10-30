import axios from 'axios';
import { setLetterPinStatus } from '@src/services/editor/apiPinnedLettersRequest.service';

const getMock = jest.fn();
const patchMock = jest.fn();

jest.mock('@src/services/apiRequest.service', () => ({
  __esModule: true,
  default: {
    initApi: () => ({ get: getMock, patch: patchMock }),
  },
}));

describe('pinned letter status requests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([true, false])('sends and validates the explicit pinned=%s target state', async (pinned) => {
    patchMock.mockResolvedValue({
      status: 200,
      data: { pinned, message: 'Pinned state updated' },
    });

    await expect(setLetterPinStatus(17420, pinned)).resolves.toBeUndefined();
    expect(patchMock).toHaveBeenCalledWith('/jwt/editor/pinned_letters/17420/pinned', {
      pinned,
    });
  });

  it('rejects a response that does not confirm the requested target state', async () => {
    patchMock.mockResolvedValue({
      status: 200,
      data: { pinned: true, message: 'Pinned state updated' },
    });

    await expect(setLetterPinStatus(17420, false)).rejects.toThrow('Backend did not confirm pinned=false');
  });

  it('reads the state after a network failure and accepts an already reached target', async () => {
    patchMock.mockRejectedValue(new axios.AxiosError('Network Error'));
    getMock.mockResolvedValue({ data: [] });

    await expect(setLetterPinStatus(17420, false)).resolves.toBeUndefined();
    expect(getMock).toHaveBeenCalledWith('/jwt/editor/pinned_letters');
  });

  it('reconciles a 500 response because cleanup may already have closed the working copy', async () => {
    const error = new axios.AxiosError('Operation failed', undefined, undefined, undefined, {
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      config: { headers: {} } as never,
      data: { error: 'letter_operation_failed' },
    });
    patchMock.mockRejectedValue(error);
    getMock.mockResolvedValue({ data: [] });

    await expect(setLetterPinStatus(17420, false)).resolves.toBeUndefined();
    expect(getMock).toHaveBeenCalledWith('/jwt/editor/pinned_letters');
  });

  it('rejects success responses with undocumented message values', async () => {
    patchMock.mockResolvedValue({
      status: 200,
      data: { pinned: false, message: 'Done' },
    });

    await expect(setLetterPinStatus(17420, false)).rejects.toThrow();
  });

  it('does not reinterpret a documented HTTP error as success', async () => {
    const error = new axios.AxiosError('Conflict', undefined, undefined, undefined, {
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: { headers: {} } as never,
      data: { error: 'letter_version_conflict' },
    });
    patchMock.mockRejectedValue(error);

    await expect(setLetterPinStatus(17420, false)).rejects.toBe(error);
    expect(getMock).not.toHaveBeenCalled();
  });
});
