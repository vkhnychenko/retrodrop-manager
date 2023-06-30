import { sleep, newSleep } from "./src/helpers/common.js"

const chainInfoMapping = {
    OPTIMISM: {
        routerContractAddress: '0xb0d502e938ed5f4df2e681fe6e419ff29631d62b',
        stakingContractAddress: '0x4dea9e918c6289a52cd469cac652727b7b412cd2',
        gasLimit: 600_000,
        pools: [
            {liquidityPoolId: 1, stakingPoolId: 0 , tokenSymbol: 'USDC', LPTokenAddress: '0xDecC0c09c3B5f6e92EF4184125D5648a66E35298', tokenDecimals: 6}
        ],
    },
    ARBITRUM: {
        routerContractAddress: '0x53Bf833A5d6c4ddA888F69c22C88C9f356a41614',
        stakingContractAddress: '0xea8dfee1898a7e0a59f7527f076106d7e44c2176',
        gasLimit: 3_000_000,
        pools: [
            {liquidityPoolId: 2, stakingPoolId: 1, tokenSymbol: 'USDT', LPTokenAddress: '0xB6CfcF89a7B22988bfC96632aC2A9D6daB60d641', tokenDecimals: 6}
        ],
    },
    BSC: {
        routerContractAddress: '0x4a364f8c717caad9a442737eb7b8a55cc6cf18d8',
        stakingContractAddress: '0x3052a0f6ab15b4ae1df39962d5ddefaca86dab47',
        gasLimit: 350_000,
        pools: [
            {liquidityPoolId: 2, stakingPoolId: 0, tokenSymbol: 'USDT', LPTokenAddress: '0x9aA83081AA06AF7208Dcc7A4cB72C94d057D2cda', tokenDecimals: 6},
        ],
    },
}

class Test {
    constructor({privateKey}) {
        this.privateKey = privateKey
        // this.privateKey = privateKey
        // this.chain = NETWORKS[chainName]
        // this.connection = new Connection(chainName, privateKey, rpcType)
        // this.fromToken = fromToken
        // this.toTokenAddress = toTokenAddress
    }

    getConnection ({param}){
        console.log('execute')
        console.log('param', param)
        return param
    }
}


async function execute({contract, method, param}){
    method({param:234})
    contract.call(methodName, {param:234})
    console.log('contract', contract)
    console.log('methodName', methodName)
    console.log(await contract.getConnection({param: 123}))
    Object.call(methodName)
    console.log(contract.__proto__)
}

async function main(){
    const chainInfo = chainInfoMapping['ARBITRUM']
    const found = chainInfo.pools.find(el => el.tokenSymbol == 'USDT' )
    console.log(chainInfo)
    await newSleep()
    console.log('found', found)
    // const a = [1,2,34,5,6,6,7,7,75654,2]
    // const b = a.filter(key => key != 7)
    // console.log(b)
    // const test = new Test({privateKey: 131231})
    // console.log(test.__proto__)
    // await execute({contract: test, method: test.getConnection})
}

main()