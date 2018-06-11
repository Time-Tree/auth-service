import * as passport from 'passport';
import * as passportLocal from 'passport-local';
import UserModel, { IUser } from './users/users.model';
import { PassportLocalModel, Document, Model } from 'mongoose';
import * as passportLocalMongoose from 'passport-local-mongoose';
import { AuthRoutes } from './auth.routes';
import Mailer from './services/mailer';
import { AuthService } from './auth.service';
const LocalStrategy = passportLocal.Strategy;

export interface AuthConfigOptions {
  secretKey: string;
  emailConfirmation?: boolean;
  smsConfirmation?: boolean;
  mailerService?: {
    sendMail: (to, subject, body) => Promise<any>;
  };
  userModel?: Model<Document>;
  host?: string;
  appTitle?: string;
  contactEmail?: string;
  mailerApiKey?: string;
  smsConfig?: {
    apiKey?: string;
    apiSecret?: string;
  };
  publicRoutes?: string[];
  enrichedRoutes?: string[];
  userFields?;
}

const DefaultConfigOptions: AuthConfigOptions = {
  secretKey: process.env.SECRET_KEY || '',
  emailConfirmation: true,
  smsConfirmation: false,
  userModel: UserModel,
  host: process.env.HOST,
  appTitle: process.env.APP_NAME,
  contactEmail: process.env.CONTACT_EMAIL,
  mailerApiKey: process.env.SENDGRID_API_KEY,
  smsConfig: {
    apiKey: process.env.NEXMO_API_KEY,
    apiSecret: process.env.NEXMO_SECRET_KEY
  }
};

export const mergedOptions: AuthConfigOptions = { secretKey: process.env.SECRET_KEY || '' };

export class AuthConfig {
  public static options: AuthConfigOptions;

  constructor(app, opts?: AuthConfigOptions) {
    const mailerService = (opts && opts.mailerService) || new Mailer(opts && opts.mailerApiKey) || process.env.SENDGRID_API_KEY;
    AuthConfig.options = { ...DefaultConfigOptions, mailerService, ...opts };
    Object.assign(mergedOptions, AuthConfig.options);

    app.use(passport.initialize());
    app.use(passport.session());
    // passport config
    const authService = new AuthService(AuthConfig.options.userModel, AuthConfig.options.secretKey);
    const authRoutes = new AuthRoutes(authService);
    app.use('/auth', authRoutes.router);
    const user = AuthConfig.options.userModel as PassportLocalModel<IUser>;
    const pubRoutes = (AuthConfig.options.publicRoutes || []).concat('auth\\/login', 'auth\\/register', 'auth\\/activation').join('|');
    const publicRegExp = new RegExp(`^(?!.*(${pubRoutes})).*$`);
    app.use(publicRegExp, authService.checkForAuth);
    const enrichRoutes = (AuthConfig.options.enrichedRoutes || []).concat('auth\\/logout').join('|');
    const enrichRegExp = new RegExp(`^(.*(${enrichRoutes})).*$`);
    app.use(enrichRegExp, authService.enrichAuth);
    passport.use(new LocalStrategy(user.authenticate()));
    passport.serializeUser(user.serializeUser());
    passport.deserializeUser(user.deserializeUser());
  }
}
