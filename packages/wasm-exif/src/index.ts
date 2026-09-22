/**
 * ExifGuard Client-Side Binary EXIF Parser & Injector Engine
 * Supports full TIFF Sub-IFD (ExifIFD 0x8769, GPSIFD 0x8825) traversal
 */

// EXIF & GPS Tag Identifier Mappings
export const TAG_MAP: Record<number, string> = {
  0x010f: 'Make',
  0x0110: 'Model',
  0x0131: 'Software',
  0x0132: 'ModifyDate',
  0x829a: 'ExposureTime',
  0x829d: 'FNumber',
  0x8827: 'ISO',
  0x9003: 'DateTimeOriginal',
  0x9004: 'CreateDate',
  0x920a: 'FocalLength',
  0xa405: 'FocalLengthIn35mmFormat',
  0xa433: 'LensMake',
  0xa434: 'LensModel',
  0x9202: 'ApertureValue',
  0x9201: 'ShutterSpeedValue',
  0x9209: 'Flash',
  0x9207: 'MeteringMode',
  // GPS SubIFD Tags
  0x0001: 'GPSLatitudeRef',
  0x0002: 'GPSLatitude',
  0x0003: 'GPSLongitudeRef',
  0x0004: 'GPSLongitude',
  0x0005: 'GPSAltitudeRef',
  0x0006: 'GPSAltitude',
  0x0007: 'GPSTimeStamp',
  0x001d: 'GPSDateStamp'
};

/**
 * Strips all metadata markers (APP1 through APP15) from a JPEG binary buffer.
 * Completely removes EXIF, XMP, IPTC, ICC profiles, MPF Gain Maps, Adobe IRB.
 */
export function stripJPEGMetadata(buffer: Uint8Array): Uint8Array {
  // Check SOI marker 0xFF 0xD8
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    throw new Error('Invalid JPEG image format header.');
  }

  const output: number[] = [0xff, 0xd8];
  let offset = 2;

  while (offset < buffer.length - 1) {
    if (buffer[offset] !== 0xff) {
      break;
    }

    const marker = buffer[offset + 1];
    
    // 0xFF 0xDA is SOS (Start of Scan) - compressed image data follows
    if (marker === 0xda) {
      for (let i = offset; i < buffer.length; i++) {
        output.push(buffer[i]);
      }
      break;
    }

    // Marker length (2 bytes big endian)
    const length = (buffer[offset + 2] << 8) | buffer[offset + 3];

    // Strip APP1 through APP15 (0xE1 .. 0xEF) metadata markers
    const isMetadataMarker = (marker >= 0xe1 && marker <= 0xef);

    if (!isMetadataMarker) {
      // Retain standard markers (SOF0, DQT, DHT, DRI, etc.)
      for (let i = 0; i < length + 2; i++) {
        output.push(buffer[offset + i]);
      }
    }

    offset += length + 2;
  }

  return new Uint8Array(output);
}

/**
 * Full TIFF EXIF & Sub-IFD Reader (Recursively parses IFD0, ExifIFD, GPSIFD)
 */
