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
        // TODO
        // if (this.rpcType == 'INFURA'){
        //     return this.chain.infuraRpc.replace('api_key', this.rpcKey)
        // } else if (this.rpcType == 'ALCHEMY') {
        //     return this.chain.alchemyRpc.replace('api_key', this.rpcKey)
        // } else {
        //     return this.chain.defaultRpc
        // }
        return this.chain.rpc
    }

    get provider(){
        return new ethers.providers.StaticJsonRpcProvider(this.rpc) 
    }

    get wallet(){
        return new ethers.Wallet(this.privateKey, this.provider)
    }

    async getGasPrice(){
        const gasPrice = await this.provider.getGasPrice()
        console.log('gasPrice', ethers.utils.formatUnits(gasPrice, 'gwei'))
        return gasPrice
    }

    async getNativeBalance(){
        const rawNativeBalance = await this.provider.getBalance(this.wallet.address)
        const nativeBalance = ethers.utils.formatEther(rawNativeBalance)
        console.log(`native balance for address: ${this.wallet.address} - ${nativeBalance}`, )
        
        return {rawNativeBalance, nativeBalance}
    }

    async getTokenInfo(tokenAddress){

        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider)
        const tokenDecimals = await tokenContract.decimals()
        const tokenSymbol = await tokenContract.symbol()
        const rawTokenBalance = await tokenContract.balanceOf(this.wallet.address)
        const tokenBalance = ethers.utils.formatUnits(rawTokenBalance, tokenDecimals)
        console.log(`${tokenSymbol} balance: ${tokenBalance} for address: ${this.wallet.address}`)
      
        return {tokenSymbol, tokenDecimals, rawTokenBalance, tokenBalance}
    }

    async getNonce(){
        return await this.wallet.getTransactionCount()
    }

    async sendTransaction({ method, params, value, gasLimit, chainName }){
        console.log('params', ...params)
        const gasPrice = await this.getGasPrice()
        const nonce = await this.getNonce()
        
        const {rawNativeBalance, nativeBalance} = await this.getNativeBalance()
        console.log('gasLimit', gasLimit)
        const needGas = gasPrice * gasLimit * 1.1 + +value
        console.log('raw native balance', +rawNativeBalance )
        console.log('needGas', needGas )
        if (+rawNativeBalance < needGas){
            console.log('Gas not enough')
            await sendMessageToTelegram(`Недостаточно баланса для оплаты газа в сети ${chainName} для адреса ${this.wallet.address} - текущий баланс ${nativeBalance} - необходимо для транзакции: ${ethers.utils.formatEther(needGas)}`)
            return
        }
        console.log(`Start transaction for wallet: ${this.wallet.address} in network: ${chainName}, gas: ${gasPrice}, gasLimit: ${gasLimit} - nonce: ${nonce}`)
        try{
            const tx = await method(...params, {
                'from': this.wallet.address,
                value,
                // gasLimit,
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