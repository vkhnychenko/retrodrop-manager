// Проверяем что за последнюю неделю не было транзакций в контракт staking)
// Если есть токены в стейкинге, сначала выводим их и выводим из ликвидности
// Затем проверяем что не было взаимодейстий с контрактом swap
// Затем делаем swap на другую сеть выбранную рандомно из списка
// После обмена, проверяем что есть токены, добавляем ликвидность и стейкаем токены в сети, куда совершили перевод

import { Stargate } from "../src/stargate.js"
import { readAccountsFromTextFile } from "../src/helpers/readers.js"
import { randomIntInRange, sleep, shuffleArray, newSleep} from "../src/helpers/common.js"

const accounts = readAccountsFromTextFile()
const shuffledAccounts = shuffleArray(accounts)

async function main(){
    for (let account of shuffledAccounts) {
        if (account.privateKey){
            const stargate = new Stargate({privateKey: account.privateKey})
            const {result: timestampIsReadyForSwap, undefinedChain: undefinedChainSwap } = await stargate.checkTimestamp({type: 'swap'})
            console.log('timestampIsReadyForSwap', timestampIsReadyForSwap)
            console.log('undefinedChainSwap', undefinedChainSwap)

            if (timestampIsReadyForSwap){
                // check deposit balance
                const {result: poolBalanceResult, chains: poolChains} = await stargate.checkPoolBalance()


                if (poolChains){
                    for (let chainName of poolChains) {
                        const withdrawStatus = await stargate.withdraw({chainName})
                        if (withdrawStatus){
                            await newSleep()
                            const removeStatus = await stargate.removeLiquidity({chainName})
                            if (removeStatus){
                                await newSleep()
                            }
                            
                        }
                    }
                }

                //check lp
                const {result: lpBalanceIsReady, chainName: lpChainName, tokenSymbol: lpTokenSymbol, tokenAddress: lpTokenAddress} = await stargate.checkBalance({type: 'lp', tokensName: ['USDT', 'USDC']})
                if (lpBalanceIsReady){
                    const removeStatus = await stargate.removeLiquidity({lpChainName})
                    if (removeStatus){
                        await newSleep()
                    }
                }

                
                const {result: balanceIsReady, chainName, tokenSymbol, tokenAddress} = await stargate.checkBalance({type: 'main', tokensName: ['USDT', 'USDC']})

                if (balanceIsReady){
                    const {result: swapStatus, destinationChain } = await stargate.randomSwap({undefinedChain: undefinedChainSwap, chainName, tokenSymbol, tokenAddress})
                    if (swapStatus){
                        await newSleep()
                        const {result: mainBalanceIsReady, chainName: mainChainName, tokenSymbol: mainTokenSymbol, tokenAddress: mainTokenAddress} = await stargate.checkBalance({type: 'main', tokensName: ['USDT', 'USDC']})
                        console.log('mainBalanceIsReady', mainBalanceIsReady)
                        if (mainBalanceIsReady){
                            const liquidityStatus = await stargate.addLiquidity({chainName: mainChainName, tokenAddress: mainTokenAddress, tokenSymbol: mainTokenSymbol})
                            if (liquidityStatus){
                                await newSleep()
                                const {result: lpBalanceIsReady, chainName: lpChainName, tokenSymbol: lpTokenSymbol, tokenAddress: lpTokenAddress} = await stargate.checkBalance({type: 'lp', tokensName: ['USDT', 'USDC']})
                                console.log('lpBalanceIsReady', lpBalanceIsReady)
                                if (lpBalanceIsReady){
                                    const depositStatus = await stargate.deposit({chainName: lpChainName, tokenSymbol: lpTokenSymbol})
                                    if (depositStatus){
                                        await newSleep()
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        await newSleep(10)
    }
}

main()