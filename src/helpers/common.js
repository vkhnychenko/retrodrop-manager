/**
 * Случайное min/max целое значение
 * @param {Integer} min 
 * @param {Integer} max 
 * @returns Случайное число
 */

export const randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};