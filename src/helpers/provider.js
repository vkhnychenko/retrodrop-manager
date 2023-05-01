import { ethers } from "ethers"
import { NETWORKS, ERC20_ABI } from "../../config/constants.js"
import { INFURA_API_KEY } from "../../config/config.js"

export class Connection {
    constructor(chainName, privateKey, rpcType = 'INFURA', rpcKey = INFURA_API_KEY) {
        this.rpcType = rpcType
        this.chainName = chainName
        this.rpcKey = rpcKey
        this.privateKey = privateKey
        this.chain = NETWORKS[chainName]
    }

    get rpc(){
        if (this.rpcType == 'INFURA'){
            return this.chain.infuraRpc.replace('api_key', this.rpcKey)
        } else if (this.rpcType == 'ALCHEMY') {
            return this.chain.alchemyRpc.replace('api_key', this.rpcKey)
        } else {
            return this.chain.defaultRpc
        }
    }

    get provider(){
        return new ethers.providers.StaticJsonRpcProvider(this.rpc) 
    }

    get wallet(){
        return new ethers.Wallet(this.privateKey, this.provider)
    }

    async getGasPrice(){
        return ethers.utils.formatUnits(await this.provider.getGasPrice(), 'gwei')
    }

    async getNativeBalance(){
        const balance = ethers.utils.formatEther(await this.provider.getBalance(this.wallet.address))
        console.log(`native balance for address: ${this.wallet.address} - ${balance}`, )
        
        return balance
    }

    async getTokenBalance(tokenAddress){

        const currencyContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider)
        const decimals = await currencyContract.decimals()
        const symbol = await currencyContract.symbol()
        const balance = ethers.utils.formatUnits(await currencyContract.balanceOf(this.wallet.address), decimals)
        console.log(`${symbol} balance: ${balance}`)
      
        return balance
      }
}