import * as Nexmo from 'nexmo';
import AuthConfig from '..';

export class Smser {
  private static nexmo;
  private static initialized;
  public static initialize() {
    Smser.nexmo = new Nexmo(AuthConfig.options.smsConfig);
    Smser.initialized = true;
  }

  public sendSms = (to, code) => {
    if (!Smser.initialized) {
      Smser.initialize();
    }
    return new Promise((resolve, reject) => {
      const text = `Te-ai inregistrat cu succes in aplicatia ${AuthConfig.options.appTitle}! Codul tau de verificare este: ${code} `;
      const sent = Smser.nexmo.message.sendSms(AuthConfig.options.appTitle, to, text, (error, response) => {
        if (error) {
          reject(error);
        } else if (response.messages[0].status !== '0') {
          reject('Nexmo returned back a non-zero status');
        } else {
        }
      });
      resolve(sent);
    });
  };
}
export default new Smser();
