import * as mongoose from 'mongoose';
import { PassportLocalModel, Document } from 'mongoose';
import * as passportLocalMongoose from 'passport-local-mongoose';

const Schema = mongoose.Schema;

export enum UserStatusEnum {
  REGISTERED = 'REGISTERED',
  ACTIVE = 'ACTIVE',
  PENDING_ACTIVATION = 'PENDING_ACTIVATION'
}
export enum UserPhoneStatusEnum {
  CONFIRMED = 'CONFIRMED',
  NOT_CONFIRMED = 'NOT_CONFIRMED'
}

export interface IUser extends Document {
  username?: string;
  firstname: string;
  lastname: string;
  password?: string;
  email: string;
  phone?: string;
  attempts?: number;
  emailStatus?: string;
  phoneStatus?: UserPhoneStatusEnum;
  phoneCode?: number;
  registrationToken?: string;
  type?: string;
  deleted?: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: number;
}

const UserRepo = new Schema({
  username: {
    type: String,
    required: false
  },
  firstname: String,
  lastname: String,
  password: String,
  email: {
    type: String,
    unique: true,
    required: true
  },
  phone: {
    type: String,
    required: false
  },
  attempts: {
    type: Number,
    required: false
  },
  phoneStatus: {
    type: UserPhoneStatusEnum,
    required: false,
    default: UserPhoneStatusEnum.NOT_CONFIRMED
  },
  phoneCode: {
    type: Number,
    required: false,
    default: Math.floor(Math.random() * 900000) + 100000
  },
  emailStatus: {
    type: UserStatusEnum,
    required: false,
    default: UserStatusEnum.PENDING_ACTIVATION
  },
  registrationToken: {
    type: String,
    required: false
  },
  type: {
    type: String,
    required: false
  },
  deleted: {
    type: Boolean,
    required: false,
    default: false
  },
  resetPasswordToken: {
    type: String,
    required: false
  },
  resetPasswordExpires: {
    type: Number,
    required: false
  }
});

UserRepo.plugin(passportLocalMongoose, {
  usernameField: 'email',
  usernameLowerCase: true,
  attemptsField: 'attempts',
  selectFields: 'username email phone type emailStatus phoneStatus'
});

const LocalUser = mongoose.model('users', UserRepo) as PassportLocalModel<IUser>;
export default LocalUser;
