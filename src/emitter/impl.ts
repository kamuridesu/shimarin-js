import { randomUUID } from "crypto";
import { Callback, ICallbackHandlers, IShimaEmitter, IShimaEvent } from "./types.js";

export class EventTimeoutError extends Error {
    constructor() {
        super("Event timed-out while waiting for answer");
    }
}

export class ShimaEvent implements IShimaEvent {
    type: string;
    payload: string;
    callback: Callback;
    id: string;
    answer: any;
    __creationDate: number;

    done = false;
    delete = true;
    answered = false;

    constructor(type: string, payload: string, callback: Callback) {
        this.type = type;
        this.payload = payload;
        this.callback = callback;
        this.__creationDate = Date.now();
        this.id = randomUUID();
        this.answer = null;
    }

    age() {
        return Date.now() - this.__creationDate;
    }

    async getAnswer(timeout: number) {
        const start = Date.now();
        do {
            if ((Date.now() - start) >= timeout) {
                throw EventTimeoutError
            }
        } while (!this.answered);
        return this.answer;
    }

    toJson(): string {
        return JSON.stringify({
            event_type: this.type,
            payload: this.payload,
            identifier: this.id
        });
    }

    async trigger(replyPayload: string) {
        this.answer = await this.callback(replyPayload);
        this.answered = true;
    }
}

export class CallbackHandlers implements ICallbackHandlers {
    events: IShimaEvent[] = [];

    constructor() {}

    async handle(uuid: string, replyPayload: any) {
        const ev = this.events.find(x => x.id == uuid);
        if (ev) return ev.trigger(replyPayload);
        return null;
    }

    async register(event: IShimaEvent) {
        this.events.push(event);
    }
}

export class ShimaEmitter implements IShimaEmitter {
    events: IShimaEvent[] = [];
    handlers: ICallbackHandlers;
    maxAgeSeconds: number;

    constructor(maxAgeSeconds: number) {
        this.handlers = new CallbackHandlers();
        this.maxAgeSeconds = maxAgeSeconds;
    }

    async cleanOldItems() {
        const removeCallback = (x: IShimaEvent) => {
            x.done || (this.maxAgeSeconds != 0 ? (x.age() > this.maxAgeSeconds) : false)
        }
        this.events = this.events.filter(removeCallback);
        this.handlers.events = this.handlers.events.filter(removeCallback);
    }

    async fetch(last: boolean) {
        await this.cleanOldItems();
        const ev = this.events.splice(last ? -1 : 0, 1)[0];
        await this.handlers.register(ev);
        return ev;
    }

    async send(event: IShimaEvent) {
        await this.cleanOldItems();
        this.events.push(event);
    }

    async handle(uuid: string, replyPayload: any) {
        await this.cleanOldItems();
        return await this.handlers.handle(uuid, replyPayload);
    }

}
