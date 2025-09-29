const express = require('express');
const { ethers } = require('ethers');
const WebSocket = require('ws');
const cors = require('cors');
const tokenConfig = require('./tokenConfig');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to local Geth node
const RPC_URL = process.env.ETHEREUM_RPC_URL || 'http://localhost:8545';
const WS_URL = process.env.ETHEREUM_WS_URL || 'ws://localhost:8546';

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wsProvider = new ethers.WebSocketProvider(WS_URL);

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ port: 8080 });

// Whale transaction threshold (in ETH)
const ETH_WHALE_THRESHOLD = ethers.parseEther('100'); // 100 ETH

// ERC-20 Transfer Event Signature
const TRANSFER_EVENT_SIGNATURE = tokenConfig.TRANSFER_EVENT_SIGNATURE;

// Store recent whale transactions
let recentWhaleTransactions = [];

// Known exchange and whale addresses (sample data)
const knownAddresses = {
    '0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae': 'Ethereum Foundation',
    '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be': 'Binance',
    '0xd551234ae421e3bcba99a0da6d736074f22192ff': 'Binance 2',
    '0x28c6c06298d514db089934071355e5743bf21d60': 'Binance 14',
    '0x21a31ee1afc51d94c2efccaa2092ad1028285549': 'Binance 15',
    '0xdfd5293d8e347dfe59e90efd55b2956a1343963d': 'Binance 16',
    '0x56eddb7aa87536c09ccc2793473599fd21a8b17f': 'Binance Hot Wallet',
    '0x9696f59e4d72e237be84ffd425dcad154bf96976': 'Binance 7',
    '0x4e9ce36e442e55ecd9025b9a6e0d88485d628a67': 'Binance 8',
    '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8': 'Binance 9',
    '0xf977814e90da44bfa03b6295a0616a897441acec': 'Binance 10',
    '0x001d14804b399c6ef80e64576f657660804fec0b': 'Bitfinex',
    '0x876eabf441b2ee5b5b0554fd502a8e0600950cfa': 'Coinbase 1',
    '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43': 'Coinbase 10',
    '0x77696bb39917c91a0c3908d577d5e322095425ca': 'Coinbase 11'
};

// Get address label
function getAddressLabel(address) {
    return knownAddresses[address.toLowerCase()] || `Unknown (${address.slice(0, 6)}...${address.slice(-4)})`;
}

// Check if transaction is a whale transaction (ETH)
function isWhaleTransaction(tx) {
    if (!tx.value) return false;
    return tx.value >= ETH_WHALE_THRESHOLD;
}

// Decode ERC-20 Transfer log
function decodeTransferLog(log) {
    try {
        // Transfer(address indexed from, address indexed to, uint256 value)
        const from = '0x' + log.topics[1].slice(26);
        const to = '0x' + log.topics[2].slice(26);
        const value = BigInt(log.data);

        return {
            tokenAddress: log.address.toLowerCase(),
            from: from,
            to: to,
            value: value
        };
    } catch (error) {
        console.error('Error decoding transfer log:', error);
        return null;
    }
}

// Check if ERC-20 transfer is a whale transaction
function isERC20WhaleTransaction(decodedLog) {
    const token = tokenConfig.getTokenByAddress(decodedLog.tokenAddress);
    if (!token) return false;

    // Convert value to human readable format
    const valueInTokens = Number(decodedLog.value) / Math.pow(10, token.decimals);

    return valueInTokens >= token.whaleThreshold;
}

// Format ERC-20 transaction for display
function formatERC20Transaction(decodedLog, blockNumber, txHash) {
    const token = tokenConfig.getTokenByAddress(decodedLog.tokenAddress);
    if (!token) return null;

    const valueInTokens = Number(decodedLog.value) / Math.pow(10, token.decimals);

    return {
        hash: txHash,
        from: decodedLog.from,
        fromLabel: getAddressLabel(decodedLog.from),
        to: decodedLog.to,
        toLabel: getAddressLabel(decodedLog.to),
        value: valueInTokens.toLocaleString(),
        valueUSD: token.category === 'stablecoin' ? valueInTokens.toLocaleString() : 'N/A',
        token: {
            symbol: token.symbol,
            name: token.name,
            address: token.address,
            category: token.category
        },
        blockNumber: blockNumber,
        timestamp: new Date().toISOString(),
        type: 'ERC20'
    };
}

// Format transaction for display
function formatTransaction(tx, blockNumber) {
    const valueInEth = ethers.formatEther(tx.value || '0');
    return {
        hash: tx.hash,
        from: tx.from,
        fromLabel: getAddressLabel(tx.from),
        to: tx.to,
        toLabel: getAddressLabel(tx.to || ''),
        value: valueInEth,
        valueUSD: (parseFloat(valueInEth) * 2500).toFixed(2), // Rough ETH price estimate
        gasPrice: tx.gasPrice ? ethers.formatUnits(tx.gasPrice, 'gwei') : '0',
        blockNumber: blockNumber,
        timestamp: new Date().toISOString(),
        type: 'ETH'
    };
}

