import * as express from 'express';
import { Router } from 'express';
import { BaseRoutes } from '@timetree/base-service';
import usersService, { UsersService } from './users.service';
import errorHandler from '../utils/errorHandler';
import usersModel from './users.model';
import { error } from 'util';

export class UsersRoutes extends BaseRoutes<UsersService> {
  public router: Router;
  private sendPhoneConfirmation;
  private confirmPhone;
  private activate;
  constructor() {
    const router = express.Router();
    super(router, usersService);
    this.router = router;
  }
  initHandlers(service: UsersService) {
    super.initHandlers(service);
  }
  initRoutes(router: Router) {
    super.initRoutes(router);
  }
}

export default function() {
  const routes = new UsersRoutes();
  return routes.router;
}
