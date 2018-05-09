import * as express from 'express';
import { Router } from 'express';
import * as passport from 'passport';
import * as uuid from 'uuid';

import { BaseRoutes } from '@timetree/base-service';

import { AuthService } from './auth.service';
import errorHandler from './utils/errorHandler';
import UserRepo, { IUser, UserPhoneStatusEnum } from './users/users.model';
import AuthConfig from '.';

export class AuthRoutes extends BaseRoutes<AuthService> {
  public router: Router;
  private register;
  private login;
  private logout;
  private changePass;
  private forgotPass;
  private resetPass;
  private sendPhoneConfirmation;
  private confirmPhone;
  private activate;
  constructor(authService: AuthService) {
    const router = express.Router();

    super(router, authService);
    this.router = router;
  }
  initHandlers(service: AuthService) {
    super.initHandlers(service);
    this.register = this.routeHandler(service.register, req => [req.body]);
    this.login = this.routeHandler(service.login, req => [req]);
    this.logout = this.routeHandler(service.logout, req => [req]);
    this.changePass = this.routeHandler(service.changePass, req => [req, req.body.password, req.body.newPassword]);
    this.forgotPass = this.routeHandler(service.forgotPass, req => [req.body.email]);
    this.resetPass = this.routeHandler(service.resetPass, req => [req.params.token, req.body.password]);
    this.sendPhoneConfirmation = this.routeHandler(service.sendPhoneConfirmationCode, req => [req.params.userId]);
    this.confirmPhone = this.routeHandler(service.confirmPhone, req => [req.body.phoneCode, req.params.userId]);
    this.activate = this.routeHandler(service.activate, req => [req.params.token]);
  }
  initRoutes(router: Router) {
    router.post('/register', this.register);
    // ok
    router.post('/login', this.login);
    // ok
    router.get('/logout', this.logout);
    // not ok
    router.post('/change-pass', this.changePass);
    // ok
    router.post('/forgot-pass', this.forgotPass);
    // ok
    router.post('/reset-pass/:token', this.resetPass);
    // ok
    router.get('/confirmPhone/:userId', this.sendPhoneConfirmation);
    router.get('/activation/:token', this.activate);
    // ok
    router.post('/confirmPhone/:userId', this.confirmPhone);
  }
}
