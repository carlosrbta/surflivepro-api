import { Logger } from '@nestjs/common';
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { fromNodeHeaders } from 'better-auth/node';
import type { Server, Socket } from 'socket.io';
import { auth } from '../../auth/auth.js';
import type { AuthUser } from '../../auth/auth-user.type.js';

export interface AuthenticatedSocket extends Socket {
  data: Socket['data'] & { user: AuthUser };
}

/**
 * Realtime infrastructure entry point. NestJS is the single realtime
 * server for the platform (no separate WebSocket process).
 *
 * Every connection is authenticated the same way as REST (Better Auth
 * session via cookie or bearer token) — doc §10: "não deve confiar somente
 * no estado inicial da conexão". There are no domain message handlers yet
 * (judging/scoring/priority/heats don't exist), so there's nothing to
 * re-authorize per-message yet; once those are added, resolve their
 * permission via AuthorizationService using `client.data.user`, the same way
 * AuthorizationGuard does for REST.
 */
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  afterInit(): void {
    this.logger.log('Realtime gateway initialized');
  }

  async handleConnection(client: Socket): Promise<void> {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(client.handshake.headers),
    });

    if (!session) {
      this.logger.warn(`Rejected unauthenticated connection: ${client.id}`);
      client.disconnect(true);
      return;
    }

    (client as AuthenticatedSocket).data.user = {
      id: session.user.id,
      email: session.user.email,
      emailVerified: session.user.emailVerified,
      name: session.user.name,
      platformRole:
        (session.user as unknown as { platformRole?: 'PLATFORM_ADMIN' | 'USER' }).platformRole ??
        'USER',
    };

    this.logger.log(`Client connected: ${client.id} (user ${session.user.id})`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
