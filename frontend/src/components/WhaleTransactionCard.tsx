import { WhaleTransaction } from '@/types/whale';

interface Props {
  transaction: WhaleTransaction;
}

export default function WhaleTransactionCard({ transaction }: Props) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getValueColor = (value: string, type: string) => {
    const amount = parseFloat(value.replace(/,/g, ''));
    if (type === 'ETH') {
      if (amount >= 1000) return 'text-red-400';
      if (amount >= 500) return 'text-orange-400';
      if (amount >= 100) return 'text-yellow-400';
      return 'text-green-400';
    } else {
      // For ERC-20 tokens, use USD value for color coding
      const usdValue = parseFloat(transaction.valueUSD.replace(/,/g, '')) || 0;
      if (usdValue >= 5000000) return 'text-red-400';    // $5M+
      if (usdValue >= 2000000) return 'text-orange-400'; // $2M+
      if (usdValue >= 1000000) return 'text-yellow-400'; // $1M+
      return 'text-green-400';
    }
  };

  const getTokenEmoji = (category?: string) => {
    switch (category) {
      case 'stablecoin': return '💰';
      case 'defi': return '🔄';
      case 'meme': return '🐸';
      case 'wrapped': return '🔗';
      case 'staking': return '⚡';
      case 'oracle': return '🔮';
      default: return '🪙';
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-blue-500/30 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">
            {transaction.type === 'ETH' ? '🐋' : getTokenEmoji(transaction.token?.category)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-2xl font-bold ${getValueColor(transaction.value, transaction.type)}`}>
                {transaction.value} {transaction.type === 'ETH' ? 'ETH' : transaction.token?.symbol}
              </span>
              <span className="text-gray-400">
                {transaction.valueUSD !== 'N/A' && `($${transaction.valueUSD})`}
              </span>
            </div>
            <div className="text-sm text-gray-400">
              {transaction.type === 'ERC20' && transaction.token && (
                <span className="text-blue-300 mr-2">{transaction.token.name}</span>
              )}
              Block #{transaction.blockNumber.toLocaleString()} • {formatTime(transaction.timestamp)}
            </div>
          </div>
        </div>

        <a
          href={`https://etherscan.io/tx/${transaction.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      <div className="space-y-3">
        {/* From Address */}
        <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
          <div>
            <div className="text-sm text-red-300 font-medium">FROM</div>
            <div className="text-red-400 font-mono">{formatAddress(transaction.from)}</div>
            <div className="text-xs text-red-300 mt-1">{transaction.fromLabel}</div>
          </div>
          <div className="text-red-400">📤</div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="text-gray-500">↓</div>
        </div>

        {/* To Address */}
        <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
          <div>
            <div className="text-sm text-green-300 font-medium">TO</div>
            <div className="text-green-400 font-mono">{formatAddress(transaction.to)}</div>
            <div className="text-xs text-green-300 mt-1">{transaction.toLabel}</div>
          </div>
          <div className="text-green-400">📥</div>
        </div>
      </div>

      {/* Transaction Details */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {transaction.gasPrice && (
            <div>
              <span className="text-gray-400">Gas Price:</span>
              <span className="ml-2 font-mono text-blue-400">{parseFloat(transaction.gasPrice).toFixed(2)} Gwei</span>
            </div>
          )}
          <div>
            <span className="text-gray-400">Type:</span>
            <span className="ml-2 font-mono text-purple-400">{transaction.type}</span>
          </div>
          {transaction.type === 'ERC20' && transaction.token && (
            <div className="col-span-2">
              <span className="text-gray-400">Token Contract:</span>
              <span className="ml-2 font-mono text-blue-400 text-xs">{formatAddress(transaction.token.address)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}