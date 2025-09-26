import { GenTokenReq } from "@cessnetwork/types";

export interface TokenResponse {
    data?: any;
    success?: boolean;
    error?: string;
    status?: number;
}

export async function getToken(gatewayUrl: string, genTokenReq: GenTokenReq): Promise<any> {
    try {
        // Remove trailing slash from gatewayUrl
        const baseUrl = gatewayUrl.replace(/\/$/, "");

        // Convert object to URLSearchParams for form-urlencoded format
        const formData = new URLSearchParams();
        Object.entries(genTokenReq).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, String(value));
            }
        });

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(`${baseUrl}/gateway/gentoken`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
            signal: controller.signal,
        });


        clearTimeout(timeoutId);

        const result = await response.json() as any;
        return result.data;

    } catch (error) {
        if (error instanceof Error) {
            // Handle timeout error
            if (error.name === 'AbortError') {
                console.error("Request timeout");
                throw new Error(`Request timeout for ${gatewayUrl}`);
            }

            // Handle fetch errors
            if (error.message.includes('fetch')) {
                console.error("Network error:", error.message);
                throw new Error(`Network error when connecting to ${gatewayUrl}`);
            }

            // Handle HTTP errors
            if (error.message.includes('HTTP error')) {
                console.error("Server responded with error:", error.message);
                throw new Error(`Server error from ${gatewayUrl}: ${error.message}`);
            }

            console.error("Request error:", error.message);
            throw new Error(`Request failed for ${gatewayUrl}: ${error.message}`);
        } else {
            console.error("Unexpected error:", error);
            throw new Error(`Unexpected error occurred when requesting ${gatewayUrl}`);
        }
    }
}

export async function getTokenWithDetails(gatewayUrl: string, genTokenReq: GenTokenReq): Promise<TokenResponse> {
    try {
        const baseUrl = gatewayUrl.replace(/\/$/, "");

        const formData = new URLSearchParams();
        Object.entries(genTokenReq).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, String(value));
            }
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`${baseUrl}/gateway/gentoken`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const result = await response.json() as any;

        return {
            success: true,
            status: response.status,
            data: result.data,
        };

    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                return {
                    success: false,
                    error: "Request timeout",
                };
            }

            return {
                success: false,
                error: error.message,
            };
        } else {
            return {
                success: false,
                error: "Unexpected error occurred",
            };
        }
    }
}

export function createFormData(obj: Record<string, any>): URLSearchParams {
    const formData = new URLSearchParams();

    Object.entries(obj).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (typeof value === 'object' && !Array.isArray(value)) {
                formData.append(key, JSON.stringify(value));
            } else if (Array.isArray(value)) {
                // Handle arrays by appending each item
                value.forEach((item, index) => {
                    formData.append(`${key}[${index}]`, String(item));
                });
            } else {
                formData.append(key, String(value));
            }
        }
    });

    return formData;
}

export async function postFormData<T = any>(
    url: string,
    data: Record<string, any>,
    options: {
        timeout?: number;
        headers?: Record<string, string>;
    } = {}
): Promise<T> {
    const { timeout = 10000, headers = {} } = options;

    try {
        const formData = createFormData(data);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                ...headers,
            },
            body: formData,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        return await response.json() as any;

    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        } else {
            throw new Error('Unexpected error occurred');
        }
    }
}

export async function getTokenSimplified(gatewayUrl: string, genTokenReq: GenTokenReq): Promise<any> {
    try {
        const baseUrl = gatewayUrl.replace(/\/$/, "");
        const result = await postFormData(`${baseUrl}/gateway/gentoken`, genTokenReq, {
            timeout: 10000,
        });
        return result.data;
    } catch (error) {
        console.error("Token generation failed:", error);
        throw new Error(`Invalid response from ${gatewayUrl}`);
    }
}