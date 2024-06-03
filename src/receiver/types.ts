export interface ShimaConfig {
    POLLING_ENDPOINT: string;
}

export type CustomHeaders = Map<string, string> | {};

export interface IShimaEvent {
    type: string;
    id: string;
    payload: string;
    pollingEndpoint: string;
    customHeaders: CustomHeaders;

    reply(payload: any): Promise<void>;
}

export type Callback = (ev: IShimaEvent) => Promise<any>;
export type TriggerableEvent = {
    type: string,
    callback: Callback
}

export interface IEventsHandlers {
    events: TriggerableEvent[];

    // register(ev: IShimaEvent): Promise<void>;
    on(eventName: string, callback: Callback): Promise<void>;
    handle(ev: IShimaEvent): Promise<any>;
}

export interface IShimaPoller {
    handlers: IEventsHandlers;
    isPolling: boolean;
    tasks: Set<Promise<any>>;

    start(interval: number, fetch: number, headers: CustomHeaders | undefined, endpoint: string, retries: number): Promise<void>;
    __task_manager(ev: IShimaEvent): Promise<void>;
    stop(): Promise<void>;
}