// Broadcast whale transaction to all connected clients
function broadcastWhaleTransaction(transaction) {
    const message = JSON.stringify({
        type: 'whale_transaction',
        data: transaction
    });

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Monitor new blocks and transactions
async function monitorBlocks() {
    console.log('🐋 Starting whale alert monitoring...');

    try {
        // Check if we can connect to Geth
        const network = await provider.getNetwork();
        console.log(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);

        const currentBlock = await provider.getBlockNumber();
        console.log(`Current block number: ${currentBlock}`);

        // Listen for new blocks
        provider.on('block', async (blockNumber) => {
            try {
                console.log(`📦 New block: ${blockNumber}`);

                // Get block with transactions
                const block = await provider.getBlock(blockNumber, true);
                if (!block || !block.transactions) {
                    console.log(`⚠️  Block ${blockNumber} has no transactions`);
                    return;
                }

                console.log(`🔍 Checking ${block.transactions.length} transactions in block ${blockNumber}`);

                // Check each transaction for whale activity
                for (const tx of block.transactions) {
                    // Check ETH whale transactions
                    if (isWhaleTransaction(tx)) {
                        const formattedTx = formatTransaction(tx, blockNumber);
                        recentWhaleTransactions.unshift(formattedTx);

                        console.log(`🐋 ETH WHALE ALERT: ${formattedTx.value} ETH from ${formattedTx.fromLabel} to ${formattedTx.toLabel}`);
                        broadcastWhaleTransaction(formattedTx);
                    }
                }

                // Get transaction receipts to check for ERC-20 transfers
                const receipts = await Promise.all(
                    block.transactions.map(async (tx) => {
                        try {
                            return await provider.getTransactionReceipt(tx.hash);
                        } catch (error) {
                            console.error(`Error getting receipt for ${tx.hash}:`, error.message);
                            return null;
                        }
                    })
                );

                // Check ERC-20 transfers in transaction logs
                for (const receipt of receipts) {
                    if (!receipt || !receipt.logs) continue;

                    for (const log of receipt.logs) {
                        // Check if this is a Transfer event
                        if (log.topics[0] === TRANSFER_EVENT_SIGNATURE && log.topics.length === 3) {
                            const decodedLog = decodeTransferLog(log);
                            if (!decodedLog) continue;

                            // Check if it's a whale transaction
                            if (isERC20WhaleTransaction(decodedLog)) {
                                const formattedTx = formatERC20Transaction(decodedLog, blockNumber, receipt.hash);
                                if (formattedTx) {
                                    recentWhaleTransactions.unshift(formattedTx);

                                    console.log(`🐋 ${formattedTx.token.symbol} WHALE ALERT: ${formattedTx.value} ${formattedTx.token.symbol} from ${formattedTx.fromLabel} to ${formattedTx.toLabel}`);
                                    broadcastWhaleTransaction(formattedTx);
                                }
                            }
                        }
                    }
                }

                // Keep only last 100 transactions
                if (recentWhaleTransactions.length > 100) {
                    recentWhaleTransactions = recentWhaleTransactions.slice(0, 100);
                }
            } catch (error) {
                console.error(`Error processing block ${blockNumber}:`, error.message);
            }
        });

    } catch (error) {
        console.error('Failed to connect to Ethereum node:', error.message);
        console.log('Retrying in 10 seconds...');
        setTimeout(monitorBlocks, 10000);
    }
}

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Whale Alert API',
        status: 'running',
        connectedClients: wss.clients.size
    });
});

app.get('/api/whale-transactions', (req, res) => {
    res.json({
        transactions: recentWhaleTransactions,
        count: recentWhaleTransactions.length
    });
});

app.get('/api/network-status', async (req, res) => {
    try {
        const network = await provider.getNetwork();
        const blockNumber = await provider.getBlockNumber();
        const gasPrice = await provider.getFeeData();

        res.json({
            network: network.name,
            chainId: network.chainId.toString(),
            blockNumber,
            gasPrice: gasPrice.gasPrice ? ethers.formatUnits(gasPrice.gasPrice, 'gwei') : '0'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get supported tokens
app.get('/api/tokens', (req, res) => {
    const tokens = Object.entries(tokenConfig)
        .filter(([key, value]) => value && value.address)
        .map(([symbol, config]) => ({
            symbol,
            name: config.name,
            address: config.address,
            decimals: config.decimals,
            category: config.category,
            priority: config.priority,
            whaleThreshold: config.whaleThreshold
        }));

    res.json({
        tokens,
        count: tokens.length
    });
});

// Get whale transactions by token
app.get('/api/whale-transactions/:token', (req, res) => {
    const token = req.params.token.toUpperCase();
    const filteredTransactions = recentWhaleTransactions.filter(tx => {
        if (token === 'ETH') return tx.type === 'ETH';
        return tx.type === 'ERC20' && tx.token && tx.token.symbol === token;
    });

    res.json({
        token,
        transactions: filteredTransactions,
        count: filteredTransactions.length
    });
});

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('📱 New client connected');

    // Send recent transactions to new client
    ws.send(JSON.stringify({
        type: 'initial_data',
        data: recentWhaleTransactions
    }));

    ws.on('close', () => {
        console.log('📱 Client disconnected');
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Whale Alert API server running on port ${PORT}`);
    console.log(`📡 WebSocket server running on port 8080`);

    // Start monitoring after a short delay to ensure Geth is ready
    setTimeout(() => {
        monitorBlocks();
    }, 5000);
});