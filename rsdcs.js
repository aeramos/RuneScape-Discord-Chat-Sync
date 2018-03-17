/**
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
*/

const puppeteer = require("puppeteer");
const Discord = require("discord.js");
const client = new Discord.Client();

const config = require("./config.json");

var readyToSend = false;
const lastIndex = {number: -1};

(async() => {
    await console.log(getDateTime() + ": Started program");
    await client.login(config.login.discord);
    const browser = await puppeteer.launch({args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-web-security", "--user-data-dir"]});
    let page = await browser.newPage();
    await startup(page);
})();

async function startup(page) {
    lastIndex.number = -1;

    await page.goto("http://www.runescape.com/companion/comapp.ws");
    await console.log(getDateTime() + ": Loaded page");
    let frame = await page.frames()[1];

    try {
        await frame.waitForSelector("body:not(.initial-load)", {timeout: 10000});
    } catch (e) {
        await console.log(getDateTime() + ": Took too long to load");
        await restart(page);
        return;
    }
    await console.log(getDateTime() + ": Fully loaded page");

    await frame.type("input#username", config.login.username); // type the username
    await frame.type("input#password", config.login.password); // type the password
    await frame.click("button.icon-login"); // click on the submit button
    await frame.waitForSelector("div.modal-body.ng-scope");
    await console.log(getDateTime() + ": Logged in");

    await frame.click("a[ng-click='modalCancel()']"); // click on the "no" button on the save password dialog
    await frame.waitForSelector("div.modal-body.ng-scope", {"hidden": true});
    await console.log(getDateTime() + ": In app");

    await frame.click("li.all-chat"); // click on the chat tab
    await frame.waitForSelector("section.chat.all-chat.ng-scope");
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
    await frame.waitForSelector("input#message");
    await console.log(getDateTime() + ": In " + config.configs.chatType + " chat tab");
    readyToSend = true;
    await console.log(getDateTime() + ": Ready to chat!");

    // Everything is ready, so enable the chat features
    async function handleRead(){
        const output = await read(page, lastIndex);
        lastIndex.number = output[1];
        if (output[0] === "disconnected") {
            readyToSend = false;

            await console.log(getDateTime() + ": Lost connection");
            try {
                await frame.waitForSelector("div.modal-body.ng-scope", {timeout: 5000});
            } catch (e) {
                await console.log(getDateTime() + ": Unexpected error, screenshotting");
                await page.screenshot({path: "./" + getDateTime() + ": error1" + ".png"});
            }
            await restart(page);
        } else if (output[0] !== "clear") {
            await client.channels.get(config.configs.channelID).send(output[0]); // send the message in the discord
            setTimeout(handleRead, 0);
        } else {
            setTimeout(handleRead, 600);
        }
    }
    setTimeout(handleRead, 0);

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
                            let author = authorElement.innerHTML; // the username of the sender
                            author = author.substring(0, (author.length - 3)); // trim the " - " from the end of the author string
                            let message = messageElement.innerHTML; // the actual content of the message

                            let time = new Date();
                            time = ("0" + time.getUTCHours()).slice(-2) + ":" + ("0" + time.getUTCMinutes()).slice(-2) + ":" + ("0" + time.getUTCSeconds()).slice(-2);
                            return [(time + ": " + author + ":\n```" + message + "```"), lastIndex.number];
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

process.on("SIGINT", () => {
    shutdown();
});

function getDateTime() {
    let date = new Date();
    return date.getUTCFullYear() + ":" + ("0" + (date.getUTCMonth() + 1)).slice(-2) + ":" + ("0" + date.getUTCDate()).slice(-2) + ":" + ("0" + date.getUTCHours()).slice(-2) + ":" + ("0" + date.getUTCMinutes()).slice(-2) + ":" + ("0" + date.getUTCSeconds()).slice(-2);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}