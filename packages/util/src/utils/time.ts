export function getUnixTimeAtZeroToday(): number {
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);
    return Math.floor(now.getTime() / 1000);
}

export function dateTimeToUnix(t: string): number {
    const date = new Date(t);
    return Math.floor(date.getTime() / 1000);
}
