'use client';

import { useState, useEffect, useCallback } from 'react';
import WhaleTransactionCard from '@/components/WhaleTransactionCard';
import NetworkStatus from '@/components/NetworkStatus';
import { WhaleTransaction, NetworkInfo } from '@/types/whale';

export default function Home() {
  const [whaleTransactions, setWhaleTransactions] = useState<WhaleTransaction[]>([]);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Fetch network status
  const fetchNetworkStatus = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/network-status');
      const data = await response.json();
      setNetworkInfo(data);
    } catch (error) {
      console.error('Failed to fetch network status:', error);
    }
  }, []);

  // Fetch initial whale transactions
  const fetchWhaleTransactions = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/whale-transactions');
      const data = await response.json();
      setWhaleTransactions(data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch whale transactions:', error);
    }
  }, []);

  // Set up WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      const websocket = new WebSocket('ws://localhost:8080');

      websocket.onopen = () => {
        console.log('🔗 Connected to whale alert WebSocket');
        setConnectionStatus('connected');
      };

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'whale_transaction') {
            setWhaleTransactions(prev => [message.data, ...prev.slice(0, 99)]);
          } else if (message.type === 'initial_data') {
            setWhaleTransactions(message.data || []);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      websocket.onclose = () => {
        console.log('🔌 WebSocket connection closed. Reconnecting...');
        setConnectionStatus('disconnected');
        setTimeout(connectWebSocket, 5000);
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
      };

      setWs(websocket);
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchNetworkStatus();
    fetchWhaleTransactions();

    // Refresh network status every 30 seconds
    const interval = setInterval(fetchNetworkStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchNetworkStatus, fetchWhaleTransactions]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-blue-500/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                🐋 Whale Alert
              </h1>
              <p className="text-blue-200 mt-2">Real-time Ethereum whale transaction monitoring</p>
            </div>

            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                connectionStatus === 'connected'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : connectionStatus === 'connecting'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {connectionStatus === 'connected' ? '🟢 Live' :
                 connectionStatus === 'connecting' ? '🟡 Connecting' : '🔴 Disconnected'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Network Status Sidebar */}
          <div className="lg:col-span-1">
            <NetworkStatus networkInfo={networkInfo} />

            <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold mb-4 text-blue-300">📊 Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Alerts:</span>
                  <span className="font-mono text-blue-400">{whaleTransactions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Threshold:</span>
                  <span className="font-mono text-purple-400">100+ ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Status:</span>
                  <span className={`font-mono ${
                    connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {connectionStatus === 'connected' ? 'Monitoring' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Recent Whale Transactions</h2>
              <div className="text-sm text-gray-400">
                {whaleTransactions.length > 0 ?
                  `Last updated: ${new Date(whaleTransactions[0]?.timestamp || Date.now()).toLocaleTimeString()}` :
                  'Waiting for transactions...'
                }
              </div>
            </div>

            {/* Transaction List */}
            <div className="space-y-4">
              {whaleTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🐋</div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">No whale transactions yet</h3>
                  <p className="text-gray-500">Monitoring the blockchain for large transfers...</p>

                  {connectionStatus !== 'connected' && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-400">Not connected to monitoring service</p>
                      <p className="text-sm text-red-300 mt-1">Please check if the backend server is running</p>
                    </div>
                  )}
                </div>
              ) : (
                whaleTransactions.map((transaction, index) => (
                  <WhaleTransactionCard
                    key={`${transaction.hash}-${index}`}
                    transaction={transaction}
                  />
                ))
              )}
            </div>

            {whaleTransactions.length > 0 && (
              <div className="mt-8 text-center">
                <p className="text-gray-400">Showing last {whaleTransactions.length} whale transactions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}