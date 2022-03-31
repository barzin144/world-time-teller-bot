import express from "express";
import { Telegraf } from "telegraf";

const token = process.env.BOT_TOKEN;
if (token === undefined) {
  throw new Error("BOT_TOKEN must be provided!");
}
const timeZones = {
  Iran: "Asia/Tehran",
  Paris: "Europe/Paris",
  Malaysia: "Asia/Kuala_Lumpur",
};
const bot = new Telegraf(token);
// Set the bot response

bot.command("quit", (ctx) => {
  // Explicit usage
  ctx.telegram.leaveChat(ctx.message.chat.id);

  // Using context shortcut
  ctx.leaveChat();
});

bot.command("time", (ctx) => {
  const replyKeyboardMarkup = {
    keyboard: [Object.keys(timeZones).map((x) => ({ text: x }))],
    //one_time_keyboard: true,
  };
  ctx.reply("Select a country", {
    reply_to_message_id: ctx.message.message_id,
    reply_markup: replyKeyboardMarkup,
  });
});

bot.on("text", (ctx) => {
  if (timeZones.hasOwnProperty(ctx.message.text)) {
    ctx.reply(
      new Date().toLocaleTimeString("en-US", {
        timeZone: timeZones[ctx.message.text],
        hour12: false,
      }),
      {
        reply_to_message_id: ctx.message.message_id,
        reply_markup: { remove_keyboard: true },
      }
    );
  }
});

const secretPath = `/telegraf/${bot.secretPathComponent()}`;

// Set telegram webhook
bot.telegram.setWebhook(`https://world-time-teller.herokuapp.com/${secretPath}`);

const app = express();
app.get("/", (req, res) => res.send("Hello World!"));
// Set the bot API endpoint
app.use(bot.webhookCallback(secretPath));
app.listen(process.env.PORT || 3000, 
	() => console.log("Server is running...")
);
