import ethers from 'ethers';
 import snapshot from '@snapshot-labs/snapshot.js';
 import fetch from 'node-fetch'
 import { exit } from 'process';
 import * as fs from 'fs';
 import * as path from 'path';
 import { fileURLToPath } from 'url';
 import {createWallet} from '../common/providers.js'
 import {importPrivateKeys, importProps} from '../common/readers.js'
 import {insertData, getData} from '../common/database.js'
 
 const version = '1.1.0';
 const __filename = fileURLToPath(import.meta.url);
 const __dirname = path.dirname(__filename);
 const databaseName = 'snapshot'
 const collectionName = 'result'
 
 // Базовые переменные
 
 const rand_mode = 0; // 0 => стандартный, 1 => рандомная отправка варианта
 const random_min = 1; // минимальный номер в голосовании
 const random_max = 3; // максимальный номер в голосовании
 const isSleep = true; // задержка перед отправкой, нужна ли? изменить на true, если нужна
 const sleep_from = 100; // от 3 секунд
 const sleep_to = 200; // до 5 секунд
 const isPropList = true; // кастомный список проползалов
 const type_voting = 1; // 0 => стандартный, 1 => approval
 let isParseProps = false;



/**
 * Запись в итоговый результат
 * @param {String} address
 * @param {String} result
 * @returns
 */

const add_result = (address, result) => pretty_result.push({'Адрес': address, 'Результат': result});

/**
 * Случайное min/max целое значение
 * @param {Integer} min 
 * @param {Integer} max 
 * @returns Случайное число
 */

const randomIntInRange = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Повторная отправка действия
 * @param {String} address адрес
 * @param {Arrow function} operation стрелочная функция
 * @param {Integer} delay задержка в милли секундах
 * @param {Integer} retries количество повторов
 * @returns Promise
 */

// const retryOperation = (address, operation, delay, retries) => new Promise((resolve, reject) => {
//     return operation
//     .then(resolve)
//     .catch((reason) => {
//         if (retries > 0) {
//         console.log(`(Ошибка) ${address} => повторная отправка действия, задержка: ${delay}с, осталось попыток: ${retries - 1}`);
//         return wait(delay*1000)
//             .then(retryOperation.bind(null, address, operation, delay, retries - 1))
//             .then(resolve)
//             .catch(reject);
//         }
//         return reject(reason);
//     });
// });

/**
 * Голосование
 * @param {Wallet} wallet 
 * @param {String} address
 * @param {String} prop
 * @returns Promise
 */

// const voteSnap = (ethWallet, address, prop) => new Promise(async (resolve, reject) => {
//     await client.vote(ethWallet, address, {
//         space: project,
//         proposal: prop,
//         type: type_voting == 0 ? 'single-choice' : 'approval',
//         choice: rand_mode == 0 ? type_voting == 0 ? vote : Array.isArray(vote) ? vote : [vote] : type_voting == 0 ? randomIntInRange(random_min, random_max) : [randomIntInRange(random_min, random_max)],
//         reason: '',
//         app: 'snapshot'
//     }).then((result) => {
//         if (result.hasOwnProperty('id')) {
//             console.log(`(Голосование) ${address} => голос засчитан`);
//             add_result(address, 'засчитано');
//         } else {
//             console.log(`(Голосование) ${address} =>`);
//             console.dir(result);
//             add_result(address, 'неизвестно');
//         }
//         resolve();
//     }).catch((err) => {
//         if (typeof err.error_description !== 'string') {
//             console.log(`(Голосование) ${address} => ошибка "${err.error}":`);
//             console.dir(err.error_description);
//         } else {
//             console.log(`(Голосование) ${address} => ошибка "${err.error}": ${err.error_description}`);
//         }
//         add_result(address, `${err.error}: ${err.error_description}`);
//         ((typeof err.error_description === 'string' && (err.error_description.includes('many') || err.error_description.includes('failed'))) || typeof err.error_description !== 'string') ? reject() : resolve();
//     });
// });

/**
 * Подписка
 * @param {Wallet} wallet 
 * @param {String} address
 * @returns Promise
 */

// const subSnap = (ethWallet, address) => new Promise(async (resolve, reject) => {
//     await client.follow(ethWallet, address, {
//         space: project
//     }).then((result) => {
//         if (result.hasOwnProperty('id')) {
//             console.log(`(Подписка) ${address} => вы подписались`);
//         } else {
//             console.log(`(Подписка) ${address} =>`);
//             console.dir(result);
//         }
//         resolve();
//     }).catch((err) => {
//         if (typeof err.error_description !== 'string') {
//             console.log(`(Подписка) ${address} => ошибка "${err.error}":`);
//             console.dir(err.error_description);
//         } else {
//             console.log(`(Подписка) ${address} => ошибка "${err.error}": ${err.error_description}`);
//         }
//         ((typeof err.error_description === 'string' && (err.error_description.includes('many') || err.error_description.includes('failed'))) || typeof err.error_description !== 'string') ? reject() : resolve();
//     });
// });

