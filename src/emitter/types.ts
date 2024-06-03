
export type Callback = (payload: any) => Promise<any>;

export interface IShimaEvent {
    type: string;
    payload: string;
    callback: Callback;
    id: string;
    answered: boolean;
    answer: any;
    __creationDate: number;
    done: boolean;
    delete: boolean;

    age(): number;
    getAnswer(timeout: number): Promise<any>;
    toJson(): string;
    trigger(replyPayload: string): Promise<any>;
}

export interface ICallbackHandlers {
    events: IShimaEvent[];

    register(event: IShimaEvent): Promise<void>;
    handle(uuid: string, replyPayload: any): Promise<any>;
}

export interface IShimaEmitter {
    events: IShimaEvent[];
    handlers: ICallbackHandlers;
    maxAgeSeconds: number;

    cleanOldItems(): Promise<void>;
    fetch(last: boolean): Promise<IShimaEvent | null>;
    send(event: IShimaEvent): Promise<void>;
    handle(uuid: string, replyPayload: any): Promise<any>;
}