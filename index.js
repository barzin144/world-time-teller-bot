import express from "express";
import { Telegraf } from "telegraf";
import { v4 as uuid } from "uuid";
import { deleteImage, setTextOnImage } from "./imageEditor.js";

const token = process.env.BOT_TOKEN;
const kualaPhoto = "https://world-time-teller.herokuapp.com/kuala-lumpur.png";

if (token === undefined) {
  throw new Error("BOT_TOKEN must be provided!");
}
const timeZones = {
  Iran: "Asia/Tehran",
  France: "Europe/Paris",
  Malaysia: "Asia/Kuala_Lumpur",
};

const bot = new Telegraf(token);
// Set the bot response

bot.command("time", (ctx) => {
  /*
  const replyKeyboardMarkup = {
    keyboard: [Object.keys(timeZones).map((x) => ({ text: x }))],
  };
  */
  const inlineKeyboard = {
    inline_keyboard: [
      Object.keys(timeZones).map((x) => ({ text: x, callback_data: x })),
    ],
  };
  ctx.reply("Select a country", {
    reply_to_message_id: ctx.message.message_id,
    reply_markup: inlineKeyboard,
  });
});

bot.on("callback_query", async (ctx) => {
  const selectedInlineQuery = ctx.callbackQuery.data;

  if (timeZones.hasOwnProperty(selectedInlineQuery)) {
    let imagePath = `./temp/${uuid()}.png`;
    await setTextOnImage(
      `${selectedInlineQuery}.jpg`,
      imagePath,
      `${selectedInlineQuery} ${new Date().toLocaleTimeString("en-US", {
        timeZone: timeZones[selectedInlineQuery],
        hour12: false,
      })}`
    );
    await ctx.deleteMessage(ctx.callbackQuery.message.id);
    await ctx.replyWithPhoto({
      source: imagePath,
    });
    deleteImage(imagePath);
  }
});

const secretPath = `/telegraf/${bot.secretPathComponent()}`;

// Set telegram webhook
bot.telegram.setWebhook(`https://world-time-teller.herokuapp.com${secretPath}`);
//local webhook
//bot.telegram.setWebhook(`https://itchy-badger-34.loca.lt${secretPath}`);

const app = express();
app.get("/", (req, res) => res.send("This is a Telegram bot"));
// Set the bot API endpoint
app.use(bot.webhookCallback(secretPath));

app.listen(process.env.PORT || 6000, () => console.log("Server is running..."));
