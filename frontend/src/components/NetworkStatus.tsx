import { NetworkInfo } from '@/types/whale';

interface Props {
  networkInfo: NetworkInfo | null;
}

export default function NetworkStatus({ networkInfo }: Props) {
  if (!networkInfo) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 text-blue-300">🌐 Network Status</h3>
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading network info...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <h3 className="text-lg font-semibold mb-4 text-blue-300">🌐 Network Status</h3>

      <div className="space-y-4">
        <div>
          <div className="text-sm text-gray-400">Network</div>
          <div className="font-semibold text-white capitalize">{networkInfo.network}</div>
        </div>

        <div>
          <div className="text-sm text-gray-400">Chain ID</div>
          <div className="font-mono text-blue-400">{networkInfo.chainId}</div>
        </div>

        <div>
          <div className="text-sm text-gray-400">Latest Block</div>
          <div className="font-mono text-green-400">#{networkInfo.blockNumber.toLocaleString()}</div>
        </div>

        <div>
          <div className="text-sm text-gray-400">Gas Price</div>
          <div className="font-mono text-yellow-400">{parseFloat(networkInfo.gasPrice).toFixed(2)} Gwei</div>
        </div>

        <div className="pt-3 border-t border-white/10">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-400">Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
}