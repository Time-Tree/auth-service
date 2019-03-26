import * as passport from 'passport';
import * as passportLocal from 'passport-local';
import * as FacebookTokenStrategy from 'passport-facebook-token';
import UserModel, { IUser } from './users/users.model';
import { PassportLocalModel, Document, Model } from 'mongoose';
import * as passportLocalMongoose from 'passport-local-mongoose';
import { AuthRoutes } from './auth.routes';
import Mailer from './services/mailer';
import { AuthService } from './auth.service';
const LocalStrategy = passportLocal.Strategy;

export interface IPubSubService {
  subscribeEvent: (event: string, handler: (data) => void) => () => void;
  publishEvent: (event: string, data: any) => void;
}

export interface AuthConfigOptions {
  secretKey: string;
  emailConfirmation?: boolean;
  smsConfirmation?: boolean;
  facebookLogin?: boolean;
  fbClientId?: string;
  fbClientSecret?: string;
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
  serializationHelper?: (user, action?) => any;
  pubSubService?: IPubSubService;
  mailSenderName?: string;
  mailSenderEmail?: string;
}

const DefaultConfigOptions: AuthConfigOptions = {
  secretKey: process.env.SECRET_KEY || '',
  emailConfirmation: true,
  smsConfirmation: false,
  facebookLogin: false,
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
  private authService;

  constructor(app, opts?: AuthConfigOptions) {
    const mailerService = (opts && opts.mailerService) || new Mailer(opts && opts.mailerApiKey) || process.env.SENDGRID_API_KEY;
    AuthConfig.options = { ...DefaultConfigOptions, mailerService, ...opts };
    Object.assign(mergedOptions, AuthConfig.options);

    app.use(passport.initialize());
    app.use(passport.session());
    // passport config
    this.authService = new AuthService(AuthConfig.options.userModel, AuthConfig.options.secretKey);
    const authRoutes = new AuthRoutes(this.authService);
    const user = AuthConfig.options.userModel as PassportLocalModel<IUser>;
    const enrichRoutes = (AuthConfig.options.enrichedRoutes || []).concat('auth\\/logout').join('|');
    const enrichRegExp = new RegExp(`^(.*(${enrichRoutes})).*$`);
    app.use(enrichRegExp, this.authService.enrichAuth);
    const pubRoutes = (AuthConfig.options.publicRoutes || [])
      .concat('auth\\/logout', 'auth\\/login', 'auth\\/register', 'auth\\/activation', 'auth\\/facebook')
      .join('|');
    const publicRegExp = new RegExp(`^(?!.*(${pubRoutes})).*$`);
    app.use(publicRegExp, this.authService.checkForAuth);
    app.use('/auth', authRoutes.router);
    passport.use(new LocalStrategy(user.authenticate()));
    passport.serializeUser(user.serializeUser());
    passport.deserializeUser(user.deserializeUser());

    if (AuthConfig.options.facebookLogin) {
      passport.use(new FacebookTokenStrategy({
        clientID: AuthConfig.options.fbClientId,
        clientSecret: AuthConfig.options.fbClientSecret
      }, (accessToken, refreshToken, profile, done) => {
        // @ts-ignore
        user.upsertFbUser(accessToken, refreshToken, profile, (err, fbUser) => {
          return done(err, fbUser);
        });
      }));
    }
  }
  public getService = () => this.authService;
}