export function readExifTags(buffer: Uint8Array): Record<string, any> {
  const tags: Record<string, any> = {};

  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return tags;
  }

  let offset = 2;
  while (offset < buffer.length - 1) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    if (marker === 0xda) break; // SOS

    const length = (buffer[offset + 2] << 8) | buffer[offset + 3];

    if (marker === 0xe1) { // APP1 EXIF
      const header = String.fromCharCode(...buffer.slice(offset + 4, offset + 8));
      if (header === 'Exif') {
        const tiffOffset = offset + 10;
        const isLittleEndian = buffer[tiffOffset] === 0x49 && buffer[tiffOffset + 1] === 0x49; // II

        const read16 = (o: number) => {
          if (o + 2 > buffer.length) return 0;
          return isLittleEndian
            ? buffer[o] | (buffer[o + 1] << 8)
            : (buffer[o] << 8) | buffer[o + 1];
        };

        const read32 = (o: number) => {
          if (o + 4 > buffer.length) return 0;
          return isLittleEndian
            ? buffer[o] | (buffer[o + 1] << 8) | (buffer[o + 2] << 16) | (buffer[o + 3] << 24)
            : (buffer[o] << 24) | (buffer[o + 1] << 16) | (buffer[o + 2] << 8) | buffer[o + 3];
        };

        const parseIFD = (ifdPos: number) => {
          if (ifdPos < tiffOffset || ifdPos >= buffer.length - 2) return;
          const entryCount = read16(ifdPos);
          let p = ifdPos + 2;

          for (let i = 0; i < entryCount; i++) {
            if (p + 12 > buffer.length) break;
            const tagId = read16(p);
            const tagType = read16(p + 2);
            const count = read32(p + 4);
            const valueOffset = p + 8;

            // Check if pointer to Sub-IFD (0x8769 = ExifIFD, 0x8825 = GPSIFD)
            if (tagId === 0x8769) { // ExifIFD Pointer
              const subIfdOffset = tiffOffset + read32(valueOffset);
              parseIFD(subIfdOffset);
            } else if (tagId === 0x8825) { // GPSIFD Pointer
              tags['GPSInfo'] = 'PRESENT';
              const gpsIfdOffset = tiffOffset + read32(valueOffset);
              parseIFD(gpsIfdOffset);
            } else if (TAG_MAP[tagId]) {
              const tagName = TAG_MAP[tagId];
              
              if (tagType === 1) { // BYTE
                tags[tagName] = buffer[valueOffset];
              } else if (tagType === 2) { // ASCII
                const strLen = count;
                const actualOffset = strLen > 4 ? tiffOffset + read32(valueOffset) : valueOffset;
                const strBytes = buffer.slice(actualOffset, actualOffset + strLen);
                let strVal = String.fromCharCode(...strBytes);
                const nullIdx = strVal.indexOf('\0');
                if (nullIdx !== -1) {
                  strVal = strVal.substring(0, nullIdx);
                }
                tags[tagName] = strVal.trim();
              } else if (tagType === 3) { // SHORT
                tags[tagName] = read16(valueOffset);
              } else if (tagType === 4) { // LONG
                tags[tagName] = read32(valueOffset);
              } else if (tagType === 5) { // RATIONAL
                const actualOffset = tiffOffset + read32(valueOffset);
                const readRat = (off: number) => {
                  const n = read32(off);
                  const d = read32(off + 4);
                  return d !== 0 ? n / d : 0;
                };

                if ((tagName === 'GPSLatitude' || tagName === 'GPSLongitude') && count >= 3) {
                  const deg = readRat(actualOffset);
                  const min = readRat(actualOffset + 8);
                  const sec = readRat(actualOffset + 16);
                  tags[tagName] = +(deg + min / 60 + sec / 3600).toFixed(6);
                } else if (tagName === 'GPSTimeStamp' && count >= 3) {
                  const h = Math.floor(readRat(actualOffset));
                  const m = Math.floor(readRat(actualOffset + 8));
                  const s = Math.floor(readRat(actualOffset + 16));
                  tags[tagName] = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                } else {
                  const num = read32(actualOffset);
                  const den = read32(actualOffset + 4);
                  tags[tagName] = den !== 0 ? +(num / den).toFixed(4) : 0;
                }
              }
            }

            p += 12;
          }
        };

        const firstIFD = read32(tiffOffset + 4);
        parseIFD(tiffOffset + firstIFD);
      }
    }

    offset += length + 2;
  }

  return tags;
}

/**
 * Constructs a binary JPEG APP1 segment from target hardware profile tags
 * and injects it into a stripped JPEG buffer.
 */
