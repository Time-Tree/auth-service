import { Model, PassportLocalModel } from 'mongoose';
import { BaseService, isError, IErrorInfo } from '@timetree/base-service';
import * as uuid from 'uuid';
import { sign } from 'jsonwebtoken';
import * as expressJwt from 'express-jwt';
import * as passport from 'passport';
import { promisify } from 'util';
import * as passportLocalMongoose from 'passport-local-mongoose';

import logger from './utils/logger';
import { ErrorCodes, AuthActions } from './constants/types';
import { IUser, UserStatusEnum, UserPhoneStatusEnum } from './users/users.model';
import UserService from './users/users.service';
import AuthConfig from '.';
import { register } from './templates/register';
import { reset } from './templates/reset';
import { changed } from './templates/changed';
import Smser from './utils/sms';

export class AuthService extends BaseService<IUser, Model<IUser>> {
  public model: any;
  private jwtAuth;
  constructor(userModel, private secret) {
    super(userModel);
    this.jwtAuth = expressJwt({ secret });
  }

  async register(user: IUser) {
    logger.msg('Registering user with email: ' + user.email);
    const password = user.password as string;
    delete user.password;
    user.emailStatus = UserStatusEnum.PENDING_ACTIVATION;
    const suser = await this.serialize(user, AuthActions.REGISTER);
    const newUser = new this.model(suser);
    return new Promise((resolve, reject) => {
      this.model.register(newUser, password, async (err, u: IUser) => {
        if (err) {
          reject(err);
        } else {
          u.registrationToken = uuid();
          await u.save();
          if (AuthConfig.options.pubSubService) {
            AuthConfig.options.pubSubService.publishEvent('USER_REGISTERED', {
              user: u,
              appTitle: AuthConfig.options.appTitle
            });
          }
          if (AuthConfig.options.emailConfirmation) {
            // TODO: create mail templates take out of service write
            AuthConfig.options.mailerService &&
              AuthConfig.options.mailerService.sendMail(
                user.email,
                `Verificare email pentru aplicatia ${AuthConfig.options.appTitle} `,
                register(u)
              );
          }
          if (AuthConfig.options.smsConfirmation) {
            this.sendPhoneConfirmationCode(`${u._id}`);
          }
          resolve({
            id: u._id,
            username: u.username,
            firstname: u.firstname,
            lastname: u.lastname,
            email: u.email
          });
        }
      });
    });
  }

