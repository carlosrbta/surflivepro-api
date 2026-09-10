import { auth } from '../../auth/auth.js';
import { RealtimeGateway } from './realtime.gateway.js';

jest.mock('../../auth/auth', () => ({
  auth: { api: { getSession: jest.fn() } },
}));
// better-auth/node ships ESM-only, which ts-jest doesn't transform inside
// node_modules — stub it since these tests never need its real conversion.
jest.mock('better-auth/node', () => ({
  fromNodeHeaders: (headers: unknown) => headers,
}));

const getSession = auth.api.getSession as unknown as jest.Mock;

interface FakeSocket {
  id: string;
  handshake: { headers: Record<string, string> };
  disconnect: jest.Mock;
  data: { user?: unknown };
}

function makeFakeSocket(): FakeSocket {
  return { id: 'socket-1', handshake: { headers: {} }, disconnect: jest.fn(), data: {} };
}

describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway;

  beforeEach(() => {
    gateway = new RealtimeGateway();
    getSession.mockReset();
  });

  it('disconnects a socket with no valid session', async () => {
    getSession.mockResolvedValue(null);
    const client = makeFakeSocket();

    await gateway.handleConnection(
      client as unknown as Parameters<typeof gateway.handleConnection>[0],
    );

    expect(client.disconnect).toHaveBeenCalledWith(true);
    expect(client.data.user).toBeUndefined();
  });

  it('attaches the authenticated user and keeps the connection open', async () => {
    getSession.mockResolvedValue({
      session: {},
      user: {
        id: 'user-1',
        email: 'a@b.com',
        emailVerified: true,
        name: 'A',
        platformRole: 'USER',
      },
    });
    const client = makeFakeSocket();

    await gateway.handleConnection(
      client as unknown as Parameters<typeof gateway.handleConnection>[0],
    );

    expect(client.disconnect).not.toHaveBeenCalled();
    expect(client.data.user).toEqual(
      expect.objectContaining({ id: 'user-1', platformRole: 'USER' }),
    );
  });
});
