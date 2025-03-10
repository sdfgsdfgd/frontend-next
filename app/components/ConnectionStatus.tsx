"use client";

import React, { useCallback, useEffect, useState } from 'react';
import useWebSocket from '../hooks/useWebSocket';

interface ConnectionStatusProps {
  url: string;
}

export default function ConnectionStatus({url}: ConnectionStatusProps) {
  const {
    connectionStatus,
    reconnect,
    lastMessage,
    sendMessage,
  } = useWebSocket({
    url,
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,
  });

  const [lastPingTime, setLastPingTime] = useState<Date | null>(null);
  const [roundTripMs, setRoundTripMs] = useState<number | null>(null);
  const [serverDeltaMs, setServerDeltaMs] = useState<number | null>(null);

  // Helper: color code latency
  const getLatencyColor = (latency: number) => {
    if (latency < 100) return 'text-green-400';
    if (latency < 250) return 'text-yellow-300';
    if (latency < 500) return 'text-orange-400';
    return 'text-red-500';
  };

  // Manual ping - Updated to match your Ktor message format
  const sendPing = useCallback(() => {
    if (connectionStatus === 'connected') {
      const now = Date.now();
      sendMessage(
        JSON.stringify({
          type: 'ping',
          clientTimestamp: now,
        })
      );
      console.log('Sent ping to Ktor backend:', now);
    }
  }, [connectionStatus, sendMessage]);

  // Listen for any incoming "pong" messages - Updated to match your Ktor response format
  useEffect(() => {
    if (!lastMessage) return;

    console.log('ConnectionStatus: received message = ', lastMessage);

    try {
      const data = JSON.parse(lastMessage);
      console.log('Parsed data:', data);
      
      // Check if it's a pong message from your Ktor backend
      if (data.type === 'pong') {
        // The server should reply with { type: "pong", clientTimestamp, serverTimestamp }
        const {clientTimestamp, serverTimestamp} = data;
        const now = Date.now();
        console.log('Got a PONG response, timestamps = ', clientTimestamp, serverTimestamp);

        // (1) Round-trip = now - clientTimestamp
        if (typeof clientTimestamp === 'number') {
          setRoundTripMs(now - clientTimestamp);
        }

        // (2) Server delta = serverTimestamp - clientTimestamp
        if (typeof clientTimestamp === 'number' && typeof serverTimestamp === 'number') {
          setServerDeltaMs(serverTimestamp - clientTimestamp);
        }

        setLastPingTime(new Date());
      }
    } catch (err) {
      // Not a valid JSON or not a "pong" we care about
      console.error('Failed to parse message from WebSocket', err);
    }
  }, [lastMessage]);

  // Automatically ping every 10 seconds (only if connected)
  useEffect(() => {
    if (connectionStatus !== 'connected') return;
    const pingTimer = setInterval(() => {
      sendPing();
    }, 10000);

    return () => clearInterval(pingTimer);
  }, [connectionStatus, sendPing]);

  // Ping once after initial connection, just to test quickly
  useEffect(() => {
    if (connectionStatus === 'connected') {
      console.log('WebSocket connection established, sending initial ping in 500ms');
      const timer = setTimeout(() => {
        sendPing();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [connectionStatus, sendPing]);

  // For the status circle color
  const getStatusStyles = () => {
    switch (connectionStatus) {
      case 'connected':
        // Single pulse once when we connect
        return 'bg-green-500 animate-neon-glow';
      case 'connecting':
        // Repeated pulse while connecting   (... could also use animate-ping or animate-bounce ...)
        return 'bg-yellow-500 animate-pulse';
      case 'disconnected':
        // Single pulse (reverse) to show a little effect on disconnect
        return 'bg-red-500 animate-pulse-once-reverse';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="flex flex-col space-y-2 text-sm md:text-xs text-gray-300">
      {/* Row: Connection Status Indicator */}
      <div className="flex items-center space-x-2">
        <div
          className={`h-3 w-3 rounded-full transition-all ${getStatusStyles()}`}
          title={`Status: ${connectionStatus}`}
        />
        <span>
          {connectionStatus === 'connected'
            ? 'Online'
            : connectionStatus === 'connecting'
              ? 'Connecting...'
              : 'Offline'}
        </span>
        {connectionStatus === 'disconnected' && (
          <button
            onClick={reconnect}
            className="text-blue-400 hover:text-blue-300 transition"
          >
            Reconnect
          </button>
        )}
        {connectionStatus === 'connected' && (
          <button
            onClick={sendPing}
            className="text-blue-400 hover:text-blue-300 transition"
            title="Send a manual ping"
          >
            Ping
          </button>
        )}
      </div>

      {/* Row: Latency / last ping info */}
      {connectionStatus === 'connected' && lastPingTime && (
        <div className="flex flex-col space-y-1 text-xs text-gray-400">
          <div>
            Last ping: <span>{lastPingTime.toLocaleTimeString()}</span>
          </div>
          {roundTripMs != null && (
            <div>
              Round-trip latency:{' '}
              <span className={getLatencyColor(roundTripMs)}>
                {roundTripMs} ms
              </span>
            </div>
          )}
          {serverDeltaMs != null && (
            <div>
              Server delta:{' '}
              <span className={serverDeltaMs < 10 ? 'text-green-300' : 'text-orange-300'}>
                {serverDeltaMs} ms
              </span>
            </div>
          )}
        </div>
      )}
    </div>

  );
}
