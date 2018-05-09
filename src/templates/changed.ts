import * as mjml2html from 'mjml';
import AuthConfig from '..';
import { baseMail } from './base';
import { IUser } from '../users/users.model';
// tslint:disable:max-line-length
export const changed = (user: IUser) => {
  const options = AuthConfig.options;
  return baseMail(`
      <mj-column width="auto">
        <mj-text align="left" font-weight="400">Dear ${user.firstname} ${user.lastname}</mj-text>
        <mj-text align="left" font-weight="400">Your password has been changed.</mj-text>
      </mj-column>
    `);
};
