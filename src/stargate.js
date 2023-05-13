import { ethers } from "ethers"
import { NETWORKS } from "../config/constants.js";
import { stargateRouterAbi } from "../abi/syncSwap/stargateRouter.js";
import { stargateStakingAbi } from "../abi/stargateStakingAbi.js";
import { Connection } from "./helpers/provider.js";
import { ERC20_ABI } from "../config/constants.js";
import { SLIPPAGE, AMOUNT_FROM_STAKE_STARGATE, AMOUNT_TO_STAKE_STARGATE, MIN_TOKEN_BALANCE } from "../config/config.js";
import { randomIntInRange, sleep } from "./helpers/common.js";
import { sendMessageToTelegram } from "./telegramBot.js";
import { Etherscan } from "./etherscan.js";

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const TIME = 604800 // week in sec

const destinationChainIdMapping = {
    ARBITRUM: 110,
    BSC: 102,
    OPTIMISM: 111,
    POLYGON: 109,
    AVAX: 106,
    FANTOM: 112,
} 

const chainInfoMapping = {
    OPTIMISM: {
        routerContractAddress: '0xb0d502e938ed5f4df2e681fe6e419ff29631d62b',
        gasLimit: 600_000,
        pools: [],
        liquidityPools: []
    },
    ARBITRUM: {
        routerContractAddress: '0x53Bf833A5d6c4ddA888F69c22C88C9f356a41614',
        stakingContractAddress: '0xea8dfee1898a7e0a59f7527f076106d7e44c2176',
        gasLimit: 3_000_000,
        pools: [
            {poolId: 1, tokenName: 'USDT', LPTokenAddress: '0xB6CfcF89a7B22988bfC96632aC2A9D6daB60d641', tokenDecimals: 6}
        ],
        liquidityPools: [
            {poolId: 2, tokenName: 'USDT', LPTokenAddress: '0xB6CfcF89a7B22988bfC96632aC2A9D6daB60d641', tokenDecimals: 6}
        ]

    },
    BSC: {
        routerContractAddress: '0x4a364f8c717caad9a442737eb7b8a55cc6cf18d8',
        stakingContractAddress: '0x3052a0f6ab15b4ae1df39962d5ddefaca86dab47',
        gasLimit: 350_000,
        pools: [
            {liquidityPoolId: 2, stakingPoolId: 0, tokenName: 'USDT', LPTokenAddress: '0x9aA83081AA06AF7208Dcc7A4cB72C94d057D2cda', tokenDecimals: 6}
        ],
        liquidityPools: []
    },
    POLYGON: {
        routerContractAddress: '0x45a01e4e04f14f7a4a6702c74187c5f6222033cd',
        gasLimit: 500_000,
        pools: [],
        liquidityPools: []
    },
    AVAX: {
        routerContractAddress: '0x45a01e4e04f14f7a4a6702c74187c5f6222033cd',
        gasLimit: 450_000,
        pools: [],
        liquidityPools: []
    },
    FANTOM:{
        routerContractAddress: '0xaf5191b0de278c7286d6c7cc6ab6bb8a73ba2cd6',
        gasLimit: 600_000,
        pools: [],
        liquidityPools: []
    }
    
} 


export class Stargate {
    constructor({privateKey}) {
        this.privateKey = privateKey
    }

    async checkBalance(){
        let isReady = false
        let walletAddress = ''
        console.log('start check balance')
        for (const [chainName, value] of Object.entries(chainInfoMapping)){
            const connection = await this.getConnection({chainName})
            walletAddress = connection.wallet.address
            for (const token of connection.chain.tokens){
                if (token.symbol == 'USDT' || token.symbol == 'USDC'){
                    const {tokenBalance} = await connection.getTokenInfo(token.address)
                    if (+tokenBalance > MIN_TOKEN_BALANCE){
                        isReady = true
                    }
                }
            }
            for (const pool of value.pools){
                if (pool.tokenName == 'USDT' || pool.tokenName == 'USDC'){
                    const {tokenBalance} = await connection.getTokenInfo(pool.LPTokenAddress)
                    if (+tokenBalance > MIN_TOKEN_BALANCE){
                        isReady = true
                    }
                }
            }

            for (const pool of value.liquidityPools){
                if (pool.tokenName == 'USDT' || pool.tokenName == 'USDC'){
                    const {tokenBalance} = await connection.getTokenInfo(pool.LPTokenAddress)
                    if (+tokenBalance > MIN_TOKEN_BALANCE){
                        isReady = true
                    }
                }
            }
        }
        console.log(`balance is ready: ${isReady}  for wallet: ${walletAddress}`)
        if (!isReady){
            await sendMessageToTelegram(`Недостаточно баланса стейблкоинов для адреса: ${walletAddress}`)
        } 
        return isReady
    }

