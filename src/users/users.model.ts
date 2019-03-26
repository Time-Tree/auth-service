import * as mongoose from 'mongoose';
import { PassportLocalModel, Document } from 'mongoose';
import * as passportLocalMongoose from 'passport-local-mongoose';
import AuthConfig from '..';

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
  facebookId?: string;
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
  facebookId: {
    type: String,
    select: false
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

UserRepo.statics.upsertFbUser = function(accessToken, refreshToken, profile, cb) {
  const model = AuthConfig.options.userModel || this;
  return model.findOne({ facebookId: profile.id }, (err, user) => {
    if (!user) {
      const newUser = new model({
        email: profile._json.email,
        firstname: profile._json.first_name,
        lastname: profile._json.last_name,
        facebookId: profile.id,
        emailStatus: UserStatusEnum.REGISTERED
      });

      newUser.save((error, savedUser) => {
        if (error) {
          return cb(error, null);
        }
        if (AuthConfig.options.pubSubService) {
          AuthConfig.options.pubSubService.publishEvent('USER_REGISTERED', {
            user: savedUser,
            appTitle: AuthConfig.options.appTitle
          });
        }
        return cb(error, savedUser);
      });
    } else {
      return cb(err, user);
    }
  });
};

UserRepo.plugin(passportLocalMongoose, {
  usernameField: 'email',
  usernameLowerCase: true,
  attemptsField: 'attempts',
  selectFields: 'username email phone type emailStatus phoneStatus'
});

const LocalUser = mongoose.model('users', UserRepo) as PassportLocalModel<IUser>;
export default LocalUser;
