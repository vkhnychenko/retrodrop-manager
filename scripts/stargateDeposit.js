import { Stargate } from "../src/stargate.js"
import { readAccountsFromTextFile } from "../src/helpers/readers.js"
import { sleep, randomIntInRange, shuffleArray } from "../src/helpers/common.js"
import { IS_SLEEP, SLEEP_FROM, SLEEP_TO } from "../config/config.js"

const accounts = readAccountsFromTextFile()

async function main(){
    const shuffledAccounts = shuffleArray(accounts)
    for (let account of shuffledAccounts) {
        if (account.privateKey){
            const stargate = new Stargate({privateKey: account.privateKey})

            const {result: timestampIsReadyForStaking, undefinedChain: undefinedChainStaking } = await stargate.checkTimestamp({type: 'staking'})
            const {result: mainBalanceIsReady, chainName: mainChainName, tokenSymbol: mainTokenSymbol, tokenAddress: mainTokenAddress} = await stargate.checkBalance({type: 'main'})
            
            console.log('timestampIsReadyForStaking', timestampIsReadyForStaking)
            console.log('mainBalanceIsReady', mainBalanceIsReady)
            console.log('undefinedChainStaking', undefinedChainStaking)

            if (mainBalanceIsReady && timestampIsReadyForStaking){
                await stargate.addLiquidity({chainName: mainChainName, tokenAddress: mainTokenAddress, tokenSymbol: mainTokenSymbol})

                if (IS_SLEEP) {
                    let sle = randomIntInRange(SLEEP_FROM, SLEEP_TO);
                    console.log(`Задержка ${sle}с..`)
                    await sleep(sle * 1000)
                }
            }

            const {result: lpBalanceIsReady, chainName: lpChainName, tokenSymbol: lpTokenSymbol, tokenAddress: lpTokenAddress} = await stargate.checkBalance({type: 'lp'})
            console.log('lpBalanceIsReady', lpBalanceIsReady)

            if (lpBalanceIsReady && timestampIsReadyForStaking){
                await stargate.deposit({chainName: lpChainName, tokenSymbol: lpTokenSymbol})

                if (IS_SLEEP) {
                    let sle = randomIntInRange(SLEEP_FROM, SLEEP_TO);
                    console.log(`Задержка ${sle}с..`)
                    await sleep(sle * 1000)
                }
            }
        }
        console.log(`Задержка ${10}с..`)
        await sleep(10 * 1000)
    }
}

main()