export function injectEXIFSegment(
  cleanJpegBuffer: Uint8Array,
  tags: Record<string, any>,
  makernoteSig: string = 'ExifGuard'
): Uint8Array {
  // Strip existing metadata markers first
  const stripped = stripJPEGMetadata(cleanJpegBuffer);

  // Build binary EXIF APP1 Segment payload
  const stringEntries: { tagId: number; value: string }[] = [];
  const numberEntries: { tagId: number; value: number }[] = [];

  const tagIdMap: Record<string, number> = {
    'Make': 0x010f,
    'Model': 0x0110,
    'Software': 0x0131,
    'FNumber': 0x829d,
    'FocalLength': 0x920a,
    'FocalLengthIn35mmFormat': 0xa435,
    'LensModel': 0xa434
  };

  for (const [key, val] of Object.entries(tags)) {
    if (tagIdMap[key]) {
      if (typeof val === 'string') {
        stringEntries.push({ tagId: tagIdMap[key], value: val });
      } else if (typeof val === 'number') {
        numberEntries.push({ tagId: tagIdMap[key], value: val });
      }
    }
  }

  // Construct binary payload bytes: "Exif\0\0" + TIFF Header (Little Endian 'II' + 42)
  const exifBytes: number[] = [
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // Exif\0\0
    0x49, 0x49, 0x2a, 0x00,             // TIFF Header (II, 42)
    0x08, 0x00, 0x00, 0x00              // Offset to 1st IFD (8)
  ];

  const totalEntries = stringEntries.length + numberEntries.length;
  // Count of entries (2 bytes)
  exifBytes.push(totalEntries & 0xff, (totalEntries >> 8) & 0xff);

  let dataOffset = 8 + 2 + totalEntries * 12 + 4; // Start of string data block
  const dataBlock: number[] = [];

  for (const entry of stringEntries) {
    exifBytes.push(entry.tagId & 0xff, (entry.tagId >> 8) & 0xff);
    exifBytes.push(0x02, 0x00); // ASCII
    const len = entry.value.length + 1;
    exifBytes.push(len & 0xff, (len >> 8) & 0xff, (len >> 16) & 0xff, (len >> 24) & 0xff);

    if (len <= 4) {
      for (let i = 0; i < 4; i++) {
        exifBytes.push(i < entry.value.length ? entry.value.charCodeAt(i) : 0);
      }
    } else {
      const currentOffset = dataOffset + dataBlock.length;
      exifBytes.push(
        currentOffset & 0xff,
        (currentOffset >> 8) & 0xff,
        (currentOffset >> 16) & 0xff,
        (currentOffset >> 24) & 0xff
      );
      for (let i = 0; i < entry.value.length; i++) {
        dataBlock.push(entry.value.charCodeAt(i));
      }
      dataBlock.push(0x00);
    }
  }

  for (const entry of numberEntries) {
    exifBytes.push(entry.tagId & 0xff, (entry.tagId >> 8) & 0xff);
    exifBytes.push(0x03, 0x00); // SHORT
    exifBytes.push(0x01, 0x00, 0x00, 0x00);
    exifBytes.push(entry.value & 0xff, (entry.value >> 8) & 0xff, 0x00, 0x00);
  }

  // Next IFD Offset (0 = none)
  exifBytes.push(0x00, 0x00, 0x00, 0x00);
  exifBytes.push(...dataBlock);

  // APP1 Segment Length = 2 + exifBytes.length
  const app1Length = exifBytes.length + 2;
  const app1Header = [
    0xff, 0xe1,
    (app1Length >> 8) & 0xff, app1Length & 0xff
  ];

  // Insert APP1 segment immediately after SOI (0xFF 0xD8)
  const result = new Uint8Array(stripped.length + app1Header.length + exifBytes.length);
  result.set(stripped.subarray(0, 2), 0);
  result.set(new Uint8Array(app1Header), 2);
  result.set(new Uint8Array(exifBytes), 2 + app1Header.length);
  result.set(stripped.subarray(2), 2 + app1Header.length + exifBytes.length);

  return result;
}
