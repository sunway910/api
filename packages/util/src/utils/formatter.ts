export class TokenFormatter {
    static formatBalance(
        balance: bigint | string | number,
        decimals: number,
        options: {
            displayDecimals?: number;
            useGrouping?: boolean;
            symbol?: string;
            locale?: string;
        } = {}
    ): string {
        const {
            displayDecimals = 6,
            useGrouping = true,
            symbol = '',
            locale = 'en-US'
        } = options;

        const balanceBigInt = typeof balance === 'bigint' ? balance : BigInt(balance);
        const divisor = BigInt(10 ** decimals);

        const quotient = balanceBigInt / divisor;
        const remainder = balanceBigInt % divisor;

        let result = quotient.toString();

        if (remainder > 0n) {
            const fractionalStr = remainder.toString().padStart(decimals, '0');
            const trimmedFractional = fractionalStr.substring(0, displayDecimals).replace(/0+$/, '');

            if (trimmedFractional) {
                result += '.' + trimmedFractional;
            }
        }

        if (useGrouping) {
            const [integerPart, fractionalPart] = result.split('.');
            const formattedInteger = parseInt(integerPart).toLocaleString(locale);
            result = fractionalPart ? `${formattedInteger}.${fractionalPart}` : formattedInteger;
        }

        return symbol ? `${result} ${symbol}` : result;
    }
}

export class SpaceFormatter {
    private static readonly BINARY_UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    private static readonly DECIMAL_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    static formatBytes(
        bytes: bigint | string | number,
        options: {
            displayDecimals?: number;
            useGrouping?: boolean;
            binary?: boolean; // true for binary (1024), false for decimal (1000)
            locale?: string;
            autoUnit?: boolean; // automatically choose best unit
            targetUnit?: string; // force specific unit like 'GB', 'GiB'
        } = {}
    ): string {
        const {
            displayDecimals = 2,
            useGrouping = true,
            binary = true,
            locale = 'en-US',
            autoUnit = true,
            targetUnit
        } = options;

        const bytesBigInt = typeof bytes === 'bigint' ? bytes : BigInt(bytes);

        // Handle zero or negative values
        if (bytesBigInt <= 0n) {
            return useGrouping ?
                (0).toLocaleString(locale) + ' B' :
                '0 B';
        }

        const divisor = binary ? 1024n : 1000n;
        const units = binary ? this.BINARY_UNITS : this.DECIMAL_UNITS;

        let unitIndex = 0;
        let result = bytesBigInt;

        if (targetUnit) {
            // Force specific unit
            unitIndex = units.indexOf(targetUnit);
            if (unitIndex === -1) {
                throw new Error(`Invalid unit: ${targetUnit}. Available units: ${units.join(', ')}`);
            }

            // Calculate the value for the target unit
            for (let i = 0; i < unitIndex; i++) {
                result = result * 1000n / divisor; // Convert to fractional representation
            }
        } else if (autoUnit) {
            // Automatically choose the best unit
            while (result >= divisor && unitIndex < units.length - 1) {
                result = result / divisor;
                unitIndex++;
            }
        }

        // Handle fractional part for non-byte units
        let formattedValue: string;

        if (unitIndex === 0) {
            // Bytes - no decimal places needed
            formattedValue = result.toString();
        } else {
            // For higher units, we need to handle decimals
            const wholePart = result;
            let fractionalPart = '';

            if (displayDecimals > 0) {
                // Calculate fractional part by getting remainder from original division
                let tempBytes = bytesBigInt;
                let tempDivisor = 1n;

                for (let i = 0; i < unitIndex; i++) {
                    tempDivisor *= divisor;
                }

                const remainder = tempBytes % tempDivisor;
                if (remainder > 0n) {
                    // Convert remainder to decimal representation
                    const fractionalBigInt = remainder * BigInt(10 ** displayDecimals) / tempDivisor;
                    const fractionalStr = fractionalBigInt.toString().padStart(displayDecimals, '0');
                    const trimmedFractional = fractionalStr.replace(/0+$/, '');

                    if (trimmedFractional) {
                        fractionalPart = '.' + trimmedFractional;
                    }
                }
            }

            formattedValue = wholePart.toString() + fractionalPart;
        }

        // Apply number formatting
        if (useGrouping && formattedValue.includes('.')) {
            const [integerPart, fractionalPart] = formattedValue.split('.');
            const formattedInteger = parseInt(integerPart).toLocaleString(locale);
            formattedValue = `${formattedInteger}.${fractionalPart}`;
        } else if (useGrouping) {
            formattedValue = parseInt(formattedValue).toLocaleString(locale);
        }

        return `${formattedValue} ${units[unitIndex]}`;
    }

    // Convenience methods for specific units
    static toKB(bytes: bigint | string | number, displayDecimals = 2): string {
        return this.formatBytes(bytes, {
            targetUnit: 'KB',
            binary: false,
            displayDecimals
        });
    }

    static toMB(bytes: bigint | string | number, displayDecimals = 2): string {
        return this.formatBytes(bytes, {
            targetUnit: 'MB',
            binary: false,
            displayDecimals
        });
    }

    static toGB(bytes: bigint | string | number, displayDecimals = 2): string {
        return this.formatBytes(bytes, {
            targetUnit: 'GB',
            binary: false,
            displayDecimals
        });
    }

    static toTB(bytes: bigint | string | number, displayDecimals = 2): string {
        return this.formatBytes(bytes, {
            targetUnit: 'TB',
            binary: false,
            displayDecimals
        });
    }

    static toKiB(bytes: bigint | string | number, displayDecimals = 2): string {
        return this.formatBytes(bytes, {
            targetUnit: 'KiB',
            binary: true,
            displayDecimals
        });
    }

    static toMiB(bytes: bigint | string | number, displayDecimals = 2): string {
        return this.formatBytes(bytes, {
            targetUnit: 'MiB',
            binary: true,
            displayDecimals
        });
    }

    static toGiB(bytes: bigint | string | number, displayDecimals = 2): string {
        return this.formatBytes(bytes, {
            targetUnit: 'GiB',
            binary: true,
            displayDecimals
        });
    }

    static toTiB(bytes: bigint | string | number, displayDecimals = 2): string {
        return this.formatBytes(bytes, {
            targetUnit: 'TiB',
            binary: true,
            displayDecimals
        });
    }

    // Parse formatted string back to bytes
    static parseBytes(formattedSize: string): bigint {
        const match = formattedSize.trim().match(/^([\d,]+(?:\.\d+)?)\s*([A-Za-z]+)$/);
        if (!match) {
            throw new Error(`Invalid format: ${formattedSize}`);
        }

        const [, valueStr, unit] = match;
        const value = parseFloat(valueStr.replace(/,/g, ''));

        const binaryIndex = this.BINARY_UNITS.indexOf(unit);
        const decimalIndex = this.DECIMAL_UNITS.indexOf(unit);

        let unitIndex: number;
        let divisor: number;

        if (binaryIndex !== -1) {
            unitIndex = binaryIndex;
            divisor = 1024;
        } else if (decimalIndex !== -1) {
            unitIndex = decimalIndex;
            divisor = 1000;
        } else {
            throw new Error(`Unknown unit: ${unit}`);
        }

        const multiplier = Math.pow(divisor, unitIndex);
        return BigInt(Math.round(value * multiplier));
    }
}