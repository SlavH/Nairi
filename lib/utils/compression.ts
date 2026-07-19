import pako from 'pako';

/**
 * Compresses a string using gzip and returns it as a base64 encoded string.
 */
export const compress = (data: string): string => {
  const binary = pako.gzip(data);
  return Buffer.from(binary).toString('base64');
};

/**
 * Decompresses a base64 encoded gzip string back to its original string form.
 */
export const decompress = (compressed: string): string => {
  const binary = Buffer.from(compressed, 'base64');
  const bytes = pako.ungzip(binary);
  return new TextDecoder().decode(bytes);
};
