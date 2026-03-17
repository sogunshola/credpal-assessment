export interface ICompressionAdapter<T> {
  compress(data: T): Promise<Buffer>
  decompress(data: Buffer): Promise<T>
}
