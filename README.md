# RuneScape-Discord Chat Sync

A RuneScape Companion and Discord bot that synchronizes a RuneScape
Friends/Clan Chat with Discord chat.

RuneScape-Discord Chat Sync is a bot written in JavaScript that uses
[Puppeteer](https://github.com/GoogleChrome/puppeteer) to simulate a user
using the [RuneScape Companion](http://runescape.com/companion/comapp.ws)
web app to chat in the Friends/Clan Chat (it's easily configurable). When it
reads a message in the RuneScape chat it outputs it to the Discord chat using
[discord.js](https://discord.js.org), and when it reads a message in the
Discord chat it outputs it in the RuneScape chat, keeping the two chats synced.

This bot can be useful for users who want to continue a RuneScape conversation
without playing the game, people who want to make sure they don't miss part of
a conversation, or to keep chat logs.

Please note that since Jagex has discontinued the RuneScape Companion app, the
bot will be rewritten so that it will run the game client and chat through
there unless an alternative can be found.

It is officially hosted on
[GitHub](https://github.com/aeramos/RuneScape-Discord-Chat-Sync).

## HOW TO USE
1. Download the repository. This can be done by downloading the `.zip`, but I
recommend using git so that you may easily receive updates.

2. Configure the bot.
    * Personalize the entries in `config.json.example`.

    * Rename `config.json.example` to `config.json`.

3. Run the bot.
    * Navigate to the project directory.

    * In the terminal, run `npm install` to install all the necessary node
    packages. When you want to update the packages, run `npm update` instead.

    * In the terminal, run `node main.js` to start the bot using your
    configuration.

## MAINTAINERS

 * [Alejandro Ramos](https://github.com/aeramos)

## LICENSE

This program is licensed under the
[GNU AGPL-3.0+](https://www.gnu.org/licenses/agpl-3.0.html).
More information can be found in the LICENSE.txt file.
