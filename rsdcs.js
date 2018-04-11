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

const puppeteer = require("puppeteer");
const Discord = require("discord.js");
const client = new Discord.Client();

const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
});
const fs = require("fs");

const config = require("./config.json");

var on = true;
var readyToSend = false;
const lastIndex = {number: -1};

var firstTime = true;

// only accessed globally from the readline handler
var page;
var frame;

(async() => {
    await console.log(getDateTime() + ": Started program");
    await client.login(config.login.discord);
    const browser = await puppeteer.launch({args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-web-security", "--user-data-dir"]});
    page = await browser.newPage();
    await startup(page);
})();

async function startup(page) {
    async function waitForSelector(selector, timeout, hidden) {
        try {
            await frame.waitForSelector(selector, {timeout: timeout, hidden: hidden});
            return true;
        } catch (e) {
            await console.log(getDateTime() + ": Took too long to load");
            return false;
        }
    }

    lastIndex.number = -1;

    await page.goto("http://www.runescape.com/companion/comapp.ws");
    await console.log(getDateTime() + ": Loaded page");
    frame = await page.frames()[1];

    if (await waitForSelector("body:not(.initial-load)", 10000, false)) {
        await console.log(getDateTime() + ": Fully loaded page");

        await frame.type("input#username", config.login.username); // type the username
        await frame.type("input#password", config.login.password); // type the password
        await frame.click("button.icon-login"); // click on the submit button
        if (await waitForSelector("div.modal-body.ng-scope", 10000, false)) {
            await console.log(getDateTime() + ": Logged in");

            await frame.click("a[ng-click='modalCancel()']"); // click on the "no" button on the save password dialog
            if (await waitForSelector("div.modal-body.ng-scope", 5000, true)) {
                await console.log(getDateTime() + ": In app");

                await frame.click("li.all-chat"); // click on the chat tab
                if (await waitForSelector("section.chat.all-chat.ng-scope", 5000, false)) {
                    await sleep(250); // wait for the slider to show it
                    await console.log(getDateTime() + ": In chat tab");

                    if (config.configs.chatType === "clan") {
                        await frame.click("i.icon-clanchat:not(.icon)"); // click on the clan chat tab
                    } else if (config.configs.chatType === "friends") {
                        await frame.click("i.icon-friendschat:not(.icon)"); // click on the friends chat tab
                    } else {
                        await console.log(getDateTime() + ": Not a valid chat type. must be \"clan\" or \"friends\"");
                        await shutdown();
                    }
                    if (await waitForSelector("input#message", 10000, false)) {
                        await console.log(getDateTime() + ": In " + config.configs.chatType + " chat tab");
                        readyToSend = true;
                        await console.log(getDateTime() + ": Ready to chat!");

                        // Everything is ready, so enable the chat features
                        on = true;

                        async function handleRead() {
                            const output = await read(page, lastIndex);
                            lastIndex.number = output[1];
                            if (output[0] === "disconnected") {
                                readyToSend = false;

                                await console.log(getDateTime() + ": Lost connection");
                                if (!await waitForSelector("div.modal-body.ng-scope", 5000, false)) {
                                    await console.log(getDateTime() + ": Unexpected error, screenshotting");
                                    await page.screenshot({path: "./" + getDateTime() + ": error1" + ".png"});
                                }
                                await restart(page);
                            } else if (output[0] !== "clear") {
                                await client.channels.get(config.configs.channelID).send(output[0]); // send the message in the discord
                                if (on) {
                                    setTimeout(handleRead, 0);
                                } else {
                                    restart(page);
                                }
                            } else {
                                if (on) {
                                    setTimeout(handleRead, 600);
                                } else {
                                    restart(page);
                                }
                            }
                        }

                        setTimeout(handleRead, 0);

                        if (firstTime) {
                            firstTime = false;
                            client.on("message", message => {
                                if (readyToSend) {
                                    if (message.channel.id == config.configs.channelID && message.author.id !== config.configs.botID) {
                                        let author = message.member.nickname;
                                        if (author == null) {
                                            author = message.author.username;
                                        }
                                        send(page, message.content, author, frame);
                                    }
                                }
                            });
                        }
                        return;
                    }
                }
            }
        }
    }
    await restart(page);
}


async function send(page, message, author, frame) {
    // if the message is too long to send in runescape
    if ((message.length + author.length + 2) > 80) {
        await send(page, message.substring(0, (80 - author.length - 2)), author, frame); // send the beginning of the message
        await sleep(500); // wait a little between messages
        await send(page, message.substring((80 - author.length - 2), message.length), author, frame); // send the rest of the message
    } else {
        await frame.type("input#message", author + ": " + message);
        await frame.click("input[type='submit']"); // click on the send button
    }
}

async function read(page, lastIndex) {
    if (readyToSend) {
        return await page.evaluate((lastIndex) => {
            function getNextMessage(ul, lastIndex) {
                let list = ul.querySelectorAll("li.message.clearfix.ng-scope:not(.my-message):not(.historical)");
                if (lastIndex.number < list.length - 1) {
                    return list[++lastIndex.number];
                } else {
                    // if the bot restarted and the messages were cleared
                    if (lastIndex >= list.length) {
                        lastIndex.number = list.length - 1; // make it seem like the bot has completed the message queue (put the bot back on track)
                    }
                    return null;
                }
            }

            let div = window.frames[0].document.getElementsByClassName("content push-top-double push-bottom-double").item(0); // the div that holds the list
            if (div != null) {
                let ul = div.getElementsByTagName("ul").item(0); // the list
                if (ul != null) { // if there are messages
                    let lastMessage = getNextMessage(ul, lastIndex);

                    if (lastMessage !== null) {
                        let authorElement = lastMessage.getElementsByClassName("author").item(0);
                        let messageElement = lastMessage.getElementsByTagName("p").item(0);
                        if (authorElement != null && messageElement != null) {
                            let author = authorElement.childNodes[0].nodeValue; // the username of the sender
                            author = author.substring(0, (author.length - 3)); // trim the " - " from the end of the author string
                            let message = messageElement.childNodes[0].nodeValue; // the actual content of the message

                            let time = new Date();
                            time = ("0" + time.getUTCHours()).slice(-2) + ":" + ("0" + time.getUTCMinutes()).slice(-2) + ":" + ("0" + time.getUTCSeconds()).slice(-2);

                            // Wrap the RuneScape message in a code block
                            // Adapted from discord.js/src/structures/shared/CreateMessage.js (the code for when {code:true} is passed to TextChannel.send
                            // Adapted from escapeMarkdown in discord.js/src/util/Util.js
                            message = message.replace(/```/g, '`\u200b``');
                            message = `\`\`\`${""}\n${message}\n\`\`\``;

                            return [(time + ": " + author + ":\n" + message), lastIndex.number];
                        }
                    }
                }
            } else {
                return ["disconnected", lastIndex.number]; // there was an error and the bot is no longer in the chat screen
            }
            return ["clear", lastIndex.number]; // there are no messages to read, so just send nothing
        }, lastIndex);
    } else {
        return ["clear", lastIndex.number];
    }
}

function restart(page) {
    console.log(getDateTime() + ": Restarting...\n");
    startup(page);
}

function shutdown() {
    console.log("\n" + getDateTime() + ": Shutting down!");
    client.destroy();
    process.exit();
}

readline.on("line", (input) => {
    switch (input) {
        case "html": {
            if (frame !== undefined) {
                const name = getDateTime() + ".html";
                frame.content().then((content) => {
                    fs.writeFile("./" + name, content, (err) => {
                        if (!err) {
                            console.log("Saved HTML data as: " + name);
                        } else {
                            console.log(err);
                        }
                    });
                }).catch((err) => {
                    console.log("Unexpected Error");
                    console.log(err + "\n");
                });
            } else {
                console.log("Error: Can not get HTML data because the browser is not ready yet");
            }
            break;
        } case "restart": {
            if (page !== undefined) {
                on = false;
            } else {
                console.log("Error: Can not restart because the browser is not ready yet");
            }
            break;
        } case "screenshot": {
            if (page !== undefined) {
                const name = getDateTime() + ".png";
                page.screenshot({path: "./" + name});
                console.log("Saved screenshot as: " + name);
            } else {
                console.log("Error: Can not take screenshot because the browser is not ready yet");
            }
            break;
        } case "shutdown": {
            shutdown();
            break;
        } default: {
            console.log("Unknown command: " + input);
            break;
        }
    }
});

readline.on("close", () => {
    shutdown();
});

function getDateTime() {
    let date = new Date();
    return date.getUTCFullYear() + ":" + ("0" + (date.getUTCMonth() + 1)).slice(-2) + ":" + ("0" + date.getUTCDate()).slice(-2) + ":" + ("0" + date.getUTCHours()).slice(-2) + ":" + ("0" + date.getUTCMinutes()).slice(-2) + ":" + ("0" + date.getUTCSeconds()).slice(-2);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}