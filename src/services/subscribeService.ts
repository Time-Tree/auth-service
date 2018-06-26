import logger from '../utils/logger';
import mailer from '../services/mailer';
import * as redis from 'redis';

const REDIS_URI = 'redis://h:pd4d5c04a48fa9d6ccbb59a66f8b229c7416cf10267f80b28fcf1' +
  '888ef00d4797@ec2-52-18-250-243.eu-west-1.compute.amazonaws.com:7119';

export class SubscribeService {
  private static listSub = new Map();
  private sub;
  constructor() {
    this.sub = redis.createClient({ url: REDIS_URI });
  }

  subscribeEvent(channel: string, handler: (data: any) => void) {
    if (!SubscribeService.listSub.get(channel)) {
      SubscribeService.listSub.set(channel, true);
      this.sub.on('message', async (_channel, message) => {
        try {
          if (channel === _channel) {
            const msg = JSON.parse(message);
            await handler(msg);
          }
        } catch (e) {
          logger.msg(e);
        }
      });
    }

    this.sub.subscribe(channel);

    const unsubscribe = () => {
      this.sub.unsubscribe(channel);
      SubscribeService.listSub.set(channel, false);
    };

    return unsubscribe;

  }
}

export default new SubscribeService();