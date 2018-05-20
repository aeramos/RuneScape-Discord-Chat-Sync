/*
 *  This file is part of RuneScape-Discord Chat Sync
 *  Copyright (C) 2018 Alejandro Ramos
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const Discord = require("discord.js");
let client;
const Queue = require("./Queue");

const config = require("./config.json");

let readyToSend = true;

const welcome = "RuneScape-Discord Chat Sync now running.\nSource code and license info (AGPL-3.0+) can be found at https://github.com/aeramos/RuneScape-Discord-Chat-Sync.";

let toQueue;
let fromQueue;
let sending = false;

async function send() {
    if (!sending) {
        sending = true;
        while (toQueue.length() > 0) {
            if (readyToSend) {
                let author = toQueue.getAuthor(0); // the username of the sender
                let message = toQueue.getMessage(0); // the actual content of the message

                let time = new Date();
                time = ("0" + time.getUTCHours()).slice(-2) + ":" + ("0" + time.getUTCMinutes()).slice(-2) + ":" + ("0" + time.getUTCSeconds()).slice(-2);

                // Wrap the RuneScape message in a code block
                // Adapted from discord.js/src/structures/shared/CreateMessage.js (the code for when {code:true} is passed to TextChannel.send
                // Adapted from escapeMarkdown in discord.js/src/util/Util.js
                message = message.replace(/```/g, "`\u200b``");
                message = `\`\`\`${""}\n${message}\n\`\`\``;

                await client.channels.get(config.configs.channelID).send(time + ": " + author + ":\n" + message); // send the message in the discord
                toQueue.shift();
            }
        }
        sending = false;
    }
}

class DiscordSync {
    constructor(toQueue1 = new Queue(), fromQueue1 = new Queue()) {
        fromQueue = fromQueue1;
        toQueue = toQueue1;
    }

    static get toQueueListener() {
        return () => {
            send();
        };
    }

    async start() {
        client = new Discord.Client();
        await client.login(config.login.discord);
        await client.channels.get(config.configs.channelID).send(welcome);

        await client.removeAllListeners();
        await client.on("message", message => {
            if (readyToSend) {
                if (message.channel.id == config.configs.channelID && message.author.id !== config.configs.botID) {
                    let author = message.member.nickname;
                    if (author == null) {
                        author = message.author.username;
                    }
                    let original = message.content;
                    let clean = "";
                    // if any of discord's autocompleted emojis are in the message
                    for (let i = 0; i < original.length; i++) {
                        switch (original.charAt(i)) {
                            case "\u2764": // ❤
                                clean += "<3";
                                break;
                            case "\ud83d": // separate switch statement for emojis with 16 bits
                                switch (original.charAt(++i)) {
                                    case "\udc94": // 💔
                                        clean += "</3";
                                        break;
                                    case "\ude22": // 😢
                                        clean += ":'(";
                                        break;
                                    case "\ude17": // 😗
                                        clean += ":*";
                                        break;
                                    case "\ude03": // 😃
                                        clean += ":)";
                                        break;
                                    case "\ude04": // 😄
                                        clean += ":D";
                                        break;
                                    case "\ude09": // 😉
                                        clean += ";)";
                                        break;
                                    case "\ude10": // 😐
                                        clean += ":|";
                                        break;
                                    case "\ude2e": // 😮
                                        clean += ":o";
                                        break;
                                    case "\ude20": // 😠
                                        clean += ">:(";
                                        break;
                                    case "\ude26": // 😦
                                        clean += ":(";
                                        break;
                                    case "\ude15": // 😕
                                        clean += ":/";
                                        break;
                                }
                                break;
                            default:
                                clean += original.charAt(i);
                                break;
                        }
                    }

                    // add the new messages to the end of the queue
                    fromQueue.push(clean, author);
                }
            }
        });
    }

    async shutdown() {
        return client.destroy();
    }

    async restart() {
        await client.destroy();
        this.start();
    }
}

module.exports = DiscordSync;
