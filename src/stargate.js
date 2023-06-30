import { ethers } from "ethers"
import { NETWORKS } from "../config/constants.js";
import { stargateRouterAbi } from "../abi/syncSwap/stargateRouter.js";
import { stargateStakingAbi } from "../abi/stargateStakingAbi.js";
import { Connection } from "./helpers/provider.js";
import { ERC20_ABI } from "../config/constants.js";
import { SLIPPAGE, AMOUNT_FROM_STAKE_STARGATE, AMOUNT_TO_STAKE_STARGATE, MIN_TOKEN_BALANCE } from "../config/config.js";
import { randomIntInRange } from "./helpers/common.js";
import { sendMessageToTelegram } from "./telegramBot.js";
import { Etherscan } from "./etherscan.js";

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const TIME = 432000 // 5 days in sec

const destinationChainMapping = {
    ARBITRUM: {chainId: 110, poolId: 2},
    BSC: {chainId: 102, poolId: 2},
    OPTIMISM: {chainId: 111, poolId: 1},
    POLYGON: {chainId: 109, poolId: 2},
    AVAX: {chainId: 106, poolId: 2},
    // FANTOM: {chainId: 112, poolId: 1},
} 

const sourcePoolMapping = {
    USDT: 2,
    USDC: 1,
} 

const chainInfoMapping = {
    OPTIMISM: {
        routerContractAddress: '0xb0d502e938ed5f4df2e681fe6e419ff29631d62b',
        stakingContractAddress: '0x4dea9e918c6289a52cd469cac652727b7b412cd2',
        gasLimit: 600_000,
        pools: [
            {liquidityPoolId: 1, stakingPoolId: 0 , tokenSymbol: 'USDC', tokenAddress: '0xDecC0c09c3B5f6e92EF4184125D5648a66E35298', tokenDecimals: 6}
        ],
    },
    ARBITRUM: {
        routerContractAddress: '0x53Bf833A5d6c4ddA888F69c22C88C9f356a41614',
        stakingContractAddress: '0xea8dfee1898a7e0a59f7527f076106d7e44c2176',
        gasLimit: 3_000_000,
        pools: [
            {liquidityPoolId: 2, stakingPoolId: 1, tokenSymbol: 'USDT', tokenAddress: '0xB6CfcF89a7B22988bfC96632aC2A9D6daB60d641', tokenDecimals: 6}
        ],
    },
    BSC: {
        routerContractAddress: '0x4a364f8c717caad9a442737eb7b8a55cc6cf18d8',
        stakingContractAddress: '0x3052a0f6ab15b4ae1df39962d5ddefaca86dab47',
        gasLimit: 350_000,
        pools: [
            {liquidityPoolId: 2, stakingPoolId: 0, tokenSymbol: 'USDT', tokenAddress: '0x9aA83081AA06AF7208Dcc7A4cB72C94d057D2cda', tokenDecimals: 6},
        ],
    },
    POLYGON: {
        routerContractAddress: '0x45a01e4e04f14f7a4a6702c74187c5f6222033cd',
        stakingContractAddress: '0x8731d54e9d02c286767d56ac03e8037c07e01e98',
        gasLimit: 500_000,
        pools:[
            {liquidityPoolId: 2, stakingPoolId: 1, tokenAddress: '0x29e38769f23701A2e4A8Ef0492e19dA4604Be62c', tokenSymbol: 'USDT', tokenDecimals: 6},
        ]
    },
    AVAX: {
        routerContractAddress: '0x45a01e4e04f14f7a4a6702c74187c5f6222033cd',
        stakingContractAddress: '0x8731d54e9d02c286767d56ac03e8037c07e01e98',
        gasLimit: 450_000,
        pools: [
            {liquidityPoolId: 1, stakingPoolId: 0, tokenSymbol: 'USDC', tokenAddress: '0x1205f31718499dBf1fCa446663B532Ef87481fe1', tokenDecimals: 6}
        ],
    },
    // FANTOM:{
    //     routerContractAddress: '0xaf5191b0de278c7286d6c7cc6ab6bb8a73ba2cd6',
    //     gasLimit: 600_000,
    //     pools: [],
    // }
} 


