import {Telegraf} from 'telegraf'
import { TELEGRAM_TOKEN, TELEGRAM_IDS } from '../config/config.js'


const bot = new Telegraf(TELEGRAM_TOKEN)

bot.command('start', async (ctx) => {
    console.log(ctx.chat.id)
    await ctx.reply('Я буду отправлять оповещения по аккаунтам')
})

export async function sendMessageToTelegram(msg){
    for (let chatId of TELEGRAM_IDS) {
        try {
            await bot.telegram.sendMessage(chatId, msg)
        } catch (e){
            console.log(`Error while sendMessage to telegram`, e.message)
        }
    }
}

// sendMessage('123')

// bot.launch()

// process.once('SIGINT', () => bot.stop('SIGINT'))
// process.once('SIGTERM', () => bot.stop('SIGTERM'))

// console.log('Starting...')