import { IS_SLEEP, SLEEP_FROM, SLEEP_TO } from "../../config/config.js";

/**
 * Случайное min/max целое значение
 * @param {Integer} min 
 * @param {Integer} max 
 * @returns Случайное число
 */

export const randomIntInRange = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Абстрактная задержка (async)
 * @param {Integer} millis 
 * @returns
 */
export const sleep = async (millis) => new Promise(resolve => setTimeout(resolve, millis));

export const shuffleArray = (array) => {
    const shuffled = array.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export async function newSleep(sec) {
    if (!sec){
        if (IS_SLEEP){
            let sle = randomIntInRange(SLEEP_FROM, SLEEP_TO);
            console.log(`Задержка ${sle}с..`)
            return new Promise(resolve => setTimeout(resolve, sle * 1000));
        }
    } else {
        console.log(`Задержка ${sec}с..`)
        return new Promise(resolve => setTimeout(resolve, sec * 1000));
    }
}


