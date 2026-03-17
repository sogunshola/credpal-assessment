import { ICompressionAdapter } from '../ICompressionAdapter';
import { SnappyCompressionAdapter } from './snappyCompressionAdapter';

describe('snappyCompressionAdapter', () => {
  let snappyCompressionAdapter: ICompressionAdapter<Buffer>;

  beforeAll(async () => {
    snappyCompressionAdapter = new SnappyCompressionAdapter();
  });

  describe('compress', () => {
    it('should compress', async () => {
      const data = JSON.stringify({ start: 34736496, end: 34736515 });
      const compressed = await snappyCompressionAdapter.compress(
        Buffer.from(data),
      );
      const decompressed = await snappyCompressionAdapter.decompress(
        compressed,
      );
      expect(decompressed).toEqual(Buffer.from(data));
    });
  });

  describe('decompress', () => {
    it('should decompress', async () => {
      const data = Buffer.from('a test string');
      const compressed = await snappyCompressionAdapter.compress(data);
      const decompressed = await snappyCompressionAdapter.decompress(
        compressed,
      );
      expect(decompressed).toEqual(data);
    });
  });
});
