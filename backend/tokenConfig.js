// ERC-20 Token Configuration for Whale Alert
module.exports = {
    // Stablecoins (High Priority)
    USDT: {
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        decimals: 6,
        symbol: 'USDT',
        name: 'Tether USD',
        whaleThreshold: 1000000, // $1M USD
        priority: 'high',
        category: 'stablecoin'
    },
    USDC: {
        address: '0xA0b86a33E6441d0D0Ff2c8EC58f516D2c9A2dc4e',
        decimals: 6,
        symbol: 'USDC',
        name: 'USD Coin',
        whaleThreshold: 1000000, // $1M USD
        priority: 'high',
        category: 'stablecoin'
    },
    DAI: {
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        decimals: 18,
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        whaleThreshold: 1000000, // $1M USD
        priority: 'high',
        category: 'stablecoin'
    },
    BUSD: {
        address: '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
        decimals: 18,
        symbol: 'BUSD',
        name: 'Binance USD',
        whaleThreshold: 1000000, // $1M USD
        priority: 'high',
        category: 'stablecoin'
    },

    // Major DeFi Tokens
    UNI: {
        address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        decimals: 18,
        symbol: 'UNI',
        name: 'Uniswap',
        whaleThreshold: 100000, // 100K UNI (~$500K)
        priority: 'high',
        category: 'defi'
    },
    AAVE: {
        address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
        decimals: 18,
        symbol: 'AAVE',
        name: 'Aave Token',
        whaleThreshold: 5000, // 5K AAVE (~$500K)
        priority: 'high',
        category: 'defi'
    },
    LINK: {
        address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
        decimals: 18,
        symbol: 'LINK',
        name: 'ChainLink Token',
        whaleThreshold: 50000, // 50K LINK (~$500K)
        priority: 'high',
        category: 'oracle'
    },
    CRV: {
        address: '0xD533a949740bb3306d119CC777fa900bA034cd52',
        decimals: 18,
        symbol: 'CRV',
        name: 'Curve DAO Token',
        whaleThreshold: 1000000, // 1M CRV (~$500K)
        priority: 'medium',
        category: 'defi'
    },
    COMP: {
        address: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
        decimals: 18,
        symbol: 'COMP',
        name: 'Compound',
        whaleThreshold: 10000, // 10K COMP (~$500K)
        priority: 'medium',
        category: 'defi'
    },

    // Popular Tokens
    SHIB: {
        address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
        decimals: 18,
        symbol: 'SHIB',
        name: 'SHIBA INU',
        whaleThreshold: 50000000000000, // 50T SHIB (~$500K)
        priority: 'medium',
        category: 'meme'
    },
    PEPE: {
        address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
        decimals: 18,
        symbol: 'PEPE',
        name: 'Pepe',
        whaleThreshold: 50000000000000, // 50T PEPE (~$500K)
        priority: 'medium',
        category: 'meme'
    },
    MATIC: {
        address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
        decimals: 18,
        symbol: 'MATIC',
        name: 'Matic Token',
        whaleThreshold: 1000000, // 1M MATIC (~$500K)
        priority: 'medium',
        category: 'layer2'
    },
    LDO: {
        address: '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32',
        decimals: 18,
        symbol: 'LDO',
        name: 'Lido DAO Token',
        whaleThreshold: 500000, // 500K LDO (~$500K)
        priority: 'medium',
        category: 'staking'
    },

    // Institutional / Wrapped Tokens
    WBTC: {
        address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        decimals: 8,
        symbol: 'WBTC',
        name: 'Wrapped BTC',
        whaleThreshold: 10, // 10 WBTC (~$500K)
        priority: 'high',
        category: 'wrapped'
    },
    stETH: {
        address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
        decimals: 18,
        symbol: 'stETH',
        name: 'Lido Staked Ether',
        whaleThreshold: 200, // 200 stETH (~$500K)
        priority: 'high',
        category: 'staking'
    }
};

// ERC-20 Transfer Event Signature
module.exports.TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// Get all token addresses for filtering
module.exports.getAllTokenAddresses = function() {
    return Object.values(module.exports)
        .filter(token => token && token.address)
        .map(token => token.address.toLowerCase());
};

// Get token by address
module.exports.getTokenByAddress = function(address) {
    const normalizedAddress = address.toLowerCase();
    for (const [symbol, config] of Object.entries(module.exports)) {
        if (config && config.address && config.address.toLowerCase() === normalizedAddress) {
            return { symbol, ...config };
        }
    }
    return null;
};