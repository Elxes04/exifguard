import { stripJPEGMetadata, readExifTags, injectEXIFSegment } from '../src/index';

describe('WASM EXIF Binary Engine Tests', () => {
  // Construct a dummy JPEG buffer SOI (0xFF 0xD8) + EOI (0xFF 0xD9)
  const dummyJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02, 0x00, 0xff, 0xd9]);

  test('stripJPEGMetadata retains JPEG structure', () => {
    const stripped = stripJPEGMetadata(dummyJpeg);
    expect(stripped[0]).toBe(0xff);
    expect(stripped[1]).toBe(0xd8);
  });

  test('injectEXIFSegment injects APP1 EXIF segment', () => {
    const injected = injectEXIFSegment(dummyJpeg, {
      Make: 'Sony',
      Model: 'ILCE-7M3',
      Software: 'TestBuild'
    });

    expect(injected[2]).toBe(0xff);
    expect(injected[3]).toBe(0xe1); // APP1 Marker

    const tags = readExifTags(injected);
    expect(tags.Make).toBe('Sony');
    expect(tags.Model).toBe('ILCE-7M3');
  });
});
