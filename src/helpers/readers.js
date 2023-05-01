import * as fs from "fs";
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const textAccountFilePath = path.resolve('./data/accounts.txt')
const jsonAccountFilePath = path.resolve('./data/accounts.json')


export function readAccountsFromTextFile(){
    let accounts = []
    const data = fs.readFileSync(textAccountFilePath, "utf8")
    data.split("\n").forEach(
        el => accounts.push(
            {
                address: el.split(':')[0],
                privateKey: el.split(':')[1]
            }
            
        )
    )
    return accounts
}

// export function importAccountsFromJson(){
//     let addresses = []
//     const data = fs.readFileSync(addressesFilePath, "utf8")
//     data.split("\n").forEach(key => addresses.push(key.split(':')[0]))
//     return addresses
// }


// export function importAccs(){
//     let accs = [];
//     let data = JSON.parse(fs.readFileSync(path.join(__dirname, '/keys.json'), { encoding: 'utf8', flag: 'r' }));
//     data.forEach(i => accs.push(i));
//     return accs;
// };
