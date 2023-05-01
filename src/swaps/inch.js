import { ethers } from "ethers"
import axios from 'axios'
import randomFloat from 'random-float'

import { Connection } from "../helpers/provider.js"
import { NETWORKS, ERC20_ABI, DEFAULT_ETH_TOKEN } from "../../config/constants.js"
import { AMOUNT_FROM, AMOUNT_TO, SWAP_ALL_BALANCE } from "../../config/config.js"
import { randomInt } from "../helpers/common.js"

export class Inch {
    constructor({chainName, privateKey, rpcType, fromToken = DEFAULT_ETH_TOKEN, toTokenAddress}) {
        this.chainName = chainName
        this.privateKey = privateKey
        this.chain = NETWORKS[chainName]
        this.connection = new Connection(chainName, privateKey, rpcType)
        this.fromToken = fromToken
        this.toTokenAddress = toTokenAddress
    }

    async getNonce(){
        return  await this.connection.wallet.getTransactionCount() + 1
    }

    apiRequestUrl(methodName, queryParams) {
        const apiBaseUrl = 'https://api.1inch.io/v5.0/' + this.chain.chainId;
        return apiBaseUrl + methodName + '?' + (new URLSearchParams(queryParams)).toString();
    }

    async healthCheck() {
        const url = this.apiRequestUrl('/healthcheck')
        const response = await axios({
            method: 'get',
            url,
            responseType: 'json'
        })
        return response.status
    }

    async checkAllowance() {
        const url = this.apiRequestUrl('/approve/allowance', {tokenAddress: this.fromToken.address, walletAddress: this.connection.wallet.address})
        const response = await axios({
            method: 'get',
            url,
            responseType: 'json'
        })
        return response.data.allowance
    }

    // not use
    async broadCastRawTransaction(rawTransaction) {
        const url = 'https://tx-gateway.1inch.io/v1.1/' + this.chain.chainId + '/broadcast';

        const response = await axios({
            method: 'post',
            body: JSON.stringify({rawTransaction}),
            headers: {'Content-Type': 'application/json'},
            url,
            responseType: 'json'
        })

        return response.data.transactionHash
    }

    // not use
    async signAndSendTransaction(wallet, transaction, chain) {
        const web3 = new Web3(chain.rpc)
        const {rawTransaction} = await web3.eth.accounts.signTransaction(transaction, wallet.privateKey);

        return await broadCastRawTransaction(chain, rawTransaction);
    }

    //TODO
    async buildTxForApproveTradeWithRouter(amount) {
        const url = apiRequestUrl('/approve/transaction', amount ? {tokenAddress: this.fromToken.address, amount} : {tokenAddress: this.fromToken.address})

        const response = await axios({
            method: 'get',
            url,
            responseType: 'json'
        })

        console.log('response', response)

        // const transaction = await fetch(url).then(res => res.json());

        // const gasLimit = await web3.eth.estimateGas({
        //     ...transaction,
        //     from: walletAddress
        // });

        // return {
        //     ...transaction,
        //     gas: gasLimit
        // };
    }

    async buildTxForSwap(swapParams) {
        const url = this.apiRequestUrl('/swap', swapParams);
        const response = await axios({
            method: 'get',
            url,
            responseType: 'json'
        })
        return response.data.tx
    }

    async swap(){
        console.log('fromToken', this.fromToken)
        console.log('toTokenAddress', this.toTokenAddress)
        const rawAmount = randomFloat(AMOUNT_FROM, AMOUNT_TO)
        console.log('rawAmount', rawAmount.toFixed(16).toString())
        const amount = ethers.utils.parseUnits(rawAmount.toFixed(16).toString(), this.fromToken.decimals)

        const swapParams = {
            fromTokenAddress: this.fromToken.address,
            toTokenAddress: this.toTokenAddress,
            amount,
            fromAddress: this.connection.wallet.address,
            slippage: 1,
            disableEstimate: false,
            allowPartialFill: false,
        };
        
        const allowance = await this.checkAllowance();
        console.log('Allowance: ', allowance);
    
        //TODO
        if (allowance < rawAmount){
            const transactionForSign = await this.buildTxForApproveTradeWithRouter(amount);
            console.log('Transaction for approve: ', transactionForSign);
    
            const approveTxHash = await signAndSendTransaction(wallet, transactionForSign);
            console.log('Approve tx hash: ', approveTxHash)
        }
        
        const swapTransaction = await this.buildTxForSwap(swapParams);
        
        swapTransaction.gasLimit = swapTransaction.gas
        swapTransaction.nonce = await this.getNonce()
        delete swapTransaction.gas
        console.log('Transaction for swap: ', swapTransaction);

        const tx = await this.connection.wallet.sendTransaction(swapTransaction);
        console.log(`txInfo for token transfer approval:`, tx);

        const receipt = await tx.wait();
        console.log(`receipt for token transfer approval:`, receipt);
    
    }

}