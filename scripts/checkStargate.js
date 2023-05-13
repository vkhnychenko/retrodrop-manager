// Проверяем что за последнюю неделю не было транзакций(проверяем контракт swap)
// Если есть токены в стейкинге, сначала выводим их и выводим из ликвидности
// Затем делаем swap на другую сеть выбранную рандомно из списка
// После обмена, добавляем ликвидность и стейкаем токены в сети, куда совершили перевод

import { Stargate } from "../src/stargate.js"
import { readAccountsFromTextFile } from "../src/helpers/readers.js"
import { sleep, randomIntInRange } from "../src/helpers/common.js"
import { IS_SLEEP, SLEEP_FROM, SLEEP_TO } from "../config/config.js"

const accounts = readAccountsFromTextFile()

async function main(){
    for (let account of accounts) {
        if (account.privateKey){
            const stargate = new Stargate({privateKey: account.privateKey})

            const timestampIsReady = await stargate.checkTimestamp()
            if (!timestampIsReady){
                continue
            }
            const balanceIsReady = await stargate.checkBalance()
            if (!balanceIsReady){
                continue
            }
            
            // await stargate.randomSwap()
            if (IS_SLEEP) {
                let sle = randomIntInRange(SLEEP_FROM, SLEEP_TO);
                console.log(`Задержка ${sle}с..`)
                await sleep(sle * 1000)
            }
        }
    }
}

main()