    async checkTimestamp(){
        console.log('start check timestamp')
        let isReady = false
        let walletAddress = ''
        const nowTimestamp = Date.now() / 1000
        let undefinedChainCount = 0
        for (const [key, value] of Object.entries(chainInfoMapping)){
            console.log('key', key)
            if (typeof value.routerContractAddress === 'undefined'){
                console.log(`routerContractAddress for network: ${key} not found`)
                return isReady
            }
            const connection = await this.getConnection({chainName: key})
            walletAddress = connection.wallet.address
            console.log('connection.wallet.address', connection.wallet.address)
            const etherscan = new Etherscan({address: connection.wallet.address})
            const lastTimestamp = await etherscan.getLastTransactionTimestamp({address: value.routerContractAddress, chainName: key})
            console.log('lastTimestamp', +lastTimestamp + TIME)
            console.log('nowTimestamp', nowTimestamp)
            if (lastTimestamp && +lastTimestamp + TIME < nowTimestamp){
                isReady = true
            }
            if (typeof lastTimestamp === 'undefined'){
                undefinedChainCount++
            }
        }
        if (undefinedChainCount == Object.keys(chainInfoMapping).length){
            isReady = true
        }
        console.log(`timestamp is ready: ${isReady}  for wallet: ${walletAddress}`)
        return isReady
    }

    async getConnection({chainName}){
        return new Connection(chainName, this.privateKey)
    }

    async checkAllowance({tokenAddress, connection, spenderAddress, amount, gasLimit, chainName}){

        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, connection.wallet)
        const rawAllowance = await tokenContract.allowance(connection.wallet.address, spenderAddress)
        const decimals = await tokenContract.decimals()
        const allowance = ethers.utils.formatUnits(rawAllowance, decimals)
        console.log('allowance', allowance)

        const rawAmount = ethers.utils.parseUnits(amount.toString(), decimals)
    
        if (allowance < amount){
            console.log('low allowance')
            const params = [spenderAddress, rawAmount]
            const status = await connection.sendTransaction({method: tokenContract.approve, params, value: 0, gasLimit, chainName})

            if (status != 1){
                return false
            }
        }

