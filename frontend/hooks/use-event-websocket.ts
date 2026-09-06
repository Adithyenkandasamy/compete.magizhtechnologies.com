"use client";

import { useCallback, useMemo } from "react";
import {
  useWebSocket,
  type WebSocketMessage,
} from "@/hooks/use-websocket";

type UseEventWebSocketOptions = {
  enabled?: boolean;
  reconnect?: boolean;
  reconnectDelay?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: () => void;
};

type UseEventWebSocketReturn = {
  connected: boolean;
  connecting: boolean;
  sendMessage: (message: unknown) => void;
  disconnect: () => void;
  reconnect: () => void;
};

export function useEventWebSocket(
  eventId: string | undefined,
  options: UseEventWebSocketOptions = {},
): UseEventWebSocketReturn {
  const {
    enabled = true,
    reconnect = true,
    reconnectDelay = 3000,
    onMessage,
    onOpen,
    onClose,
    onError,
  } = options;

  const handleMessage = useCallback(
    (message: WebSocketMessage) => {
      onMessage?.(message);
    },
    [onMessage],
  );

  const websocketPath = useMemo(() => {
    if (!eventId) {
      return "";
    }

    return `/ws/events/${eventId}`;
  }, [eventId]);

  const websocket = useWebSocket(websocketPath, {
    enabled: enabled && Boolean(eventId),
    reconnect,
    reconnectDelay,
    onMessage: handleMessage,
    onOpen,
    onClose,
    onError,
  });

  return websocket;
}