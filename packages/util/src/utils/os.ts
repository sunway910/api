import * as os from 'os';
import * as fs from 'fs';

export function getDirFreeSpace(dir: string): Promise<number> {
    return new Promise((resolve, reject) => {
        fs.stat(dir, (err, stats) => {
            if (err) {
                return reject(err);
            }
            // This is a simplified model. For a more accurate representation,
            // you might need to use a library that can get block size and free blocks.
            resolve(stats.size);
        });
    });
}

export function getSysMemAvailable(): number {
    return os.freemem();
}
