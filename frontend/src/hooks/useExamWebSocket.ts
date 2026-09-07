import { useState, useEffect, useRef, useCallback } from 'react';

export type WSConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseExamWebSocketOptions {
  path: string; // e.g. `/api/v1/ws/exam/${examId}/proctor`
  enabled?: boolean;
  onMessage?: (data: any) => void;
  reconnectInterval?: number;
}

export const useExamWebSocket = ({
  path,
  enabled = true,
  onMessage,
  reconnectInterval = 3000
}: UseExamWebSocketOptions) => {
  const [connectionStatus, setConnectionStatus] = useState<WSConnectionStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<any>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const pingIntervalRef = useRef<any>(null);
  const isUnmountedRef = useRef(false);

  const token = localStorage.getItem('access_token') || localStorage.getItem('token');

  const connect = useCallback(() => {
    if (!enabled || !path || !token) return;

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsBaseUrl = `${protocol}//${host}`;
    const fullUrl = `${wsBaseUrl}${path}?token=${encodeURIComponent(token)}`;

    setConnectionStatus('connecting');

    try {
      const socket = new WebSocket(fullUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (isUnmountedRef.current) return;
        setConnectionStatus('connected');
        console.log(`[WebSocket] Connected to ${path}`);

        // Setup periodic ping
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'PING' }));
          }
        }, 25000);
      };

      socket.onmessage = (event) => {
        if (isUnmountedRef.current) return;
        try {
          const parsed = JSON.parse(event.data);
          setLastMessage(parsed);
          if (onMessage) {
            onMessage(parsed);
          }
        } catch (e) {
          console.debug('[WebSocket] Received non-json message:', event.data);
        }
      };

      socket.onerror = (err) => {
        if (isUnmountedRef.current) return;
        console.warn(`[WebSocket] Error on ${path}`, err);
        setConnectionStatus('error');
      };

      socket.onclose = (event) => {
        if (isUnmountedRef.current) return;
        setConnectionStatus('disconnected');
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

        // Don't reconnect if closed cleanly with 1008 (policy violation/unauthorized)
        if (event.code !== 1008 && enabled) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`[WebSocket] Attempting reconnection to ${path}...`);
            connect();
          }, reconnectInterval);
        }
      };
    } catch (err) {
      console.error('[WebSocket] Connection creation failed:', err);
      setConnectionStatus('error');
    }
  }, [path, enabled, token, reconnectInterval, onMessage]);

  useEffect(() => {
    isUnmountedRef.current = false;
    connect();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((msg: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
      return true;
    }
    return false;
  }, []);

  return {
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    lastMessage,
    sendMessage,
    reconnect: connect
  };
};
