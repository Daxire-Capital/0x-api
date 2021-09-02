import { connect, Msg, NatsConnection, StringCodec, Subscription } from 'nats';

const sc = StringCodec();
let nc: NatsConnection;

export const init = async (): Promise<void> => {
    try {
        nc = await connect({ servers: `nats://localhost:4222` });
        console.info(`connected to ${nc.getServer()}`);
    } catch (err) {
        console.info(`error connecting to ${process.env.NATS_URI}`);
    }
};

export const close = async (): Promise<void> => {
    try {
        await nc.close();
    } catch (e) {
        console.error(e);
    }
};

export const publish = <T>(topic: string, payload: T): void => {
    nc.publish(topic, sc.encode(JSON.stringify(payload)));
};

export const subscribe = (topic: string, onRequest: (message: Msg, stringCodec: typeof sc) => void): void => {
    const sub = nc.subscribe(topic, { queue: 'queue:requests', timeout: 5000000 });
    (async (sub: Subscription) => {
        console.log(`listening for ${sub.getSubject()} requests...`);
        for await (const m of sub) {
            onRequest(m, sc);
        }
        console.log(`subscription ${sub.getSubject()} drained.`);
    })(sub);
};