export class Stargate {
    constructor({privateKey}) {
        this.privateKey = privateKey
    }

    async checkBalance({type, tokensName}){
        console.log(`start check balance for type ${type}`)

        for (const [chainName, value] of Object.entries(chainInfoMapping)){
            const connection = await this.getConnection({chainName})

            const tokensMapping = {
                main: connection.chain.tokens,
                lp: value.pools
            }
            const tokens = tokensMapping[type]

            for (const token of tokens){
                if (tokensName.includes(token.tokenSymbol)){
                    const {tokenBalance} = await connection.getTokenInfo({tokenAddress: token.tokenAddress, chainName})
                    if (+tokenBalance > MIN_TOKEN_BALANCE){
                        return {result: true, chainName, tokenSymbol: token.tokenSymbol, tokenAddress: token.tokenAddress}
                    }
                }
            }
        }
        return {result: false}
    }

    async checkPoolBalance(){
        console.log(`start check pool balance`)

        const chains = []

        for (const [chainName, value] of Object.entries(chainInfoMapping)){
            const connection = await this.getConnection({chainName})

            for (let pool of value.pools){
                const stakingContract = new ethers.Contract(value.stakingContractAddress, stargateStakingAbi, connection.wallet)
                const {rawPoolBalance, poolBalance} = await this.getPoolBalance({stakingContract, poolId: pool.stakingPoolId, connection, tokenDecimals: pool.tokenDecimals})
                console.log(`Pool balance: ${poolBalance} for token ${pool.tokenSymbol} for address  ${connection.wallet.address} in network: ${chainName}`)
                if (poolBalance > 0){
                    chains.push(chainName)
                }
            }
        }

        if (chains.length > 1){
            console.log(`Балансе содержить более чем в одной сети: ${chains}`)
        }

        if (chains.length != 0){
            return {result: true, chains}
        }

        return {result: false, chains}
    }

    async checkTimestamp({type}){
        console.log(`start check timestamp for ${type}`)
        let walletAddress = ''
        let undefinedChain = []
        const nowTimestamp = (Date.now() / 1000).toFixed()
        console.log('nowTimestamp', nowTimestamp)
        
        for (const [chainName, value] of Object.entries(chainInfoMapping)){
            const typeMapping = {
                swap: value.routerContractAddress,
                staking: value.stakingContractAddress
            }

            const contractAddress = typeMapping[type]
            if (typeof contractAddress === 'undefined'){
                console.log(`contractAddress for network: ${chainName} not found`)
                return {result: false, undefinedChain}
            }

            const connection = await this.getConnection({chainName})
            walletAddress = connection.wallet.address

            console.log(`Start check timestamp for wallet: ${walletAddress} in network: ${chainName}`)

            const etherscan = new Etherscan({address: walletAddress})
            const lastTimestamp = await etherscan.getLastTransactionTimestamp({address: contractAddress, chainName})

            console.log('lastTimestamp', lastTimestamp)
            console.log('last timestamp + time', +lastTimestamp + TIME)

            if (typeof lastTimestamp === 'undefined'){
                undefinedChain.push(chainName)
            }

            if (lastTimestamp && +lastTimestamp + TIME > nowTimestamp){
                return {result: false, undefinedChain}
            }
        }

        return {result: true, undefinedChain}
    }

    async getConnection({chainName}){
        return new Connection(chainName, this.privateKey)
    }

    async checkAllowance({tokenAddress, connection, spenderAddress, amount, chainName}){

        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, connection.wallet)
        const rawAllowance = await tokenContract.allowance(connection.wallet.address, spenderAddress)
        const decimals = await tokenContract.decimals()
        const allowance = ethers.utils.formatUnits(rawAllowance, decimals)
        console.log('allowance', allowance)

        const rawAmount = ethers.utils.parseUnits(amount.toString(), decimals)
    
        if (allowance < amount){
            console.log('low allowance')
            let gasLimit = chainInfoMapping[chainName].gasLimit
            try{
                gasLimit = await tokenContract.estimateGas.approve(spenderAddress, rawAmount)
                console.log('gasEstimated for allowance', +gasLimit)
            } catch (e){
                console.error('Error while gas estimated')
                console.error(e.message)
            }

            const params = [spenderAddress, rawAmount]
            const status = await connection.sendTransaction({method: tokenContract.approve, params, value: 0, gasLimit, chainName})

            if (status != 1){
                return false
            }
        }

