import { v2 } from 'cloudinary';
import env from '../../../config/env.config';
import { IStorage } from './IStorage';

export class Cloudinary implements IStorage {
  private cloudinary;
  constructor() {
    this.cloudinary = v2;
    this.cloudinary.config({
      cloud_name: env.cloudinary.cloudName,
      api_key: env.cloudinary.apiKey,
      api_secret: env.cloudinary.apiSecret,
    });
  }

  async getFileUrl(filename: string): Promise<string> {
    const { secure_url } = await this.cloudinary.uploader.upload(filename);
    return secure_url;
  }

  async uploadFile(path: string, body: Buffer): Promise<string> {
    const options = {
      use_filename: true,
      unique_filename: false,
      overwrite: true,
    };
    const { secure_url } = await this.cloudinary.uploader.upload(path, options);
    return secure_url;
  }

  async downloadFile(filename: string): Promise<Buffer> {
    const { secure_url } = await this.cloudinary.uploader.upload(filename);
    return secure_url;
  }
}
