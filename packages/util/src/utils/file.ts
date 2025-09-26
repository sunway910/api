import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { randomBytes } from 'crypto';

export async function writeFile(buf: Buffer, filePath: string): Promise<void> {
    const tempFilename = `temp_${randomBytes(16).toString('hex')}`;
    const tempFilepath = path.join(os.tmpdir(), tempFilename);

    try {
        await fs.writeFile(tempFilepath, buf);
        await fs.rename(tempFilepath, filePath);
    } catch (err) {
        await fs.unlink(tempFilepath).catch(() => {});
        throw err;
    }
}