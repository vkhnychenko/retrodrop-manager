// import {Uniswap} from 'uniswap/uniswap.js'
import * as zksync from "zksync-web3";
import { ethers } from "ethers"

import { Connection } from "../src/helpers/provider.js"
import { Inch } from "../src/swaps/inch.js";
import { readAccountsFromTextFile } from "../src/helpers/readers.js"
import { NETWORKS } from "../config/constants.js"
import { CHAIN_NAME, RPC_TYPE, AMOUNT_FROM, AMOUNT_TO, MIN_AMOUNT_BALANCE_FOR_ZKSYNC_BRIDGE, MIN_ETHEREUM_GAS_PRICE } from "../config/config.js";

async function main(){

    console.log('Start script')

    const zkSyncNetwork = NETWORKS['ZK_SYNC']
    // console.log(zkSyncNetwork)

    // Currently, only one environment is supported.
    const zkSyncProvider = new zksync.Provider(zkSyncNetwork.rpc);


    const accounts = readAccountsFromTextFile()

    for (let account of accounts) {
        if (account.address && account.privateKey){
            const ethConnection = new Connection('ETHEREUM', account.privateKey, RPC_TYPE)
            const {gasPrice}  = await ethConnection.provider.getFeeData()
            console.log('ethereum gasPrice', ethers.utils.formatUnits(gasPrice, 'gwei'))
            const {rawNativeBalance, nativeBalance: ethBalance} = await ethConnection.getNativeBalance()
            console.log('ethBalance', ethBalance)

            if (ethers.utils.formatUnits(gasPrice, 'gwei') > MIN_ETHEREUM_GAS_PRICE){
                console.log('Ethereum gas is high!')
                return false
            }


            const zkSyncWallet = new zksync.Wallet(account.privateKey, zkSyncProvider, ethConnection.provider);

            const committedEthBalance = await zkSyncWallet.getBalance(zksync.utils.ETH_ADDRESS);
            console.log('start committedEthBalance', ethers.utils.formatEther(committedEthBalance))

            const finalizedEthBalance = await zkSyncWallet.getBalance(zksync.utils.ETH_ADDRESS, "finalized");
            console.log('start finalizedEthBalance', ethers.utils.formatEther(finalizedEthBalance))


            if (ethBalance > MIN_AMOUNT_BALANCE_FOR_ZKSYNC_BRIDGE && committedEthBalance < MIN_AMOUNT_BALANCE_FOR_ZKSYNC_BRIDGE && finalizedEthBalance < MIN_AMOUNT_BALANCE_FOR_ZKSYNC_BRIDGE){
                const deposit = await zkSyncWallet.deposit({
                    token: zksync.utils.ETH_ADDRESS,
                    amount: ethers.utils.parseEther(AMOUNT.toString()),
                });

                // Await processing of the deposit on L1
                const ethereumTxReceipt = await deposit.waitL1Commit();
                console.log('ethereumTxReceipt', ethereumTxReceipt)

                // Await processing the deposit on zkSync
                const depositReceipt = await deposit.wait();
                console.log('depositReceipt', depositReceipt)

                // Retrieving the current (committed) zkSync ETH balance of an account
                const committedEthBalance = await zkSyncWallet.getBalance(zksync.utils.ETH_ADDRESS);
                console.log('committedEthBalance', ethers.utils.formatEther(committedEthBalance))

                // Retrieving the ETH balance of an account in the last finalized zkSync block.
                const finalizedEthBalance = await zkSyncWallet.getBalance(zksync.utils.ETH_ADDRESS, "finalized");
                console.log('finalizedEthBalance', ethers.utils.formatEther(finalizedEthBalance))


            // await connection.getTokenBalance(NETWORKS[CHAIN_NAME].tokens[0].address)
            }
            // const inch = new Inch({chainName: 'ZK_SYNC', privateKey: account.privateKey, rpcType: 'DEFAULT', toTokenAddress: NETWORKS['ZK_SYNC'].tokens[0].address})
            // const inchStatus = await inch.healthCheck()
            // if (inchStatus == 200){
            //     await inch.swap()

            // } else{
            //     console.log(`inchStatus: ${inchStatus}`)
            // }
            
        }
    }

}

main()