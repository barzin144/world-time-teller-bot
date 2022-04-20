import express from "express";
import * as fs from "fs";
import localtunnel from "localtunnel";
import { Telegraf } from "telegraf";
import { v4 as uuid } from "uuid";
import { createInlineKeyboard } from "./helper.js";
import { deleteImage, setTextOnImage } from "./imageEditor.js";

const token = process.env.BOT_TOKEN;
const timezones = JSON.parse(fs.readFileSync("./timezones.json"));

const commands = {
  get_time: { label: "Get time", value: "time" },
  start_config: { label: "Start config", value: "start-config" },
};

if (token === undefined) {
  throw new Error("BOT_TOKEN must be provided!");
}
const replyListOfContinents = async (ctx) => {
  const inlineKeyboard = {
    inline_keyboard: createInlineKeyboard(Object.keys(timezones), "continent-", 2),
  };

  await ctx.editMessageText(
    "You should select a *continent* and a *country* for adding into configuration\nNow select a continent, Please",
    {
      reply_markup: inlineKeyboard,
      parse_mode: "Markdown",
    }
  );
};

const replyListOfCities = async (ctx, continent, page) => {
  const inlineKeyboard = {
    inline_keyboard: createInlineKeyboard(timezones[continent], `city-${continent}-`, 4, true, {
      pageSize: 16,
      page: page,
    }),
  };

  await ctx.editMessageText(
    `You select *${continent}*, Now select a city in *${continent}*, Please`,
    {
      reply_markup: inlineKeyboard,
      parse_mode: "Markdown",
    }
  );
};

const bot = new Telegraf(token);
// Set the bot response

bot.command(commands.get_time.value, (ctx) => {
  const { chat } = ctx.message;
  const { id } = chat;
  //find the config of this chat
  const inlineKeyboard = {
    inline_keyboard: [
      [{ text: commands.start_config.label, callback_data: commands.start_config.value }],
    ],
  };
  ctx.reply("This is the first time, Please config me ", {
    reply_to_message_id: ctx.message.message_id,
    reply_markup: inlineKeyboard,
  });
});

bot.on("callback_query", async (ctx) => {
  const selectedInlineQuery = ctx.callbackQuery.data;

  if (selectedInlineQuery === commands.start_config.value) {
    await replyListOfContinents(ctx);
    return;
  }

  if (/^city-.+-back/.test(selectedInlineQuery)) {
    await replyListOfContinents(ctx);
    return;
  }

  if (/^city-.+-page-/.test(selectedInlineQuery)) {
    const callbackData = selectedInlineQuery.split("-");
    const page = Number(callbackData[3]);
    const continent = callbackData[1];
    await replyListOfCities(ctx, continent, page);
    return;
  }

  if (/^continent-/.test(selectedInlineQuery)) {
    const continent = selectedInlineQuery.split("-")[1];
    await replyListOfCities(ctx, continent, 1);
    return;
  }
  // if (timeZones.hasOwnProperty(selectedInlineQuery)) {
  //   let imagePath = `./temp/${uuid()}.png`;
  //   await setTextOnImage(
  //     `${selectedInlineQuery}.jpg`,
  //     imagePath,
  //     `${selectedInlineQuery} ${new Date().toLocaleTimeString("en-US", {
  //       timeZone: timeZones[selectedInlineQuery],
  //       hour12: false,
  //     })}`
  //   );
  //   await ctx.deleteMessage(ctx.callbackQuery.message.id);
  //   await ctx.replyWithPhoto({
  //     source: imagePath,
  //   });
  //   deleteImage(imagePath);
  // }
});

const secretPath = `/telegraf/${bot.secretPathComponent()}`;

// Set telegram webhook
if (process.env.NODE_ENV === "development") {
  //local webhook
  const tunnel = await localtunnel({ port: 6000 });
  tunnel.url;
  bot.telegram.setWebhook(`${tunnel.url}${secretPath}`);
} else {
  bot.telegram.setWebhook(`https://world-time-teller.herokuapp.com${secretPath}`);
}

const app = express();
app.get("/", (req, res) => res.send("This is a Telegram bot"));
// Set the bot API endpoint
app.use(bot.webhookCallback(secretPath));

app.listen(process.env.PORT || 6000, () => console.log("Server is running..."));
