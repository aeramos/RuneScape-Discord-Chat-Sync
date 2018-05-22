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

class Queue {
    constructor(listener = undefined) {
        if (listener === undefined) {
            throw Error("No listener defined");
        }
        this.listener = listener;

        let internal = [[], [], []];
        this.push = ([message, author, date]) => {
            internal[0].push(message);
            internal[1].push(author);
            internal[2].push(date);
            setTimeout(this.listener, 0);
            return this.length;
        };
        this.pop = () => {
            const message = internal[0].pop();
            const author = internal[1].pop();
            const date = internal[2].pop();
            setTimeout(this.listener, 0);
            return [message, author, date];
        };
        this.shift = () => {
            const message = internal[0].shift();
            const author = internal[1].shift();
            const date = internal[2].shift();
            setTimeout(this.listener, 0);
            return [message, author, date];
        };
        this.unshift = ([message, author, date]) => {
            internal[0].unshift(message);
            internal[1].unshift(author);
            internal[2].unshift(date);
            setTimeout(this.listener, 0);
            return this.length;
        };
        this.length = () => {
            return internal[0].length;
        };
        this.clear = () => {
            internal[0].length = 0;
            internal[1].length = 0;
            internal[2].length = 0;
            setTimeout(this.listener, 0);
        };
        this.get = (index) => {
            return [this.getMessage(index), this.getAuthor(index), this.getDate(index)];
        };
        this.getMessage = (index) => {
            return internal[0][index];
        };
        this.getAuthor = (index) => {
            return internal[1][index];
        };
        this.getDate = (index) => {
            return internal[2][index];
        };
        this.setMessage = (index, value) => {
            const oldValue = internal[0][index];
            internal[0][index] = value;
            return oldValue;
        };
        this.setAuthor = (index, value) => {
            const oldValue = internal[1][index];
            internal[1][index] = value;
            return oldValue;
        };
        this.setDate = (index, value) => {
            const oldValue = internal[2][index];
            internal[2][index] = value;
            return oldValue;
        }
    }
}

module.exports = Queue;
