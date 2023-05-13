import { INFURA_API_KEY } from "./config.js"

export const STARGATE_FINANCE_ROUTER_ARBITRUM = '0x53Bf833A5d6c4ddA888F69c22C88C9f356a41614'
export const STARGATE_FINANCE_ROUTER_BNB = '0x4a364f8c717caad9a442737eb7b8a55cc6cf18d8'

export const NETWORKS = {
    ARBITRUM: {
        rpc: `https://arbitrum-mainnet.infura.io/v3/${INFURA_API_KEY}`,
        chainId: 42161,
        symbol: "ETH",
        explorerApiUrl: `https://api.arbiscan.io/api`,
        explorerApiKey: process.env.ETHERSCAN_ARBITRUM_API_KEY,
        name: "Arbitrum",
        tokens: [
            {
                symbol: 'USDT',
                address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
                decimals: 6
            },
            // {
            //   'symbol': 'USDC',
            //   'address': '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
            //   'availableSwap': true,
            //   'needTokenQuantity': 1
            // },
            {
                'symbol': 'STG',
                'address': '0x6694340fc020c5E6B96567843da2df01b2CE1eb6',
                'availableSwap': true,
                'needTokenQuantity': 0
            },
            {
                'symbol': 'VESTA',
                'address': '0xa684cd057951541187f288294a1e1C2646aA2d24',
                'availableSwap': true,
                'needTokenQuantity': 0.5
            },
            {
                'symbol': 'GMX',
                'address': '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a',
                'availableSwap': true,
                'needTokenQuantity': 0.01
            },
            {
                'symbol': 'veSTG',
                'address': '0xfBd849E6007f9BC3CC2D6Eb159c045B8dc660268',
                'availableSwap': false,
                'needTokenQuantity': 0.1
            },
        ]
      },
    POLYGON: {
        rpc: `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`,
        chainId: 137,
        symbol: "MATIC",
        explorerApiUrl: `https://api.polygonscan.com/api`,
        explorerApiKey: process.env.ETHERSCAN_POLYGON_API_KEY,
        name: "Polygon",
        tokens: [
            {
                symbol: 'USDC',
                address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
                decimals: 6
            },
            {
                symbol: 'USDT',
                address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
                decimals: 6
            }
        ]
    },
    ETHEREUM: {
        rpc: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
        chainId: 1,
        symbol: "ETH",
        explorerApiUrl: `https://api.etherscan.io/api`,
        explorerApiKey: process.env.ETHERSCAN_ETH_API_KEY,
        name: "Ethereum",
        tokens: []
    },
    BSC: {
        rpc: `https://bsc-dataseed3.defibit.io`,
        chainId: 56,
        symbol: "BNB",
        explorerApiUrl: `https://api.bscscan.com/api`,
        explorerApiKey: process.env.ETHERSCAN_BSC_API_KEY,
        name: "BSC",
        tokens: [
            {
                symbol: 'USDT',
                address: '0x55d398326f99059fF775485246999027B3197955',
                decimals: 18
            },
        ]
    },
    OPTIMISM: {
        rpc: `https://optimism-mainnet.infura.io/v3/${INFURA_API_KEY}`,
        chainId: 10,
        symbol: "ETH",
        name: "Optimism",
        explorerApiUrl: `https://api-optimistic.etherscan.io/api`,
        explorerApiKey: process.env.ETHERSCAN_OPTIMISM_API_KEY,
        tokens: [
            {
                symbol: 'USDC',
                address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
                decimals: 6
            }
        ]
    },
    FANTOM: {
        rpc: `https://fantom.publicnode.com`,
        chainId: 250,
        symbol: "FTM",
        name: "Fantom",
        explorerApiUrl: `https://api.ftmscan.com/api/`,
        explorerApiKey: process.env.ETHERSCAN_FTM_API_KEY,
        tokens: []
    },
    AVAX: {
        rpc: `https://avalanche-mainnet.infura.io/v3/${INFURA_API_KEY}`,
        chainId: 43114,
        symbol: "AVAX",
        name: "Avalanche",
        explorerApiUrl: `https://api.snowtrace.io/api/`,
        explorerApiKey: process.env.ETHERSCAN_SNOWTRACE_API_KEY,
        tokens: [
            {
                symbol: 'USDC',
                address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
                decimals: 6
            }
        ]
    },
    ZK_SYNC: {
        rpc: `https://zksync2-mainnet.zksync.io`,
        chainId: 324,
        symbol: "ETH",
        explorer: "https://explorer.zksync.io",
        name: "zkSync",
        tokens: [
            {
                symbol: 'USDC',
                address: '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4',
                decimals: 6
            }
        ]
    },
    LINEA: {
        rpc: `https://consensys-zkevm-goerli-prealpha.infura.io/v3/${INFURA_API_KEY}`,
        chainId: 59140,
        symbol: "ETH",
        explorer: "https://goerli.etherscan.io/",
        name: "Linea",
        tokens: []
    },
    ARBITRUM_GOERLI: {
        rpc: `https://arbitrum-goerli.infura.io/v3/${INFURA_API_KEY}`,
        chainId: 421613,
        symbol: "AGOR",
        explorer: "https://arbiscan.io/",
        name: "ArbitrumGoerli",
        tokens: []
    },
    ETHEREUM_GOERLI: {
        rpc: `https://goerli.infura.io/v3/${INFURA_API_KEY}`,
        chainId: 5,
        symbol: "ETH",
        explorer: "https://goerli.etherscan.io/",
        name: "EthereumGoerli",
        tokens: []
    },
}

export const DEFAULT_ETH_TOKEN = {
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    symbol: 'ETH',
    decimals: 18
}

// ABI's
export const ERC20_ABI = [
    // Read-Only Functions
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function allowance(address owner, address spender) view returns (uint256)',
  
    // Authenticated Functions
    'function transfer(address to, uint amount) returns (bool)',
    'function approve(address _spender, uint256 _value) returns (bool)',
  
    // Events
    'event Transfer(address indexed from, address indexed to, uint amount)',
  ]