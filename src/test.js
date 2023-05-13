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
    const test = new Test({privateKey: 131231})
    console.log(test.__proto__)
    await execute({contract: test, method: test.getConnection})
}

main()