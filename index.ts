import { EventHandlers, EventPolling } from "./src/receiver.js";
import { app, EMITTER, CONTEXT_PATH } from "./src/plugins/express.js";
import { ShimaEvent } from "./src/emitter.js";

const client = (async () => {
    const handlers = new EventHandlers();

    handlers.on("update", async (ev) => {
        ev.payload = JSON.parse(ev.payload);

        ev.reply({
            done: true
        })
    });

    const poller = new EventPolling(handlers);

    await poller.start(1, 1, undefined, "http://localhost:2222");
});

const server = (async () => {

    async function handleTest(params: Map<string, string>) {
        const event = new ShimaEvent('update', JSON.stringify(params), JSON.parse);
        await EMITTER.send(event);
        console.log("waiting for answer");
        try {
            return await event.getAnswer(5);
        } catch (e) {
            return 'fail';
        }
    }

    app.get(CONTEXT_PATH + "/test", async (req, res) => {
        const args = req.body ? JSON.parse(req.body) : {};
        const result = await handleTest(args);
        res.setHeader("Content-Type", "application/json");
        res.send(result);
    });

    app.listen(2222, () => {
        "Running on 2222";
    });
});

server();
