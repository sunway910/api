import * as net from 'net';
import * as ping from 'ping';

const IPV4_REGEX = /\d+\.\d+\.\d+\.\d+/;

export function findIpv4(data: Buffer): string | null {
    const match = data.toString().match(IPV4_REGEX);
    return match ? match[0] : null;
}

export function isIntranetIpv4(ipv4: string): boolean {
    const ip = net.isIPv4(ipv4);
    if (!ip) {
        return false;
    }
    const parts = ipv4.split('.').map(p => parseInt(p, 10));
    return parts[0] === 10 ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168) ||
        ipv4 === '127.0.0.1';
}

export function isIPv4(ipAddr: string): boolean {
    return net.isIPv4(ipAddr);
}

export function isIPv6(ipAddr: string): boolean {
    return net.isIPv6(ipAddr);
}

export function isPortInUse(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', (err: any) => {
            if (err.code === 'EADDRINUSE') {
                resolve(true);
            }
        });
        server.once('listening', () => {
            server.close();
            resolve(false);
        });
        server.listen(port, '127.0.0.1');
    });
}

export function checkDomain(name: string): void {
    const domain = name.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (domain.length > 50) {
        throw new Error(`Domain name length is ${domain.length}, can't exceed 50`);
    }
    // This is a simplified check. A more robust implementation would be needed for full RFC compliance.
    if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(domain)) {
        throw new Error('Invalid domain name');
    }
}

export async function pingNode(addr: string): Promise<number> {
    const res = await ping.promise.probe(addr);
    return res.avg ? parseFloat(res.avg) : 0;
}
