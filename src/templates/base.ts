import AuthConfig from '..';
import * as mjml2html from 'mjml';

export const head = title => `<mj-head>
<mj-title>${title}</mj-title>
<mj-font name="Roboto" href="https://fonts.googleapis.com/css?family=Roboto:300,500"></mj-font>
    <mj-attributes>
      <mj-all font-family="Roboto, Helvetica, sans-serif"></mj-all>
      <mj-text font-weight="300" font-size="16px" color="#616161" line-height="24px"></mj-text>
      <mj-section padding="0px"></mj-section>
    </mj-attributes>
</mj-head>`;

export const footer = (email, host, socialMedia) => {
  const options = AuthConfig.options;
  return `<mj-section>
    <mj-column width="11%">
      <mj-image padding-right="0px" padding-left="25px" align="left" width="70px" href="${host}" src=${process.env.REGAGE_LOGO}></mj-image>
    </mj-column>
    <mj-column width="89%">
      <mj-text padding="0 25px">
        <p style="color:#BDBDBD; line-height: 9px"> Need our help? - <a href="${host}" style="color: #3498DB;">
            ${options.appTitle}
          </a> team </p>
        <p style="font-style: italic; color:#BDBDBD; margin-top: 20px"> If you have any questions please contact us at ${email}</p>
      </mj-text>
    </mj-column>
  </mj-section>
  <mj-section text-align="left">
    <mj-column width="25%">
      <mj-table>
        <tr style="list-style: none;line-height:1">
          <td> <a href=${socialMedia.facebook}>
                <img width="25" src="https://cdn.recast.ai/newsletter/facebook.png" />
              </a> </td>
          <td> <a href=${socialMedia.linkedin}>
                <img width="25" src="https://cdn.recast.ai/newsletter/linkedin.png" />
              </a> </td>
        </tr>
      </mj-table>
    </mj-column>
  </mj-section>`;
};

export const baseMail = body => {
  const options = AuthConfig.options;
  return mjml2html(`<mjml>
      ${head(options.appTitle)}
      <mj-body>
        ${body}
        ${footer(options.contactEmail || `contact@${options.host}`, options.host, options.emailSocialMedia)}
      </mj-body>
      </mjml>`).html;
};