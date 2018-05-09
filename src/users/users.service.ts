import { Model } from 'mongoose';
import { BaseService } from '@timetree/base-service';
import UserModel, { IUser, UserPhoneStatusEnum, UserStatusEnum } from './users.model';
import logger from '../utils/logger';

export class UsersService extends BaseService<IUser, Model<IUser>> {
  constructor() {
    super(UserModel);
  }
}

export default new UsersService();
