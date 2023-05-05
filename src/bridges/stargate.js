import { ethers } from "ethers"
import { USDT_BSC_ADDRESS, USDT_ARBITRUM_ADDRESS, STARGATE_FINANCE_ROUTER_ARBITRUM, STARGATE_FINANCE_ROUTER_BNB } from "../../config/constants.js";
import { stargateRouterAbi } from "../../abi/syncSwap/stargateRouter.js";
import { stargateStakingAbi } from "../../abi/stargateStakingAbi.js";
import { Connection } from "../helpers/provider.js";
import { ERC20_ABI } from "../../config/constants.js";
import { SLIPPAGE, AMOUNT_FROM_STAKE_STARGATE, AMOUNT_TO_STAKE_STARGATE } from "../../config/config.js";
import { randomInt } from "../helpers/common.js";
import { sendMessageToTelegram } from "../telegramBot.js";

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_GAS_LIMIT = 350000

const destinationChainIdMapping = {
    ARBITRUM: 110,
    BSC: 102
} 

const chainInfoMapping = {
    ARBITRUM: {
        swapContractAddress: '0x53Bf833A5d6c4ddA888F69c22C88C9f356a41614',
        stakingContractAddress: '0xea8dfee1898a7e0a59f7527f076106d7e44c2176',
        gasLimit: 3_000_000,
        pools: [
            {poolId: 1, tokenName: 'USDT', LPTokenAddress: '0xB6CfcF89a7B22988bfC96632aC2A9D6daB60d641', tokenDecimals: 6}
        ]

    },
    BSC: {swapContractAddress: '0x4a364f8c717caad9a442737eb7b8a55cc6cf18d8', gasLimit: 350_000}
} 


export class Stargate {
    constructor({privateKey}) {
        this.privateKey = privateKey
        // this.privateKey = privateKey
        // this.chain = NETWORKS[chainName]
        // this.connection = new Connection(chainName, privateKey, rpcType)
        // this.fromToken = fromToken
        // this.toTokenAddress = toTokenAddress
    }

    async getConnection({chainName}){
        return new Connection(chainName, this.privateKey )
    }

    async checkAllowance({tokenAddress, connection, spenderAddress, rawAmount, amount}){
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, connection.wallet)
        const rawAllowance = await tokenContract.allowance(connection.wallet.address, spenderAddress)
        const allowance = ethers.utils.formatUnits(rawAllowance, await tokenContract.decimals())
        console.log('rawAllowance', rawAllowance)
        console.log('allowance', allowance)
    
        if (allowance < amount){
            console.log('low allowance')
            const response = await tokenContract.approve(spenderAddress, rawAmount)
            const receipt = await response.wait();
    
            console.log("receipt for allowance: ", receipt);
        }
    }

    async swap({amountToSwap, chainFrom, chainTo}){
        const connection = new Connection(chainFrom, PRIVATE_KEY, 'DEFAULT')
        const stargateRouterContract = new ethers.Contract(STARGATE_FINANCE_ROUTER_BNB, stargateRouterAbi, connection.wallet)
        const tokenContract = new ethers.Contract(USDT_BSC_ADDRESS, ERC20_ABI, connection.wallet)
        const tokenDecimal = await tokenContract.decimals()
    
        const destinationChainId = Object.entries(destinationChainIdMapping).filter(([key, value]) => key == chainTo)[0][1]
        console.log('destinationChainId', destinationChainId)
        const fees = await stargateRouterContract.quoteLayerZeroFee(destinationChainId, 1, "0x0000000000000000000000000000000000001010", "0x", [0, 0, "0x0000000000000000000000000000000000000001"])
        const fee = fees[0]
        console.log('fee', ethers.utils.formatEther(fee))
    
        const tokenBalance = await connection.getTokenBalance(tokenContract.address)
    
        console.log(amountToSwap )
        if (typeof amountToSwap === 'undefined' || amountToSwap === 0){
            amountToSwap = tokenBalance
        }
        console.log('amountToSwap', amountToSwap)
        const allowance = await tokenContract.allowance(connection.wallet.address, STARGATE_FINANCE_ROUTER_BNB)
        console.log('allowance', ethers.utils.formatUnits(allowance, tokenDecimal))
    
        console.log(amountToSwap)
        if (allowance < amountToSwap){
            console.log('low allowance')
            return
            const response = await tokenContract.approve(STARGATE_FINANCE_ROUTER_BNB, ethers.utils.parseUnits(amountToSwap, tokenDecimal))
            const receipt = await response.wait();
    
            console.log("receipt: ", receipt);
        }
    
    
        if (tokenBalance != 0 && tokenBalance >= amountToSwap){
            console.log(await connection.getNonce())
            console.log(await connection.getGasPrice())
    
            const sourcePoolId = 2
            const destPoolId = 2
            const refundAddress = connection.wallet.address
            const amountIn = amountToSwap
            const amountOutMin = amountToSwap - (amountToSwap * SLIPPAGE) / 1000
            const lzTxObj = [0, 0, '0x0000000000000000000000000000000000000001']
            const to = connection.wallet.address
            const data = '0x'
    
            const tx = await stargateRouterContract.swap(destinationChainId, sourcePoolId, destPoolId, refundAddress, amountIn, amountOutMin.toString(), lzTxObj, to, data, 
                {
                    'from': connection.wallet.address,
                    'value': fee,
                    'gasLimit': BSC_GAS_LIMIT,
                    'gasPrice': await connection.getGasPrice(),
                    'nonce': await connection.getNonce()
                })
            const receipt = await tx.wait();
    
            console.log("receipt: ", receipt);
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
    
    
        const amount = randomInt(AMOUNT_FROM_STAKE_STARGATE, AMOUNT_TO_STAKE_STARGATE)
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

    async removeLiquidity(){

    }

    async withdrawAll({chainName}){
        const connection = await this.getConnection({chainName})
        const chainInfo = chainInfoMapping[chainName]
        if (typeof chainInfo === 'undefined'){
            console.log(`info for network: ${chainName} not found`)
            return
        }

        const stakingContractAddress = chainInfo.stakingContractAddress
        for (let pool of chainInfo.pools){
            console.log(pool)
            const stakingContract = new ethers.Contract(stakingContractAddress, stargateStakingAbi, connection.wallet)
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
}

 
const stargate = new Stargate({privateKey: PRIVATE_KEY})
// stargate.deposit({chainName: "ARBITRUM"})
stargate.withdrawAll({chainName: "ARBITRUM"})

// addLiquidity({chainName: "ARBITRUM", tokenAddress: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'})

// swap({
//     chainFrom: 'BSC',
//     chainTo: 'ARBITRUM',
// })