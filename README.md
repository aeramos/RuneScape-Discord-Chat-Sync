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

It is officially hosted on
[GitHub](https://github.com/aeramos/RuneScape-Discord-Chat-Sync).

### MAINTAINERS

 * [Alejandro Ramos](https://github.com/aeramos)

### LICENSE

This program is licensed under the
[GNU AGPLv3](https://gnu.org/licenses/agpl-3.0.en.html).
More information can be found in the COPYING file.

------------------------------

This file is part of RuneScape-Discord Chat Sync

Copyright (C) 2018 Alejandro Ramos

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.