        return true
    }

    async randomSwap(){
        const randomAmount = randomIntInRange(AMOUNT_FROM_STAKE_STARGATE, AMOUNT_TO_STAKE_STARGATE)
        console.log(destinationChainIdMapping.length)
        const randomDestination = Object.keys(destinationChainIdMapping)[randomIntInRange(0, Object.keys(destinationChainIdMapping).length - 1)]
        console.log('randomAmount', randomAmount)
        console.log('randomDestination', randomDestination)
        for (const [chainName, value] of Object.entries(NETWORKS)){
            const connection = await this.getConnection({chainName})
            for (const token of value.tokens){
                // TODO
                if (token.symbol == 'USDT'){
                    const {rawTokenBalance, tokenBalance, tokenDecimals} = await connection.getTokenInfo(token.address)
                    console.log('tokenBalance', +tokenBalance)
                    if (+tokenBalance > MIN_TOKEN_BALANCE){
                        console.log(`swap for network: ${chainName}`)
                        const result = await this.swap({amountToSwap: randomAmount, chainFrom: chainName, chainTo: randomDestination, tokenAddress: token.address, tokenBalance, tokenDecimals})
                        if (result){
                            console.log('next deposit')
                        } 
                    }
                }
            }
        }
        // const destinationChainId = Object.entries(NETWORKS).filter(([key, value]) => value. == chainTo)[0][1]
    }

    async swap({amountToSwap, chainFrom, chainTo, tokenAddress, tokenBalance, tokenDecimals}){
        const connection = await this.getConnection({chainName: chainFrom})

        const chainInfo = chainInfoMapping[chainFrom]
        console.log(chainInfo)
        if (typeof chainInfo === 'undefined'){
            console.log(`chainInfo for network: ${chainFrom} not found`)
            return
        }
        const stargateRouterContract = new ethers.Contract(chainInfo.routerContractAddress, stargateRouterAbi, connection.wallet)
    
        if (typeof amountToSwap === 'undefined' || amountToSwap === 0 || amountToSwap > +tokenBalance){
            amountToSwap = tokenBalance
        }

        const destinationChainId = destinationChainIdMapping[chainTo]
        console.log('destinationChainId', destinationChainId)
        
        const fees = await stargateRouterContract.quoteLayerZeroFee(destinationChainId, 1, "0x0000000000000000000000000000000000001010", "0x", [0, 0, "0x0000000000000000000000000000000000000001"])
        const fee = fees[0]
        console.log('fee', ethers.utils.formatEther(fee))
        console.log('amountToSwap', amountToSwap)
    
        if (tokenBalance != 0 && tokenBalance >= amountToSwap){

            const checkAllowance = await this.checkAllowance({tokenAddress, connection, spenderAddress: chainInfo.routerContractAddress, amount: amountToSwap, gasLimit: chainInfo.gasLimit, chainName: chainFrom})
            if (!checkAllowance){
                console.log('check allowance status', checkAllowance)
                return false
            }
            //TODO
            //const sourcePoolId = 1 //USDC
            //const destPoolId = 1 //USDC
            const sourcePoolId = 2 //USDT
            const destPoolId = 2 //USDT
            const refundAddress = connection.wallet.address
            const amountIn = ethers.utils.parseUnits(amountToSwap.toString(), tokenDecimals) 
            const amountOutMin = ethers.utils.parseUnits((amountToSwap - (amountToSwap * SLIPPAGE) / 1000).toString(), tokenDecimals)
            const lzTxObj = [0, 0, '0x0000000000000000000000000000000000000001']
            const to = connection.wallet.address
            const data = '0x'

            const params = [destinationChainId, sourcePoolId, destPoolId, refundAddress, amountIn, amountOutMin, lzTxObj, to, data]

            const status = await connection.sendTransaction({method: stargateRouterContract.swap, params, value: fee, gasLimit: chainInfo.gasLimit, chainName: chainFrom})
            if (status != 1){
                return false
            }

            return true
        }
    }

    async addLiquidity({chainName, tokenAddress}){
        // const stargateChainId = destinationChainIdMapping[chainName]
        // if (typeof stargateChainId === 'undefined'){
        //     console.log(`stargateChainId for network: ${chainName} not found`)
        //     return
        // }
    
        const routerAddress = chainInfoMapping[chainName].contractAddress
        const gasLimit = chainInfoMapping[chainName].gasLimit
        if (typeof routerAddress === 'undefined'){
            console.log(`routerAddress for network: ${chainName} not found`)
            return
        }
    
        const connection = new Connection(chainName, PRIVATE_KEY)
        const routerContract = new ethers.Contract(routerAddress, stargateRouterAbi, connection.wallet)
    
        const {tokenSymbol, tokenDecimals, rawTokenBalance} = await connection.getTokenInfo(tokenAddress)
        const tokenBalance = ethers.utils.formatUnits(rawTokenBalance, tokenDecimals)
        console.log(tokenSymbol, tokenDecimals, rawTokenBalance)
    
    
        const amount = randomIntInRange(AMOUNT_FROM_STAKE_STARGATE, AMOUNT_TO_STAKE_STARGATE)
        console.log('amount', amount)
        const rawAmount = ethers.utils.parseUnits(amount.toString(), tokenDecimals)
        
        if (tokenBalance < amount){
            console.log('dfsf')
            await sendMessageToTelegram(`Недостаточно баланса токена ${tokenSymbol} в сети ${chainName} для адреса ${connection.wallet.address} - текущий баланс токена ${tokenBalance}`)
            return
        }
    
        await this.checkAllowance({tokenContract, connection, routerAddress, rawAmount, amount})
    
        const poolId = 2
        console.log(await connection.getGasPrice())
        console.log('nonce', await connection.getNonce())
        const tx = await routerContract.addLiquidity(poolId, rawAmount, connection.wallet.address,
                {
                    'from': connection.wallet.address,
                    'value': 0,
                    'gasLimit': gasLimit,
                    'gasPrice': await connection.getGasPrice(),
                    'nonce': await connection.getNonce()
                })
        console.log('tx', tx)
        const receipt = await tx.wait();
        console.log("receipt: ", receipt);
    
    
    }

    async deposit({chainName}){
        const routerAddress = chainInfoMapping[chainName].contractAddress
        const gasLimit = chainInfoMapping[chainName].gasLimit
        const USDTLPAddress = chainInfoMapping[chainName].USDTLPAddress
        const stakingAddress = chainInfoMapping[chainName].lpStakingAddress
        if (typeof routerAddress === 'undefined'){
            console.log(`routerAddress for network: ${chainName} not found`)
            return
        }

        const connection = new Connection(chainName, PRIVATE_KEY)
        const stakingContract = new ethers.Contract(stakingAddress, stargateStakingAbi, connection.wallet)
        const {tokenSymbol, tokenDecimals, rawTokenBalance} = await connection.getTokenInfo(USDTLPAddress)
        const tokenBalance = ethers.utils.formatUnits(rawTokenBalance, tokenDecimals)
        console.log('tokenBalance', tokenBalance)
        if (tokenBalance > 0){
            await this.checkAllowance({tokenAddress: USDTLPAddress, connection, spenderAddress: stakingAddress, rawAmount: rawTokenBalance, amount: tokenBalance})
            const poolId = 1
            console.log(await connection.getGasPrice())
            console.log('nonce', await connection.getNonce())
            const tx = await stakingContract.deposit(poolId, rawTokenBalance,
                {
                    'from': connection.wallet.address,
                    'value': 0,
                    'gasLimit': gasLimit,
                    'gasPrice': await connection.getGasPrice(),
                    'nonce': await connection.getNonce()
                })
            console.log('tx', tx)
            const receipt = await tx.wait();
            console.log("receipt: ", receipt);
        }
    }

    async getPoolBalance({stakingContract, poolId, connection, tokenDecimals}){
        const balance = await stakingContract.userInfo(poolId, connection.wallet.address)
        return {rawPoolBalance: balance.amount, poolBalance: ethers.utils.formatUnits(balance.amount, tokenDecimals)}
    }

    async withdrawAll(){
        for (const chainName of Object.keys(chainInfoMapping)){
            await this.withdraw({chainName})
        }
    }

    async withdraw({chainName}){
        const connection = await this.getConnection({chainName})
        const chainInfo = chainInfoMapping[chainName]
        if (typeof chainInfo === 'undefined' || chainInfo.stakingContractAddress === 'undefined'){
            console.log(`info for network: ${chainName} not found`)
            return
        }

        for (let pool of chainInfo.pools){
            console.log(pool)
            const stakingContract = new ethers.Contract(chainInfo.stakingContractAddress, stargateStakingAbi, connection.wallet)
            const {rawPoolBalance, poolBalance} = await this.getPoolBalance({stakingContract, poolId: pool.poolId, connection, tokenDecimals: pool.tokenDecimals})
            console.log('poolBalance', poolBalance)
            if (poolBalance > 0){
                const tx = await stakingContract.withdraw(pool.poolId, rawPoolBalance, {
                    'from': connection.wallet.address,
                    'value': 0,
                    'gasLimit': chainInfo.gasLimit,
                    'gasPrice': await connection.getGasPrice(),
                    'nonce': await connection.getNonce()
                })

                console.log('tx', tx)
                const receipt = await tx.wait();
                console.log("receipt: ", receipt);
            }
        }
    }

    // TODO redeem remote
    async removeAllLiquidity({chainName}){
        const chainInfo = chainInfoMapping[chainName]
        if (typeof chainInfo === 'undefined'){
            console.log(`info for network: ${chainName} not found`)
            return
        }
        const connection = await this.getConnection({chainName})
        const routerContract = new ethers.Contract(chainInfo.routerContractAddress, stargateRouterAbi, connection.wallet)

        for (let pool of chainInfo.liquidityPools){
            const {tokenSymbol, tokenDecimals, rawTokenBalance, tokenBalance} = await connection.getTokenInfo(pool.LPTokenAddress)
            if (tokenBalance > 0){
                const gasPrice = await connection.getGasPrice()
                const {rawNativeBalance, nativeBalance} = await connection.getNativeBalance()
                const needGas = gasPrice * chainInfo.gasLimit * 1.1
                if (+rawNativeBalance < needGas){
                    console.log('Gas not enough')
                    await sendMessageToTelegram(`Недостаточно баланса для оплаты газа в сети ${chainName} для адреса ${connection.wallet.address} - текущий баланс ${nativeBalance}`)
                    return
                }
                try{
                    const tx = await routerContract.instantRedeemLocal(pool.poolId, rawTokenBalance, connection.wallet.address, {
                        'from': connection.wallet.address,
                        'value': 0,
                        'gasLimit': chainInfo.gasLimit,
                        'gasPrice': await connection.getGasPrice(),
                        'nonce': await connection.getNonce()
                    })
    
                    console.log('tx', tx)
                    const receipt = await tx.wait();
                    console.log("receipt: ", receipt);
                } catch (e){
                    console.log(`Error while send transaction`, e.message)
                }
            }
        }
    }
}

 
// const stargate = new Stargate({privateKey: PRIVATE_KEY})
// const res = await stargate.checkReady()
// console.log('res', res)
// stargate.withdrawAll({chainName: "ARBITRUM"})
// stargate.removeAllLiquidity({chainName: "ARBITRUM"})

// addLiquidity({chainName: "ARBITRUM", tokenAddress: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'})

// swap({
//     chainFrom: 'BSC',
//     chainTo: 'ARBITRUM',
// })