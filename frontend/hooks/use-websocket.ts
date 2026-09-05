"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createWebSocketUrl, isWebSocketSupported } from "@/lib/websocket";

export type WebSocketMessage = {
  type?: string;
  event?: string;
  message?: string;
  data?: unknown;
  [key: string]: unknown;
};

type UseWebSocketOptions = {
  enabled?: boolean;
  reconnect?: boolean;
  reconnectDelay?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: () => void;
};

type UseWebSocketReturn = {
  connected: boolean;
  connecting: boolean;
  sendMessage: (message: unknown) => void;
  disconnect: () => void;
  reconnect: () => void;
};

export function useWebSocket(
  path: string,
  options: UseWebSocketOptions = {},
): UseWebSocketReturn {
  const {
    enabled = true,
    reconnect: shouldReconnect = true,
    reconnectDelay = 3000,
    onMessage,
    onOpen,
    onClose,
    onError,
  } = options;

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manuallyDisconnectedRef = useRef(false);

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(() => {
    if (!enabled || !isWebSocketSupported()) {
      return;
    }

    const existingSocket = socketRef.current;

    if (
      existingSocket &&
      (existingSocket.readyState === WebSocket.OPEN ||
        existingSocket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const socketUrl = createWebSocketUrl(path);

    if (!socketUrl) {
      setConnected(false);
      setConnecting(false);
      return;
    }

    manuallyDisconnectedRef.current = false;
    setConnecting(true);

    const socket = new WebSocket(socketUrl);

    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      setConnecting(false);
      onOpen?.();
    };

    socket.onmessage = (event) => {
      try {
        const parsedMessage = JSON.parse(event.data) as WebSocketMessage;
        onMessage?.(parsedMessage);
      } catch {
        onMessage?.({
          type: "message",
          message: event.data,
        });
      }
    };

    socket.onerror = () => {
      setConnected(false);
      setConnecting(false);
      onError?.();
    };

    socket.onclose = () => {
      setConnected(false);
      setConnecting(false);
      socketRef.current = null;

      onClose?.();

      if (
        shouldReconnect &&
        !manuallyDisconnectedRef.current &&
        enabled
      ) {
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, reconnectDelay);
      }
    };
  }, [
    enabled,
    path,
    reconnectDelay,
    shouldReconnect,
    onMessage,
    onOpen,
    onClose,
    onError,
  ]);

  const disconnect = useCallback(() => {
    manuallyDisconnectedRef.current = true;

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    const socket = socketRef.current;

    if (socket) {
      socket.close();
      socketRef.current = null;
    }

    setConnected(false);
    setConnecting(false);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();

    manuallyDisconnectedRef.current = false;

    setTimeout(() => {
      connect();
    }, 100);
  }, [connect, disconnect]);

  const sendMessage = useCallback((message: unknown) => {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket is not connected.");
      return;
    }

    const payload =
      typeof message === "string" ? message : JSON.stringify(message);

    socket.send(payload);
  }, []);

  useEffect(() => {
    if (!enabled) {
      disconnect();
      return;
    }

    connect();

    return () => {
      manuallyDisconnectedRef.current = true;

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [connect, disconnect, enabled]);

  return {
    connected,
    connecting,
    sendMessage,
    disconnect,
    reconnect,
  };
}