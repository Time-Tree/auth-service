import * as redis from 'redis';

const REDIS_URI = 'redis://h:pd4d5c04a48fa9d6ccbb59a66f8b229c7416cf10267f80b28fcf1' +
  '888ef00d4797@ec2-52-18-250-243.eu-west-1.compute.amazonaws.com:7119';

export class PublishService {
  private pub;
  constructor() {
    this.pub = redis.createClient({ url: REDIS_URI });
  }

  publishEvent(channel: string, data: any) {
    this.pub.publish(channel, JSON.stringify(data));
  }
}

export default new PublishService();