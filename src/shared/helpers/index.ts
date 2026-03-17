import slugify from 'slugify';
import env from '../../config/env.config';
const url = require('url');
import * as faker from 'faker';
import * as tokenGen from 'otp-generator';

class SlugifyOptions {
  lower: boolean;
  replacement: string;
}

export class Helper {
  static faker = faker;

  static slugify(name: string, options?: SlugifyOptions) {
    if (options) {
      return slugify(name, options);
    }
    return slugify(name, { lower: true, replacement: '_' });
  }

  static randPassword(letters: number, numbers: number, either: number) {
    const chars = [
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', // letters
      '0123456789', // numbers
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', // either
    ];

    return [letters, numbers, either]
      .map(function (len, i) {
        return Array(len)
          .fill(chars[i])
          .map(function (x) {
            return x[Math.floor(Math.random() * x.length)];
          })
          .join('');
      })
      .concat()
      .join('')
      .split('')
      .sort(function () {
        return 0.5 - Math.random();
      })
      .join('');
  }

  static getScheme() {
    const dbUrl = url.parse(env.dbUrl);
    const scheme = dbUrl.protocol.substr(0, dbUrl.protocol.length - 1);
    return scheme;
  }

  static generateToken(length: number = 6, options: Record<string, any> = {}) {
    return tokenGen.generate(length, {
      upperCase: false,
      specialChars: false,
      alphabets: false,
      digits: true,
      ...options,
    });
  }

  static async verifyOTP(identifier: string, code: string) {
    // const otp = await RedisStore.get(identifier);
    // if (otp.data != code) {
    //   throw new UnauthorizedException('Invalid OTP');
    // }
    // await RedisStore.remove(identifier);
    // return {};
    return {};
  }

  static numberWithCommas(x: number | string): string {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  static cleanQuery(value: string) {
    if (!value) return null;
    if (value == '') return null;
    return value;
  }
}
