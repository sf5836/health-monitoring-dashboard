import { io, type Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;
let currentToken = '';

function getSocketUrl(): string {
  const explicitSocketUrl = import.meta.env.VITE_SOCKET_URL as string | undefined;
  if (explicitSocketUrl && explicitSocketUrl.trim().length > 0) {
    return explicitSocketUrl;
  }

  return 'http://localhost:5000';
}

export function connectPatientRealtime(accessToken: string): Socket {
  if (!socketInstance) {
    currentToken = accessToken;
    socketInstance = io(getSocketUrl(), {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      reconnection: true
    });
    return socketInstance;
  }

  if (accessToken && accessToken !== currentToken) {
    currentToken = accessToken;
    socketInstance.auth = { token: accessToken };
    if (socketInstance.connected) {
      socketInstance.disconnect();
    }
    socketInstance.connect();
  }

  return socketInstance;
}

export function getPatientRealtimeSocket(): Socket | null {
  return socketInstance;
}

export function disconnectPatientRealtime(): void {
  if (!socketInstance) return;
  socketInstance.removeAllListeners();
  socketInstance.disconnect();
  socketInstance = null;
  currentToken = '';
}