        return true
    }

    async randomSwap({undefinedChain, chainName, tokenSymbol, tokenAddress}){
        const connection = await this.getConnection({chainName})
        const {tokenBalance, tokenDecimals} = await connection.getTokenInfo({tokenAddress, chainName})
        if (+tokenBalance < MIN_TOKEN_BALANCE){
            console.error(`Balance token ${tokenSymbol} in network: ${chainName} not enough!`)
            return false
        }

        let destinationChains = []

        if (undefinedChain.length > 0){
            destinationChains = undefinedChain.filter(key => key != chainName)
        }

        if (destinationChains.length == 0){
            destinationChains = Object.keys(destinationChainMapping).filter(key => key != chainName)
        }
        console.log('destinationChains', destinationChains)
        const randomDestination = destinationChains[randomIntInRange(0, destinationChains.length - 1)]

        console.log(`run swap token: ${tokenSymbol} - token balance: ${+tokenBalance} from network: ${chainName} to network: ${randomDestination}`)

        let amountToSwap = tokenBalance
        if (AMOUNT_FROM_STAKE_STARGATE != 0 && AMOUNT_TO_STAKE_STARGATE != 0){
            amountToSwap = randomIntInRange(AMOUNT_FROM_STAKE_STARGATE, AMOUNT_TO_STAKE_STARGATE).toFixed(tokenDecimals)
        }

        const result = await this.swap({amountToSwap, chainFrom: chainName, chainTo: randomDestination, tokenAddress, tokenBalance, tokenDecimals, tokenSymbol})
        return {result, destinationChain: randomDestination}
    }

    async swap({amountToSwap, chainFrom, chainTo, tokenAddress, tokenBalance, tokenDecimals, tokenSymbol}){
        const connection = await this.getConnection({chainName: chainFrom})

        const chainInfo = chainInfoMapping[chainFrom]
        if (typeof chainInfo === 'undefined'){
            console.log(`chainInfo for network: ${chainFrom} not found`)
            return
        }
        const stargateRouterContract = new ethers.Contract(chainInfo.routerContractAddress, stargateRouterAbi, connection.wallet)

        const destinationChainId = destinationChainMapping[chainTo].chainId
        const destPoolId = destinationChainMapping[chainTo].poolId
        console.log('destinationChainId', destinationChainId)
        console.log('destPoolId', destPoolId)
        
        const fees = await stargateRouterContract.quoteLayerZeroFee(destinationChainId, 1, "0x0000000000000000000000000000000000001010", "0x", [0, 0, "0x0000000000000000000000000000000000000001"])
        const fee = fees[0]
        console.log('fee', ethers.utils.formatEther(fee))
        console.log('amountToSwap', amountToSwap)
    
        if (tokenBalance != 0 && tokenBalance >= amountToSwap){

            const amountIn = ethers.utils.parseUnits(amountToSwap, tokenDecimals) 
            console.log('amountIn', +amountIn)

            const checkAllowance = await this.checkAllowance({tokenAddress, connection, spenderAddress: chainInfo.routerContractAddress, amount: amountIn, chainName: chainFrom})
            if (!checkAllowance){
                console.log('check allowance status', checkAllowance)
                return false
            }
            const sourcePoolId = sourcePoolMapping[tokenSymbol]
            console.log('sourcePoolId', sourcePoolId)
            
            const refundAddress = connection.wallet.address
            
            console.log('amountToSwap - amountToSwap * SLIPPAGE / 1000)', (amountToSwap - amountToSwap * SLIPPAGE / 1000).toFixed(tokenDecimals))
            const amountOutMin = ethers.utils.parseUnits((amountToSwap - amountToSwap * SLIPPAGE / 1000).toFixed(tokenDecimals), tokenDecimals)
            console.log('amountOutMin', amountOutMin)
            const lzTxObj = [0, 0, '0x0000000000000000000000000000000000000001']
            const to = connection.wallet.address
            const data = '0x'

            const params = [destinationChainId, sourcePoolId, destPoolId, refundAddress, amountIn, amountOutMin, lzTxObj, to, data]

            let gasLimit = chainInfo.gasLimit
            try{
                gasLimit = await stargateRouterContract.estimateGas.swap(destinationChainId, sourcePoolId, destPoolId, refundAddress, amountIn, amountOutMin, lzTxObj, to, data, {
                    value: fee,
                });
                console.log('gasEstimated for swap', +gasLimit)
            } catch (e){
                console.error('Error while gas estimated')
                console.error(e.message)
            }

            const status = await connection.sendTransaction({method: stargateRouterContract.swap, params, value: fee, gasLimit, chainName: chainFrom})
            if (status != 1){
                return false
            }

            return true
        }
    }

    async checkLiquidity(){

    }

    async addLiquidity({chainName, tokenAddress, tokenSymbol}){
        const chainInfo = chainInfoMapping[chainName]
        const routerAddress = chainInfo.routerContractAddress
        if (typeof routerAddress === 'undefined'){
            console.log(`routerAddress for network: ${chainName} not found`)
            return
        }
    
        const connection = await this.getConnection({chainName})
        const routerContract = new ethers.Contract(routerAddress, stargateRouterAbi, connection.wallet)
    
        const {tokenBalance, tokenDecimals} = await connection.getTokenInfo({tokenAddress, chainName})

        if (+tokenBalance > MIN_TOKEN_BALANCE){
            let amount = randomIntInRange(AMOUNT_FROM_STAKE_STARGATE, AMOUNT_TO_STAKE_STARGATE)
            if (typeof amount === 'undefined' || amount === 0 || amount > +tokenBalance){
                amount = tokenBalance
            }

            console.log(`start addLiquidity in network: ${chainName} for token: ${tokenSymbol} amount: ${amount}`)

            const rawAmount = ethers.utils.parseUnits(amount.toString(), tokenDecimals)
            const checkAllowance = await this.checkAllowance({tokenAddress, connection, spenderAddress: routerAddress, amount, chainName})
            if (!checkAllowance){
                console.log('check allowance status', checkAllowance)
                return false
            }

            const pool = chainInfo.pools.find(el => el.tokenSymbol == tokenSymbol )

            if (typeof pool === 'undefined'){
                console.log(`pool not found for token: ${tokenSymbol}`)
                return false
            }

            let gasLimit = chainInfo.gasLimit
            try{
                gasLimit = await routerContract.estimateGas.addLiquidity(pool.liquidityPoolId, rawAmount, connection.wallet.address);
                console.log('gasEstimated for addLiquidity', +gasLimit)
            } catch (e){
                console.error('Error while gas estimated')
                console.error(e.message)
            }

            const params = [pool.liquidityPoolId, rawAmount, connection.wallet.address]

            const status = await connection.sendTransaction({method: routerContract.addLiquidity, params, value: 0, gasLimit, chainName})
            if (status != 1){
                return false
            }

            return true
        }
    }

    async deposit({chainName, tokenSymbol}){
        const chainInfo = chainInfoMapping[chainName]

        const stakingAddress = chainInfo.stakingContractAddress
        if (typeof stakingAddress === 'undefined'){
            console.log(`routerAddress for network: ${chainName} not found`)
            return
        }

        const pool = chainInfo.pools.find(el => el.tokenSymbol == tokenSymbol )

        if (typeof pool === 'undefined'){
            console.log(`pool not found for token: ${tokenSymbol}`)
            return false
        }    

        const connection = await this.getConnection({chainName})
        const stakingContract = new ethers.Contract(stakingAddress, stargateStakingAbi, connection.wallet)
        const {tokenBalance, rawTokenBalance} = await connection.getTokenInfo({tokenAddress: pool.tokenAddress, chainName})

        console.log('tokenBalance', tokenBalance)

        if (tokenBalance > 0){
            console.log(`start deposit in network: ${chainName} for token: ${tokenSymbol} amount: ${tokenBalance}`, )

            const checkAllowance = await this.checkAllowance({tokenAddress: pool.tokenAddress, connection, spenderAddress: stakingAddress, amount: rawTokenBalance, chainName})
            if (!checkAllowance){
                console.log('check allowance status', checkAllowance)
                return false
            }

            let gasLimit = chainInfo.gasLimit
            try{
                gasLimit = await stakingContract.estimateGas.deposit(pool.stakingPoolId, rawTokenBalance);
                console.log('gasEstimated for deposit', +gasLimit)
            } catch (e){
                console.error('Error while gas estimated')
                console.error(e.message)
            }

            const params = [pool.stakingPoolId, rawTokenBalance]

            const status = await connection.sendTransaction({method: stakingContract.deposit, params, value: 0, gasLimit, chainName})
            if (status != 1){
                return false
            }

            return true
        }
    }

    async getPoolBalance({stakingContract, poolId, connection, tokenDecimals}){
        const balance = await stakingContract.userInfo(poolId, connection.wallet.address)
        return {rawPoolBalance: balance.amount, poolBalance: ethers.utils.formatUnits(balance.amount, tokenDecimals)}
    }

    async withdrawAll(){
        for (const chainName of Object.keys(chainInfoMapping)){
            return await this.withdraw({chainName})
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
            const stakingContract = new ethers.Contract(chainInfo.stakingContractAddress, stargateStakingAbi, connection.wallet)
            const {rawPoolBalance, poolBalance} = await this.getPoolBalance({stakingContract, poolId: pool.stakingPoolId, connection, tokenDecimals: pool.tokenDecimals})
            console.log('poolBalance', poolBalance)
            if (poolBalance > 0){

                let gasLimit = chainInfo.gasLimit
                try{
                    gasLimit = await stakingContract.estimateGas.withdraw(pool.stakingPoolId, rawPoolBalance);
                    console.log('gasEstimated for withdraw', +gasLimit)
                } catch (e){
                    console.error('Error while gas estimated')
                    console.error(e.message)
                }

                const params = [pool.stakingPoolId, rawPoolBalance]

                const status = await connection.sendTransaction({method: stakingContract.withdraw, params, value: 0, gasLimit, chainName})
                if (status != 1){
                    return false
                }

                return true
            }
        }
    }

    async removeAllLiquidity(){
        for (const chainName of Object.keys(chainInfoMapping)){
            return await this.removeLiquidity({chainName})
        }
    }

    // TODO redeem remote
    async removeLiquidity({chainName}){
        const chainInfo = chainInfoMapping[chainName]
        if (typeof chainInfo === 'undefined'){
            console.log(`info for network: ${chainName} not found`)
            return false
        }
        const connection = await this.getConnection({chainName})
        const routerContract = new ethers.Contract(chainInfo.routerContractAddress, stargateRouterAbi, connection.wallet)

        for (let pool of chainInfo.pools){
            const {rawTokenBalance, tokenBalance} = await connection.getTokenInfo({tokenAddress: pool.tokenAddress, chainName})
            if (tokenBalance > 0){

                let gasLimit = chainInfo.gasLimit
                try{
                    gasLimit = await routerContract.estimateGas.instantRedeemLocal(pool.liquidityPoolId, rawTokenBalance, connection.wallet.address);
                    console.log('gasEstimated for removeLiquidity', +gasLimit)
                } catch (e){
                    console.error('Error while gas estimated')
                    console.error(e.message)
                }

                const params = [pool.liquidityPoolId, rawTokenBalance, connection.wallet.address]

                const status = await connection.sendTransaction({method: routerContract.instantRedeemLocal, params, value: 0, gasLimit, chainName})
                if (status != 1){
                    return false
                }

                return true

                // try{
                //     const tx = await routerContract.instantRedeemLocal(pool.liquidityPoolId, rawTokenBalance, connection.wallet.address, {
                //         'from': connection.wallet.address,
                //         'value': 0,
                //         'gasLimit': chainInfo.gasLimit,
                //         'gasPrice': await connection.getGasPrice(),
                //         'nonce': await connection.getNonce()
                //     })
    
                //     console.log('tx', tx)
                //     const receipt = await tx.wait();
                //     console.log("receipt: ", receipt);
                // } catch (e){
                //     console.log(`Error while send transaction`, e.message)
                // }
            }
        }
    }
}