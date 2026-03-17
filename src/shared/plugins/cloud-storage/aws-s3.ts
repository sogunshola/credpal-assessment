/* eslint-disable @typescript-eslint/no-shadow */
import { S3 } from 'aws-sdk';
import { ManagedUpload } from 'aws-sdk/clients/s3';
import { logger } from '../../../config/winston';
import env from '../../../config/env.config';
import { IStorage } from './IStorage';

export class AWSStorage implements IStorage {
  private bucketName: string = env.s3BucketName;

  s3(): S3 {
    return new S3({
      apiVersion: '2012-10-17',
      // eslint-disable-next-line etc/no-commented-out-code
      // credentials: {
      //   accessKeyId: env.awsAccessKey,
      //   secretAccessKey: env.awsAccessKey,
      // },
      region: env.awsRegion,
      logger: {
        log(content): void {
          logger.info(`S3 CloudStorage Info: ${content}`);
        },
        warn(content): void {
          logger.warn(`S3 CloudStorage Warning: ${content}`);
        },
      },
    });
  }

  getFileMetadata(filename: string): Promise<S3.GetObjectOutput> {
    return new Promise((resolve, reject) => {
      this.s3().getBucketLocation(
        { Bucket: this.bucketName },
        (err: Error, result: S3.GetBucketLocationOutput): void => {
          if (result) {
            this.s3().getObject(
              { Bucket: this.bucketName, Key: filename, ResponseContentType: 'application/octet-stream' },
              (err: Error, result: S3.GetObjectOutput) => {
                if (!err) {
                  resolve(result);
                } else {
                  reject(err);
                }
              },
            );
          } else {
            reject(err);
          }
        },
      );
    });
  }

  bucketExist(): Promise<S3.GetBucketLocationOutput> {
    return new Promise((resolve, reject) => {
      this.s3().getBucketLocation(
        { Bucket: this.bucketName },
        (err: Error, result: S3.GetBucketLocationOutput): void => {
          if (!err) {
            resolve(result);
          } else {
            reject(err);
          }
        },
      );
    });
  }

  getListBucket(): Promise<S3.ListBucketsOutput> {
    return new Promise((resolve, reject) => {
      this.s3().listBuckets((err: Error, result: S3.ListBucketsOutput): void => {
        if (!err) {
          resolve(result);
        } else {
          reject(err);
        }
      });
    });
  }

  downloadFile(filename: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.s3().getBucketLocation(
        { Bucket: this.bucketName },
        (err: Error, result: S3.GetBucketLocationOutput): void => {
          if (result) {
            this.s3().getObject(
              { Bucket: this.bucketName, Key: filename },
              (err: Error, result: S3.GetObjectOutput) => {
                if (!err) {
                  resolve(result.Body as Buffer);
                } else {
                  reject(err);
                }
              },
            );
          } else {
            reject(err);
          }
        },
      );
    });
  }

  getFileUrl(filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.s3().getBucketLocation(
        { Bucket: this.bucketName },
        (err: Error, result: S3.GetBucketLocationOutput): void => {
          if (result) {
            this.s3().getSignedUrl(this.bucketName, filename, (err: Error, result: string) => {
              if (!err) {
                resolve(result);
              } else {
                reject(err);
              }
            });
          } else {
            reject(err);
          }
        },
      );
    });
  }

  uploadFile(filename: string, body: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      this.s3().getBucketLocation(
        { Bucket: this.bucketName },
        (err: Error, result: S3.GetBucketLocationOutput): void => {
          if (result) {
            this.s3().upload(
              { Bucket: this.bucketName, Key: filename, Body: body, ACL: 'public-read' },
              (err: Error, result: ManagedUpload.SendData) => {
                if (!err) {
                  resolve(result.Location);
                } else {
                  reject(err);
                }
              },
            );
          } else {
            reject(err);
          }
        },
      );
    });
  }
}
