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
    sendMessage
  } = useWebSocket({
    url,
    reconnectInterval: 3000,
    maxReconnectAttempts: 10
  });

  const [lastPingTime, setLastPingTime] = useState<Date | null>(null);
  const [roundTripMs, setRoundTripMs] = useState<number | null>(null);
  const [serverDeltaMs, setServerDeltaMs] = useState<number | null>(null);

  // -- Helper: color code latency
  const getLatencyColor = (latency: number) => {
    if (latency < 100) return 'text-green-400';
    if (latency < 250) return 'text-yellow-300';
    if (latency < 500) return 'text-orange-400';
    return 'text-red-500';
  };

  // -- Send a manual ping
  const sendPing = useCallback(() => {
    if (connectionStatus === 'connected') {
      const now = Date.now();
      sendMessage(
        JSON.stringify({
          type: 'ping',
          clientTimestamp: now
        })
      );
    }
  }, [connectionStatus, sendMessage]);

  // -- Listen for any incoming messages (especially "pong")
  useEffect(() => {
    if (!lastMessage) return;

    console.log('ConnectionStatus: lastMessage = ', lastMessage);

    try {
      const data = JSON.parse(lastMessage);
      console.log('Parsed data:', data);
      if (data.type === 'pong') {
        // The server should reply with { type: "pong", clientTimestamp, serverTimestamp }
        const {clientTimestamp, serverTimestamp} = data;
        const now = Date.now();
        console.log('Got a PONG, timestamps = ', data.clientTimestamp, data.serverTimestamp);

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
      console.error('Failed to parse lastMessage', err);
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
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500 animate-pulse';
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="flex flex-col space-y-2 text-sm md:text-xs text-gray-300">
      {/* Row: Connection Status Indicator */}
      <div className="flex items-center space-x-2">
        <div
          className={`h-3 w-3 rounded-full ${getStatusStyles()}`}
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
