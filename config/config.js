import dotenv from 'dotenv'
dotenv.config()

export const CHAIN_NAME = 'ZK_SYNC'
export const RPC_TYPE = 'DEFAULT'
export const INFURA_API_KEY = process.env.INFURA_API_KEY
export const SWAP_ALL_BALANCE = false // true / false. если true, тогда свапаем весь баланс
export const AMOUNT_FROM = 0.001 // от какого кол-ва монет свапаем
export const AMOUNT_TO = 0.002 // до какого кол-ва монет свапаем
export const MIN_AMOUNT_BALANCE_FOR_ZKSYNC_BRIDGE = 0.01
export const MIN_AMOUNT_SWAP = 0 // если баланс будет меньше этого числа, свапать не будет
export const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN
export const TELEGRAM_IDS = process.env.TELEGRAM_IDS.split(',')
export const IS_SLEEP = true
export const SLEEP_FROM = 300; // seconds
export const SLEEP_TO = 600; // seconds
export const MIN_ETHEREUM_GAS_PRICE = 30 //gwei

//stargate finance
export const AMOUNT_FROM_STAKE_STARGATE = 0
export const AMOUNT_TO_STAKE_STARGATE = 0
export const MIN_TOKEN_BALANCE = 25

export const SLIPPAGE = 5  // 5 = 0.5%, 10 = 1%, 1 = 0.1%



// min_amount_swap     = 0         # если баланс будет меньше этого числа, свапать не будет
// keep_value_from     = 0         # от скольки монет оставляем на кошельке (работает только при : swap_all_balance = True)
// keep_value_to       = 0         # до скольки монет оставляем на кошельке (работает только при : swap_all_balance = True)

// slippage = 3 # слиппейдж, дефолт от 1 до 3