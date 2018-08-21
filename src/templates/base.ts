import AuthConfig from '..';
import * as mjml2html from 'mjml';

export const head = title => `<mj-head>
<mj-title>${title}</mj-title>
<mj-font name="Roboto" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500"></mj-font>
<mj-attributes>
  <mj-all font-family="Roboto, Helvetica, Arial, sans-serif"></mj-all>
  <mj-text font-weight="400" font-size="16px" color="#000000" line-height="24px"></mj-text>
  <mj-section padding="0px"></mj-section>
</mj-attributes>
</mj-head>`;

export const logo = host => `<mj-section padding="10px 10px 0 0" background-color="#000000">
<mj-column width="25%">
  <mj-image src="${host}/logo.png" alt="" align="center" border="none" padding="0px"></mj-image>
</mj-column>
<mj-column></mj-column>
</mj-section>`;

export const footer = (email, host) =>
  `<mj-section padding="10px 20px" vertical-align="middle" background-color="#DDDDDD">
      <mj-column width="100%">
        <mj-text align="left" font-weight="500">NEED OUR HELP?</mj-text>
        <mj-text align="left" font-weight="500">If you have any questions please contact us at ${email}.</mj-text>
        <mj-text align="left" font-weight="400">Thank you!</mj-text>
      </mj-column>
    </mj-section>
    <mj-section padding="50px 0 0 0" background-color="#000000">
      <mj-column>
      </mj-column>
    </mj-section>`;

export const baseMail = body => {
  const options = AuthConfig.options;
  return mjml2html(`<mjml>
      ${head(options.appTitle)}
      <mj-body background-color="#F2F2F2">
        ${logo(options.host)}
        <mj-section padding="10px 20px" background-color="#FFFFFF">
        ${body}
        </mj-section>
        ${footer(options.contactEmail || `contact@${options.host}`, options.host)}
      </mj-body>
      </mjml>`).html;
};
