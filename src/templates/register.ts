import * as mjml2html from 'mjml';
import AuthConfig from '..';
import { baseMail } from './base';
import { IUser } from '../users/users.model';
// tslint:disable:max-line-length
export const register = (user: IUser) => {
  const options = AuthConfig.options;
  return baseMail(`
      <mj-column width="auto">
        <mj-text align="left" font-weight="400">Dear ${user.firstname} ${user.lastname}</mj-text>
        <mj-text align="left" font-weight="400">Please activate your account ${options.host}/auth/activation/${
    user.registrationToken
    }.</mj-text>
      </mj-column>
    `);
};
