# World time teller telegram bot
This Telegram bot allows you to keep track of the current time in your favorite cities. 😁 Add cities you want to monitor and easily check their time!

## Commands
To get started, send the /time command to the bot. From there, you can configure your settings. You can also add this bot to groups and manage the configuration there.
- /time – View and configure time settings
- /add_to_config – Add cities to your configuration
- /reset_config – Reset your configuration

## Development
If you'd like to develop or run this bot locally, you'll need to set up a Firebase database and add serviceAccountKey.json (Firebase configuration) to the project.

## Development commands
- npm install
- npm run local-start

I used "localtunnel" to provide a valid URL for the Telegram bot webhook, which forwards Telegram requests to your localhost.