  login(req, res) {
    return new Promise(async (resolve, reject) => {
      try {
        const user: any = await this.authenticate(req, res);
        const suser = await this.serialize(user, AuthActions.LOGIN);
        const token = sign(await this.serialize(user, AuthActions.LOGIN), this.secret, { expiresIn: 24 * 120 * 60 });
        if (AuthConfig.options.pubSubService) {
          AuthConfig.options.pubSubService.publishEvent('USER_LOGGEDIN', {
            userId: suser.id,
            player_id: req.body.player_id
          });
        }
        resolve({
          user: suser,
          token
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  async logout(req) {
    console.warn('logout service');
    if (AuthConfig.options.pubSubService) {
      AuthConfig.options.pubSubService.publishEvent('USER_LOGGEDOUT', {
        userId: req.user.id,
        player_id: req.query.player_id
      });
    }
    req.logout();
    console.warn('req.logout');
    return req.session && req.session.save();
  }

  async changePass(req, res) {
    return new Promise(async (resolve, reject) => {
      try {
        const user: any = await this.authenticate(req, res);
        user.changePassword(req.body.password, req.body.newPassword, err => {
          if (err) {
            reject(err);
          }
          resolve(this.serialize(user));
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  authenticate(req, res) {
    return new Promise((resolve, reject) => {
      passport.authenticate('local', { session: true }, (err, user, info) => {
        logger.msg('Trying to login user with email: ');
        if (err) {
          return reject(err);
        }
        if (user.emailStatus === UserStatusEnum.PENDING_ACTIVATION && user.phoneStatus === UserPhoneStatusEnum.NOT_CONFIRMED) {
          return reject({
            code: 'NOT_ACTIVATED',
            message: 'Please activate accout using the link sent to your email'
          });
        }
        if (!user) {
          return reject({
            code: 'INCORECT_PASSWORD',
            message: (info && info.message) || 'Password or username is incorrect',
            name: info && info.name
          });
        }
        return resolve(user);
      })(req, res);
    });
  }

  // middlewares
  checkForAuth = (req, res, next) => {
    console.warn('checking for auth');
    if (req.user) {
      return next();
    }
    return this.jwtAuth(req, res, next);
  };

  enrichAuth = (req, res, next) => {
    console.warn('enriched route');
    this.checkForAuth(req, res, err => {
      next();
    });
  };

  async forgotPass(email) {
    const user = await this.model.findOne({ email });
    if (user) {
      const token = uuid();
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000;
      const saveduser = await user.save();
      AuthConfig.options.mailerService && AuthConfig.options.mailerService.sendMail(user.email, `Account Password Reset`, reset(saveduser));
      return saveduser;
    }
    return Promise.reject('User not found');
  }

  async resetPass(token, password) {
    const user: any = await this.model.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) {
      return Promise.reject({
        code: 'TOKEN_EXPIRED',
        message: 'Password reset token is invalid or has expired.'
      });
    }
    user.setPassword(password, async error => {
      if (error) {
        return error;
      }
      user.resetPasswordExpires = undefined;
      user.resetPasswordToken = undefined;
      await user.save();
      AuthConfig.options.mailerService && AuthConfig.options.mailerService.sendMail(user.email, `Account Password Reset`, changed(user));
    });
  }

  async sendPhoneConfirmationCode(user: string | IUser | IErrorInfo) {
    if (typeof user === 'string') {
      user = await this.getById(user);
    }
    if (user) {
      const smsResponse = await Smser.sendSms((user as IUser).phone, (user as IUser).phoneCode);
      return smsResponse;
    }
  }

  async confirmPhone(sentCode, userId) {
    return new Promise(async (resolve, reject) => {
      const user = await this.getById(userId);
      if (isError(user)) return Promise.reject(user);
      if (user && user.phoneCode === parseInt(sentCode, 10)) {
        const mergedEntity = Object.assign(user, { phoneStatus: UserPhoneStatusEnum.CONFIRMED });
        await this.model.update({ _id: userId }, mergedEntity, { upsert: true });
        resolve(mergedEntity);
      } else reject(new Error('Code not the same'));
    });
  }

  async activate(registrationToken: string) {
    return new Promise((resolve, reject) => {
      this.model.findOne({ emailStatus: UserStatusEnum.PENDING_ACTIVATION, registrationToken }).then(async user => {
        if (user) {
          user.emailStatus = UserStatusEnum.REGISTERED;
          user.registrationToken = undefined;
          await user.save();
          resolve('Succes');
        } else {
          reject({
            code: 'NO ACTIVATION FOUND',
            message: 'Already activated'
          });
        }
      });
    });
  }

  private async serialize(user, action?) {
    // we store the updated information in req.user again
    const { id, username, email, firstname, lastname, emailStatus, deleted } = user;
    const userFields = {};
    if (AuthConfig.options.userFields) {
      AuthConfig.options.userFields.forEach(field => {
        userFields[field] = user[field];
      });
    }
    let suser = {
      id,
      username,
      email,
      firstname,
      lastname,
      emailStatus,
      deleted,
      ...userFields
    };
    if (AuthConfig.options.serializationHelper) {
      suser = await AuthConfig.options.serializationHelper(suser, action);
    }
    return suser;
  }

  private verifyStatus(user) {
    if (user.status !== UserStatusEnum.ACTIVE) {
      if (!user.status) {
        throw { code: ErrorCodes.ACCOUNT_INCOMPLETE };
      }
      if (user.status === UserStatusEnum.PENDING_ACTIVATION) {
        throw { code: ErrorCodes.ACCOUNT_INACTIVE };
      }
    }
  }
}
