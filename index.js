import express from "express";
import { promises as fs } from "fs";
import localtunnel from "localtunnel";
import { Telegraf } from "telegraf";
import { createInlineKeyboard } from "./helper.js";
import { setData, readData, saveUserConfig, resetUserConfig } from "./firebaseHelper.js";

const token = process.env.BOT_TOKEN;
const timezones = JSON.parse(await fs.readFile("./timezones.json"));

const commands = {
  get_time: { label: "Get time", value: "time" },
  start_config: { label: "Start config", value: "start_config" },
  add_to_config: { label: "Add city to config", value: "add_to_config" },
  reset_config: { label: "Reset config", value: "reset_config" },
};

if (token === undefined) {
  throw new Error("BOT_TOKEN must be provided!");
}

//show list of continents
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

//show list of cities
const replyListOfCities = async (ctx, continent, page) => {
  const inlineKeyboard = {
    inline_keyboard: createInlineKeyboard(timezones[continent], `city-${continent}-`, 2, true, {
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

const replyConfigMe = async (ctx) => {
  const inlineKeyboard = {
    inline_keyboard: [
      [{ text: commands.start_config.label, callback_data: commands.start_config.value }],
    ],
  };
  await ctx.reply("This is the first time, Please config me ", {
    reply_to_message_id: ctx.message.message_id,
    reply_markup: inlineKeyboard,
  });
};

//show current user config with add to config button
const replyAddToConfig = async (ctx) => {
  const inlineKeyboard = {
    inline_keyboard: [
      [{ text: commands.add_to_config.label, callback_data: commands.add_to_config.value }],
    ],
  };
  //read user config
  const data = await readData(ctx.message.chat.id);
  //create list of user selected cities
  const cities = data.timezones.map((x) => x.label);

  await ctx.reply(`Your config:\n${cities.join("\n")}`, {
    reply_to_message_id: ctx.message.message_id,
    reply_markup: inlineKeyboard,
  });
};

//show a message for get confirm for reseting the configuration
const replyConfirmResetConfig = async (ctx) => {
  const inlineKeyboard = {
    inline_keyboard: [[{ text: "Yes, I'm sure", callback_data: commands.reset_config.value }]],
  };
  await ctx.reply("Are you Sure to reset the configuration", {
    reply_to_message_id: ctx.message.message_id,
    reply_markup: inlineKeyboard,
  });
};

//show user selected cities as buttons
const replyUserConfigTimezones = async (ctx, userConfigTimezones) => {
  const inlineKeyboard = {
    inline_keyboard: userConfigTimezones.map((x) => [{ text: x.label, callback_data: x.value }]),
  };
  await ctx.reply("Select a city", {
    reply_to_message_id: ctx.message.message_id,
    reply_markup: inlineKeyboard,
  });
};

//create telegram bot instance
const bot = new Telegraf(token);

//catch /time command
bot.command(commands.get_time.value, async (ctx) => {
  const { chat } = ctx.message;
  const { id } = chat;
  const userConfig = await readData(id);
  //check is user has config or not
  if (!!userConfig) {
    //if the user config is empty
    if (userConfig.timezones.length === 0) {
      await replyConfigMe(ctx);
    }
    //reply the exsiting config
    else {
      //show cities
      await replyUserConfigTimezones(ctx, userConfig.timezones);
    }
  } else {
    //there no config for this user
    //create an empty file for this user
    await setData({ user_id: id.toString(), timezones: [] });
    await replyConfigMe(ctx);
  }
});

//catch reset config commadn
bot.command(commands.reset_config.value, async (ctx) => {
  //show the confim message
  await replyConfirmResetConfig(ctx);
});

//catch add city to config
bot.command(commands.add_to_config.value, async (ctx) => {
  //show user selected cities
  await replyAddToConfig(ctx);
});

//catch all inline keyboard data
bot.on("callback_query", async (ctx) => {
  const selectedInlineQuery = ctx.callbackQuery.data;
  const { chat } = ctx.callbackQuery.message;

  //if user select start config or add city to config
  if (
    selectedInlineQuery === commands.start_config.value ||
    selectedInlineQuery === commands.add_to_config.value
  ) {
    //show list of continents
    await replyListOfContinents(ctx);
    return;
  }
  //if user select reset config
  if (selectedInlineQuery === commands.reset_config.value) {
    //replace the user config file with empty json
    await resetUserConfig(chat.id);
    //show list of continents
    await replyListOfContinents(ctx);
    return;
  }

  //if user select back in list of cities
  if (/^city-.+-back/.test(selectedInlineQuery)) {
    //show list of continents
    await replyListOfContinents(ctx);
    return;
  }

  //if user select next or previous page in list of cities
  if (/^city-.+-page-/.test(selectedInlineQuery)) {
    //split callback data for getting page and continent
    const callbackData = selectedInlineQuery.split("-");
    const page = Number(callbackData[3]);
    const continent = callbackData[1];
    //show list of cities
    await replyListOfCities(ctx, continent, page);
    return;
  }

  //if user select one of the cities
  if (/^city-.+/.test(selectedInlineQuery)) {
    //split callback data for getting city and continent
    const callbackData = selectedInlineQuery.split("-");
    const city = callbackData[2];
    //remove _ from city name
    const label = city.replace(/_/g, " ");
    const continent = callbackData[1];
    //add city to user config
    await saveUserConfig(chat.id, { label: label, value: `${continent}/${city}` });
    //delete previous message
    await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
    await ctx.reply(`${label} is added to your configuration.`);
    return;
  }

  //if user select one of the continents
  if (/^continent-/.test(selectedInlineQuery)) {
    //get continent from callback data
    const continent = selectedInlineQuery.split("-")[1];
    //show list of cities based on continent
    await replyListOfCities(ctx, continent, 1);
    return;
  }

  //if all the conditions passed that means the user select one of the city for getting the time of that city
  //delete previous message
  await ctx.deleteMessage(ctx.callbackQuery.message.id);
  const city = selectedInlineQuery.split("/")[1].replace(/_/g, " ");
  await ctx.reply(
    `${city} ${new Date().toLocaleTimeString("en-US", {
      timeZone: selectedInlineQuery,
      hour12: false,
    })}`
  );
});

//generate a secret path for having a secret url for webhook
const secretPath = `/telegraf/${bot.secretPathComponent()}`;

// Set telegram webhook
if (process.env.NODE_ENV === "development") {
  //local webhook
  const tunnel = await localtunnel({ port: 6000 });
  bot.telegram.setWebhook(`${tunnel.url}${secretPath}`);
} else {
  //set heroku webhook
  bot.telegram.setWebhook(`https://world-time-teller.herokuapp.com${secretPath}`);
}

//send bot commands to telegram
await bot.telegram.setMyCommands([
  { command: "time", description: "this command will tell you the world time" },
  {
    command: "add_to_config",
    description: "with this command you can add a city timezone into configurations",
  },
  { command: "reset_config", description: "this command will reset the timezone configurations" },
]);

//setup an express app
const app = express();
//handle / path
app.get("/", (req, res) =>
  res.send(
    "This is a Telegram bot, message it -> <a href='https://t.me/world_time_teller_bot'>https://t.me/world_time_teller_bot</a>"
  )
);

// Set the bot API endpoint
app.use(bot.webhookCallback(secretPath));

//start the app
app.listen(process.env.PORT || 6000, () => console.log("Server is running..."));
