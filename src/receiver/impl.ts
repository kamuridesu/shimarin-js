import { fetchEvents, sendReply } from "./network.js";
import { Callback,
    CustomHeaders,
    IEventsHandlers,
    ShimaConfig,
    IShimaEvent,
    IShimaPoller, 
    TriggerableEvent
} from "./types.js";

export const Config: ShimaConfig = {
    POLLING_ENDPOINT: process.env.SERVER_ENDPOINT ? process.env.SERVER_ENDPOINT : "",
}

export class ReplySendError extends Error {
    constructor() {
        super("An exception occured while sending reply");
    }
}

export class FetchEventsError extends Error {
    constructor() {
        super("An exception occured while fetching events, retries expired");
    }
}

export class ShimaEvent implements IShimaEvent {
    type: string;
    id: string;
    payload: string;
    pollingEndpoint: string;
    customHeaders: CustomHeaders;

    constructor(type: string,
        id: string,
        payload: string,
        pollingEndpoint: string | undefined,
        customHeaders: CustomHeaders = {}) 
    {
        this.customHeaders = customHeaders;
        this.id = id;
        this.payload = payload;
        this.pollingEndpoint = pollingEndpoint == undefined ? Config.POLLING_ENDPOINT : pollingEndpoint;
        this.type = type;
    }

    async reply(payload: any) {
        const body = {
            "identifier": this.id,
            "payload": JSON.stringify(payload)
        };
        const r = await sendReply(this.pollingEndpoint, body, this.customHeaders);
        if (r.status != 200) {
            throw ReplySendError;
        }
    }
}

export class EventHandlers implements IEventsHandlers {
    events: TriggerableEvent[] = [];

    async handle(ev: IShimaEvent) {
        const event = this.events.find(e => e.type == ev.type);
        if (event != undefined) {
            return await event.callback(ev);
        }
    }

    async on(eventName: string, callback: Callback) {
        this.events.push({
            type: eventName,
            callback
        });
    }
}

export interface IShimaIncomingEvent {
    event_type: string;
    payload: any;
    identifier: string;
}

export class EventPolling implements IShimaPoller {
    handlers: IEventsHandlers;
    isPolling: boolean = false;
    tasks: Set<Promise<any>> = new Set();

    constructor(
        handler: IEventsHandlers
    ) {
        this.handlers = handler;
    }

    async start(interval: number, fetch: number, headers?: CustomHeaders, endpoint: string = Config.POLLING_ENDPOINT, retries: number = 5) {
        this.isPolling = true;
        while (true) {
            for (let i = 0; i < retries; i++) {
                if (!this.isPolling) return;
                try {
                    const events = await fetchEvents(endpoint, fetch, headers ? headers : {});
                    if (events.status == 200) {
                        const eventData: IShimaIncomingEvent[] = events.data;
                        eventData.forEach(async x => {
                            const ev = new ShimaEvent(
                                x.event_type,
                                x.identifier,
                                x.payload,
                                endpoint,
                                headers
                            );
                            await this.__task_manager(ev);
                        });
                        break;
                    }
                } catch (e) {
                    console.log(e)
                    console.log("Error connecting to " + endpoint + "! Retrying...");
                    await new Promise(r => setTimeout(r, 1));
                }
                await new Promise(r => setTimeout(r, interval));
            }
        }
    }

    async stop() {
        Promise.all(this.tasks).then(() => this.isPolling = false);
        this.isPolling = false;
    }

    async __task_manager(ev: IShimaEvent) {
        const task = this.handlers.handle(ev);
        this.tasks.add(task);
        task.then(() => {
            this.tasks.delete(task);
        }).catch(e => {
            this.tasks.delete(task);
            console.error("Task for event " + ev.type + " failed with error " + e);
        });
    }
}