// import {Uniswap} from 'uniswap/uniswap.js'
import * as zksync from "zksync-web3";
import { ethers } from "ethers"

import { Connection } from "../src/helpers/provider.js"
import { Inch } from "../src/swaps/inch.js";
import { readAccountsFromTextFile } from "../src/helpers/readers.js"
import { NETWORKS } from "../config/constants.js"

const CHAIN_NAME = 'ETHEREUM_GOERLI'
const AMOUNT = 0.1

async function main(){

    console.log('Start script')

    // Currently, only one environment is supported.
    const zkSyncProvider = new zksync.Provider("https://testnet.era.zksync.dev");


    const accounts = readAccountsFromTextFile()

    for (let account of accounts) {
        if (account.address && account.privateKey){
            const ethConnection = new Connection(CHAIN_NAME, account.privateKey)
            await ethConnection.getGasPrice()
            const ethBalance = await ethConnection.getNativeBalance()
            const zkSyncWallet = new zksync.Wallet(account.privateKey, zkSyncProvider, ethConnection.provider);

            const committedEthBalance = await zkSyncWallet.getBalance(zksync.utils.ETH_ADDRESS);
            console.log('start committedEthBalance', ethers.utils.formatEther(committedEthBalance))

            const finalizedEthBalance = await zkSyncWallet.getBalance(zksync.utils.ETH_ADDRESS, "finalized");
            console.log('start finalizedEthBalance', ethers.utils.formatEther(finalizedEthBalance))


            if (ethBalance > AMOUNT && committedEthBalance < AMOUNT && finalizedEthBalance < AMOUNT){
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
            const inch = new Inch({chainName: 'ZK_SYNC', privateKey: account.privateKey, rpcType: 'DEFAULT', toTokenAddress: NETWORKS['ZK_SYNC'].tokens[0].address})
            const inchStatus = await inch.healthCheck()
            if (inchStatus == 200){
                await inch.swap()

            } else{
                console.log(`inchStatus: ${inchStatus}`)
            }
            
        }
    }

}

main()