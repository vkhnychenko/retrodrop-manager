import { ethers } from "ethers"
import { NETWORKS, ERC20_ABI } from "../../config/constants.js"
import { INFURA_API_KEY } from "../../config/config.js"
import { sendMessageToTelegram } from "../telegramBot.js"

export class Connection {
    constructor(chainName, privateKey, rpcType = 'DEFAULT', rpcKey = INFURA_API_KEY) {
        this.rpcType = rpcType
        this.chainName = chainName
        this.rpcKey = rpcKey
        this.privateKey = privateKey
        this.chain = NETWORKS[chainName]
    }

    get rpc(){
        return this.chain.rpc
    }

    get provider(){
        return new ethers.providers.StaticJsonRpcProvider(this.rpc) 
    }

    get wallet(){
        return new ethers.Wallet(this.privateKey, this.provider)
    }

    async getNativeBalance(){
        const rawNativeBalance = await this.provider.getBalance(this.wallet.address)
        const nativeBalance = ethers.utils.formatEther(rawNativeBalance)
        console.log(`native balance for address: ${this.wallet.address} - ${nativeBalance}`, )
        
        return {rawNativeBalance, nativeBalance}
    }

    async getTokenInfo({tokenAddress, chainName}){

        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider)
        const tokenDecimals = await tokenContract.decimals()
        const tokenSymbol = await tokenContract.symbol()
        const rawTokenBalance = await tokenContract.balanceOf(this.wallet.address)
        const tokenBalance = ethers.utils.formatUnits(rawTokenBalance, tokenDecimals)
        console.log(`${tokenSymbol} balance: ${tokenBalance} for address: ${this.wallet.address} in network: ${chainName}`)
      
        return {tokenSymbol, tokenDecimals, rawTokenBalance, tokenBalance}
    }

    async sendTransaction({ method, params, value, gasLimit, chainName }){
        const {gasPrice}  = await this.provider.getFeeData()
        const nonce =  await this.wallet.getTransactionCount()

        console.log(`Start transaction for wallet: ${this.wallet.address} in network: ${chainName}, gas: ${gasPrice}, gasLimit: ${gasLimit} - nonce: ${nonce}`)
        console.log('params', ...params)

        const {rawNativeBalance, nativeBalance} = await this.getNativeBalance()
        console.log('gasLimit', gasLimit)
        console.log('gasPrice', gasPrice)
        const needGas = ((gasPrice * gasLimit + +value) * 1.05).toFixed()
        console.log('raw native balance', +rawNativeBalance )
        console.log('needGas', needGas )
        if (+rawNativeBalance < needGas){
            console.log('Gas not enough')
            await sendMessageToTelegram(`Недостаточно баланса для оплаты газа в сети ${chainName} для адреса ${this.wallet.address} - текущий баланс ${nativeBalance} - необходимо для транзакции: ${ethers.utils.formatEther(needGas)}`)
            return 0
        }
        console.log(`Start transaction for wallet: ${this.wallet.address} in network: ${chainName}, gas: ${gasPrice}, gasLimit: ${gasLimit} - nonce: ${nonce}`)
        try{
            const tx = await method(...params, {
                'from': this.wallet.address,
                value,
                gasLimit,
                gasPrice,
                nonce
            })
            console.log('tx', tx)
            const receipt = await tx.wait();
            console.log("receipt: ", receipt);
            console.log("status: ", receipt.status);
            return receipt.status
        } catch(e){
            console.log(`Error while send transaction`, e.message)
            await sendMessageToTelegram(`Ошибка при выполнении транзакции с параметрами ${params} для адреса ${this.wallet.address} в сети ${chainName}`)
        }
    }
}