import * as Snappy from 'snappy';
import { ICompressionAdapter } from '../ICompressionAdapter';

export class SnappyCompressionAdapter implements ICompressionAdapter<Buffer> {
  compress(data: Buffer): Promise<Buffer> {
    return Snappy.compress(data);
  }

  async decompress(data: Buffer): Promise<Buffer> {
    const encodedData = (await Snappy.uncompress(data, {
      asBuffer: true,
    })) as Buffer;
    return encodedData;
  }
}
