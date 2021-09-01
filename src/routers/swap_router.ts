import * as express from 'express';
import * as asyncHandler from 'express-async-handler';

import * as Nats from '../utils/nats';


import { SwapHandlers } from '../handlers/swap_handlers';
import { SwapService } from '../services/swap_service';

// tslint:disable-next-line:completed-docs
export function createSwapRouter(swapService: SwapService): express.Router {
    const router = express.Router();
    const handlers = new SwapHandlers(swapService);

    Nats.init().then(success => {
        Nats.subscribe(`0x:quote`, async (message, stringCodec) => {
            try {
                message.respond(stringCodec.encode(JSON.stringify(await handlers.getQuoteAsync(JSON.parse(message.data.toString())))));
            } catch (e) {
                console.error('Failed to get quote response');
                console.error(e);
            }
        });

        Nats.subscribe(`0x:price`, async (message, stringCodec) => {
            try {
                message.respond(stringCodec.encode(JSON.stringify(await handlers.getQuotePriceAsync(JSON.parse(message.data.toString())))));
            } catch (e) {
                console.error('Failed to get price');
                console.error(e);
            }
        });

        Nats.subscribe(`0x:prices`, async (message, stringCodec) => {
            try {
                message.respond(stringCodec.encode(JSON.stringify(await handlers.getTokenPricesAsync(JSON.parse(message.data.toString())))));
            } catch (e) {
                console.error('Failed to get prices');
                console.error(e);
            }
        });
    }).catch(error => console.error(error));

    router.get('', asyncHandler(SwapHandlers.root.bind(SwapHandlers)));
    router.get('/tokens', asyncHandler(SwapHandlers.getTokens.bind(handlers)));
    router.get('/rfq/registry', asyncHandler(SwapHandlers.getRfqRegistry.bind(handlers)));
    // router.get('/prices', asyncHandler(handlers.getTokenPricesAsync.bind(handlers)));
    // router.get('/quote', asyncHandler(handlers.getQuoteAsync.bind(handlers)));
    // router.get('/price', asyncHandler(handlers.getQuotePriceAsync.bind(handlers)));
    router.get('/depth', asyncHandler(handlers.getMarketDepthAsync.bind(handlers)));
    router.get('/sources', asyncHandler(SwapHandlers.getLiquiditySources.bind(handlers)));

    return router;
}
