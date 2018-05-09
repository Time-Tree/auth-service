import * as sendgrid from '@sendgrid/mail';
import logger from '../utils/logger';

const sg: any = sendgrid;
export default class Mailer {
  constructor(apiKey?: string) {
    const key = apiKey || process.env.SENDGRID_API_KEY;
    if (!key) {
      throw new Error('An api key is required for the mailer to be initialized');
    }
    sendgrid.setApiKey(key);
  }

  public sendMail = async (to, subject, html?, text?) => {
    const msg = {
      to,
      from: {
        name: 'Regage',
        email: 'regage@timetree.io'
      },
      subject,
      text,
      html
    };
    return await sg.send(msg);
  };
}
