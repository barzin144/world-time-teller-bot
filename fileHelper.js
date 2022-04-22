import { promises as fs } from "fs";
const folderPath = "./usersConfig";

const isUserConfigExist = async (userId) => {
  return fs.stat(`${folderPath}/${userId}.json`);
};

const createUserConfig = async (userId) => {
  return fs.appendFile(`${folderPath}/${userId}.json`, JSON.stringify({}), "utf8");
};

const readUserConfig = async (userId) => {
  return fs.readFile(`${folderPath}/${userId}.json`);
};

const saveUserConfig = async (userId, timezone) => {
  const config = JSON.parse(await readUserConfig(userId));
  if (Object.keys(config).length === 0) {
    config["timezones"] = [];
  }
  config["timezones"].push(timezone);
  return fs.writeFile(`${folderPath}/${userId}.json`, JSON.stringify(config), "utf8");
};

const resetUserConfig = async (userId) => {
  return fs.writeFile(`${folderPath}/${userId}.json`, JSON.stringify({}), "utf8");
};

export { isUserConfigExist, createUserConfig, readUserConfig, saveUserConfig, resetUserConfig };
