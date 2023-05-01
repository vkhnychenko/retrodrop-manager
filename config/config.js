import dotenv from 'dotenv'
dotenv.config()

export const INFURA_API_KEY = process.env.INFURA_API_KEY
export const SWAP_ALL_BALANCE = false // true / false. если true, тогда свапаем весь баланс
export const AMOUNT_FROM = 0.0001 // от какого кол-ва монет свапаем
export const AMOUNT_TO = 0.0002 // до какого кол-ва монет свапаем
export const MIN_AMOUNT_SWAP = 0 // если баланс будет меньше этого числа, свапать не будет


// min_amount_swap     = 0         # если баланс будет меньше этого числа, свапать не будет
// keep_value_from     = 0         # от скольки монет оставляем на кошельке (работает только при : swap_all_balance = True)
// keep_value_to       = 0         # до скольки монет оставляем на кошельке (работает только при : swap_all_balance = True)

// slippage = 3 # слиппейдж, дефолт от 1 до 3