// Авторство

// console.log(`-=- snapshotvoter v${version} -=-`);
// console.log('License: ISC\nAuthor: @Jancrypto\nDonate: 0x9D278054C3e73294215b63ceF34c385Abe52768B');

// Парсинг параметров

// let project, prop_id, vote;
// process.argv.forEach(function (val, index, array) {
//     switch (index) {
//         case 2:
//             project = val;
//         case 3:
//             if (String(val).toLowerCase() == 'getprops') {
//                 isParseProps = true;
//             } else {
//                 prop_id = val;
//             }
//         case 4:
//             vote = val.includes(',') ? val.split(',').map(Number) : +val;
//     }
// });

// Unhandled errors/promises, fix app crash

// process.on('uncaughtException', (error, origin) => {
//     console.log('----- Uncaught exception -----');
//     console.dir(error);
//     console.log('----- Exception origin -----');
//     console.dir(origin);
// });

// process.on('unhandledRejection', (reason, promise) => {
//     console.log('----- Unhandled Rejection at -----');
//     console.dir(promise);
//     console.log('----- Reason -----');
//     console.dir(reason);
// });

// Парсинг

// if (isParseProps) {
//     let q = `
//     query {
//         proposals (
//           where: {
//             space_in: ["${project}"],
//             state: "active"
//           }
//         ) {
//           id
//         }
//       }`;
//     await fetch('https://hub.snapshot.org/graphql', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Accept': 'application/json',
//         },
//         body: JSON.stringify({query: q})
//     }).then(r => r.json()).then(data => {
//         if (data.hasOwnProperty('data') && data.data.hasOwnProperty('proposals')) {
//             let arr = [];
//             data.data.proposals.forEach(i => arr.push(i.id));
//             fs.writeFileSync(path.join(__dirname, '/props.json'), JSON.stringify(arr, null, 4), { encoding: 'utf8', flag: 'w' });
//             console.log('Данные сохранены, проверьте props.json.');
//         } else {
//             console.log('Ошибка при парсинге данных.')
//         }
//     });
//     exit();
// }

/**
 * Абстрактная задержка (async)
 * @param {Integer} millis 
 * @returns
 */

const sleep = async (millis) => new Promise(resolve => setTimeout(resolve, millis));

/**
 * Абстрактная задержка
 * @param {Integer} millis 
 * @returns
 */

const wait = ms => new Promise(r => setTimeout(r, ms));

const hub = 'https://hub.snapshot.org'; // or https://testnet.snapshot.org for testnet
const client = new snapshot.Client712(hub);

const privateKeys = importPrivateKeys()
const props_list = importProps()

async function main(){

    for (let privateKey of privateKeys) {
        const ethWallet = createWallet('ARBITRUM', privateKey)
        const address = await ethWallet.getAddress();
        
        for (let props of props_list){
            console.log(`start voiting props: ${props.proposal}  for account: ${address}`)
            const data = await getData(databaseName, collectionName, {address: address, proposal: props.proposal})
            console.log(`data:`, data)
            if (data){
                if (data.result === 'Success'){
                    console.log('Voiting has done successfully')
                    continue
                } else if (data.errorDescription === 'no voting power'){
                    console.log('Pass, account does not have voting power')
                    continue
                }
            }
            let snapshotResult
            let errorName
            let errorDescription
            try{
                const result = await client.vote(ethWallet, address, {
                    space: props.space,
                    proposal: props.proposal,
                    type: props.type, // single-choice, basic, approval
                    choice: randomIntInRange(1, 2),
                    // choice: 1,
                    reason: '',
                    app: 'snapshot'
                })
                console.log('result', result)
                if (await result.hasOwnProperty('id')) {
                    console.log(`(Голосование) ${address} => голос засчитан`);
                    snapshotResult = 'Success'
                } else {
                    console.log(`(Голосование) ${address} =>`);
                    console.dir(result);
                    snapshotResult = 'Undefine'
                }
            } catch(err) {
                console.log(err)
                if (typeof err.error_description !== 'string') {
                    console.log(`(Голосование) ${address} => ошибка "${err.error}":`);
                    console.dir(err.error_description);
                    snapshotResult = 'Error'
                } else {
                    console.log(`(Голосование) ${address} => ошибка "${err.error}": ${err.error_description}`);
                    errorName = err.error
                    errorDescription = err.error_description
                    snapshotResult = 'Error'
                }
                    // ((typeof err.error_description === 'string' && (err.error_description.includes('many') || err.error_description.includes('failed'))) || typeof err.error_description !== 'string') ? reject() : resolve();
                }   
            await insertData(databaseName, collectionName, {result : snapshotResult, address, proposal: props.proposal, errorName, errorDescription})
            if (isSleep) {
                        let sle = randomIntInRange(sleep_from, sleep_to);
                        console.log(`Задержка ${sle}с..`)
                        await sleep(sle * 1000)
                    }
            } 
        }
}

main()