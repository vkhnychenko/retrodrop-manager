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
