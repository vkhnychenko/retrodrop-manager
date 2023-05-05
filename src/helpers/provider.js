import { ethers } from "ethers"
import { NETWORKS, ERC20_ABI } from "../../config/constants.js"
import { INFURA_API_KEY } from "../../config/config.js"

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
        const balance = ethers.utils.formatEther(await this.provider.getBalance(this.wallet.address))
        console.log(`native balance for address: ${this.wallet.address} - ${balance}`, )
        
        return balance
    }

    async getTokenInfo(tokenAddress){

        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider)
        const tokenDecimals = await tokenContract.decimals()
        const tokenSymbol = await tokenContract.symbol()
        const rawTokenBalance = await tokenContract.balanceOf(this.wallet.address)
        console.log(`${tokenSymbol} balance: ${ethers.utils.formatUnits(rawTokenBalance, tokenDecimals)}`)
      
        return {tokenSymbol, tokenDecimals, rawTokenBalance}
    }

    async getNonce(){
        return await this.wallet.getTransactionCount()
    }

    async sendTransaction({}){

    }
}