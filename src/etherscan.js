import axios from 'axios'
import { NETWORKS } from "../config/constants.js";

export class Etherscan {
    constructor({address}) {
        this.address = address
    }

    async getLastTransactionTimestamp({address, chainName}){
        const txList = await this.getListTransactions({chainName})
        const txn = txList.filter((obj) => obj.to == address.toLowerCase())
        const lastTx = txn[txn.length - 1]
        console.log('lastTx', lastTx)
        if (typeof lastTx === 'undefined'){
            return
        }
        return lastTx.timeStamp
    }

    async getListTransactions({chainName}){
        const network = NETWORKS[chainName]
        if (typeof network === 'undefined'){
            console.log(`info for network: ${chainName} not found`)
            return
        }

        try{
            
            const queryParams = {
                'apikey': network.explorerApiKey,
                'module': 'account',
                'action': 'txlist',
                'address': this.address,
                'startblock': 0, 
                'endblock': 99999999, 
                'sort': 'asc'
            }
            const url = network.explorerApiUrl + '?' + (new URLSearchParams(queryParams)).toString()

            const response = await axios({
                method: 'get',
                url,
                responseType: 'json'
            })
            // console.log(response)
            // console.log(response.data.result)
            return response.data.result
        } catch (e){
            console.log(e)
            console.log(`getListTransactions`, e.message)
        }
    }
}

// const etherscan = new Etherscan({address: '0xbf76c825291DBd8005De26dD31A56562411057a1'})
// // await etherscan.getListTransactions({chainName: 'ARBITRUM'})
// await etherscan.findTimeLastTransaction({address: '0x53Bf833A5d6c4ddA888F69c22C88C9f356a41614', chainName: 'ARBITRUM'})