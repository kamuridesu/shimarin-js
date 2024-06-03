import { EventHandlers, EventPolling } from "./src/receiver.js";


const handlers = new EventHandlers();

handlers.on("update", async (ev) => {
    console.log(ev);
    ev.reply({
        done: true
    })
});

const poller = new EventPolling(handlers);

poller.start(1, 1, undefined, "http://localhost:2222");
