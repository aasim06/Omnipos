import cors from 'cors';
import express, { Express } from 'express';
import { createServer, Server as HttpServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import type { AddressInfo } from 'node:net';
import { registerRoutes } from './routes';

export interface BackendServer {
  url: string;
  close: () => Promise<void>;
}

function getLanIp(): string {
  const nets = networkInterfaces();
  for (const iface of Object.values(nets)) {
    for (const net of iface ?? []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return '127.0.0.1';
}

async function listen(httpServer: HttpServer, port: number, host: string): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(port, host, () => {
      const address = httpServer.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Unable to determine backend port.'));
        return;
      }
      resolve((address as AddressInfo).port);
    });
  });
}

export async function startBackendServer(port = 0, isLan = false): Promise<BackendServer> {
  const app: Express = express();
  const host = isLan ? '0.0.0.0' : '127.0.0.1';
  const httpServer = createServer(app);

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '10mb' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'omnipos-backend' });
  });

  registerRoutes(app);

  const actualPort = await listen(httpServer, port, host);
  const bindHost = host === '0.0.0.0' ? getLanIp() : '127.0.0.1';

  return {
    url: `http://${bindHost}:${actualPort}`,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        httpServer.close((err) => (err ? reject(err) : resolve()));
      });
    },
  };
}
