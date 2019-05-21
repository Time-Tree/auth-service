import * as mjml2html from 'mjml';
import AuthConfig from '..';
import { baseMail } from './base';
import { IUser } from '../users/users.model';
// tslint:disable:max-line-length
export const changed = (user: IUser) => {
  const options = AuthConfig.options;
  return baseMail(`
    <mj-section padding="30px 0">
      <mj-column width="45%">
        <mj-text align="center" font-weight="500" padding="0px" font-size="18px">Account Password Reset</mj-text>
          <mj-image align="center" width="70px" href="${options.host}" src=${process.env.REGAGE_LOGO}></mj-image>
      </mj-column>
    </mj-section>
      <mj-section>
        <mj-column width="100%">
          <mj-text>
            <p>Dear ${user.firstname} ${user.lastname},</p>
            <p>Your password has been changed successfully! </p>
          </mj-text>
        </mj-column>
      </mj-section>
    `);
};
