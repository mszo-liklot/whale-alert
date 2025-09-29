export interface WhaleTransaction {
  hash: string;
  from: string;
  fromLabel: string;
  to: string;
  toLabel: string;
  value: string;
  valueUSD: string;
  gasPrice: string;
  blockNumber: number;
  timestamp: string;
  type: 'ETH' | 'ERC20';
  tokenSymbol?: string;
  tokenName?: string;
}

export interface NetworkInfo {
  network: string;
  chainId: string;
  blockNumber: number;
  gasPrice: string;
}

export interface WebSocketMessage {
  type: 'whale_transaction' | 'initial_data' | 'network_status';
  data: any;
}