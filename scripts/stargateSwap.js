// Проверяем что за последнюю неделю не было транзакций в контракт staking)
// Если есть токены в стейкинге, сначала выводим их и выводим из ликвидности
// Затем проверяем что не было взаимодейстий с контрактом swap
// Затем делаем swap на другую сеть выбранную рандомно из списка
// После обмена, проверяем что есть токены, добавляем ликвидность и стейкаем токены в сети, куда совершили перевод

import { Stargate } from "../src/stargate.js"
import { readAccountsFromTextFile } from "../src/helpers/readers.js"
import { IS_SLEEP, SLEEP_FROM, SLEEP_TO } from "../config/config.js"
import { randomIntInRange, sleep, shuffleArray} from "../src/helpers/common.js"

const accounts = readAccountsFromTextFile()

async function main(){
    const shuffledAccounts = shuffleArray(accounts)
    for (let account of shuffledAccounts) {
        if (account.privateKey){
            const stargate = new Stargate({privateKey: account.privateKey})
            const {result: timestampIsReadyForSwap, undefinedChain: undefinedChainSwap } = await stargate.checkTimestamp({type: 'swap'})
            console.log('timestampIsReadyForSwap', timestampIsReadyForSwap)
            console.log('undefinedChainSwap', undefinedChainSwap)

            if (timestampIsReadyForSwap){
                const withdrawStatus = await stargate.withdrawAll()
                if (withdrawStatus){
                    if (IS_SLEEP) {
                        let sle = randomIntInRange(SLEEP_FROM, SLEEP_TO);
                        console.log(`Задержка ${sle}с..`)
                        await sleep(sle * 1000)
                    }
                }
                const removeLiquidityStatus =await stargate.removeAllLiquidity()
                if (removeLiquidityStatus){
                    if (IS_SLEEP) {
                        let sle = randomIntInRange(SLEEP_FROM, SLEEP_TO);
                        console.log(`Задержка ${sle}с..`)
                        await sleep(sle * 1000)
                    }
                }

                const {result: balanceIsReady, chainName, tokenSymbol, tokenAddress} = await stargate.checkBalance({type: 'main'})
                if (balanceIsReady){
                    const swapStatus = await stargate.randomSwap({undefinedChain: undefinedChainSwap, chainName, tokenSymbol, tokenAddress})
                    if (swapStatus){
                        if (IS_SLEEP) {
                            let sle = randomIntInRange(SLEEP_FROM, SLEEP_TO);
                            console.log(`Задержка ${sle}с..`)
                            await sleep(sle * 1000)
                        }
                    }
                }
            }
        }
        console.log(`Задержка ${10}с..`)
        await sleep(10 * 1000)
    }
}

main()