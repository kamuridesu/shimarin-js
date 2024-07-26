import express from "express";
import { ShimaEmitter } from "../../emitter.js";

export const EMITTER = new ShimaEmitter();

export const app = express();

export const CONTEXT_PATH = process.env.CONTEXT_PATH != undefined ? process.env.CONTEXT_PATH : '';

app.get(CONTEXT_PATH + '/events', async (req, res) => {
    const fetch = req.params.fetch;
    const eventsToSend = fetch ? parseInt(fetch) : 1;
    const events = [];
    for (let i = 0; i < eventsToSend; i++) {
        const lastEv = await EMITTER.fetch(true);
        if (lastEv) {
            events.push(lastEv.toJson());
        }
    }
    res.setHeader("Content-Type", "application/json");
    res.send(events);
});

app.get(CONTEXT_PATH + "/callback", express.raw({type: '*/*'}) ,async (req, res) => {

    const data = req.body ? JSON.parse(req.body) : {};
    if (data) {
        const id = data.identifier;
        const payload = data.payload;
        await EMITTER.handle(id, payload);
    }
    res.setHeader("Content-Type", "application/json");
    res.send({
        "ok": true
    });
});