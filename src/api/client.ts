import type {
    PlayerInfoResponse,
    SeasonsResponse,
    MatchesResponse,
    GiftCodesResponse,
    KingdomTrackerResponse,
    HealthResponse,
    ErrorResponse,
    KvkMatchStatusFilter,
    SortOption,
} from "./types";

type QueryValue =
    | string
    | number
    | boolean
    | null
    | undefined
    | Array<string | number | boolean>;

type QueryParams = Record<string, QueryValue>;

export class ApiError extends Error {
    status: number;
    body: ErrorResponse | unknown;

    constructor(message: string, status: number, body: ErrorResponse | unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.body = body;
    }
}

export interface KingshotApiOptions {
    baseUrl?: string;
    fetchFn?: typeof fetch;
    headers?: Record<string, string>;
}

export class KingshotApi {
    private readonly baseUrl: string;
    private readonly fetchFn: typeof fetch;
    private readonly defaultHeaders: Record<string, string>;

    constructor({
        baseUrl = process.env.KINGSHOT_API_BASE_URL ?? "https://kingshot.net/api",
        fetchFn = fetch,
        headers = {},
    }: KingshotApiOptions = {}) {
        this.baseUrl = baseUrl.replace(/\/$/, "");
        this.fetchFn = fetchFn;
        this.defaultHeaders = {
            "Content-Type": "application/json",
            ...headers,
        };
    }

    private buildUrl(path: string, params?: QueryParams): string {
        const url = new URL(
            path.replace(/^\/+/, ""),
            `${this.baseUrl}/`,
        );

        if (params) {
            for (const [key, value] of Object.entries(params)) {
                if (value === undefined || value === null) continue;

                if (Array.isArray(value)) {
                    url.searchParams.set(key, value.join(","));
                    continue;
                }

                url.searchParams.set(key, String(value));
            }
        }

        return url.toString();
    }

    private async request<T>(
        path: string,
        options?: {
            params?: QueryParams;
            method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
            body?: unknown;
            headers?: Record<string, string>;
        }
    ): Promise<T> {
        const { params, method = "GET", body, headers = {} } = options ?? {};

        const url = this.buildUrl(path, params);

        const response = await this.fetchFn(url, {
            method,
            headers: {
                ...this.defaultHeaders,
                ...headers,
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });

        const isJson = response.headers.get("content-type")?.includes("application/json");
        const payload = isJson ? await response.json() : await response.text();

        if (!response.ok) {
            const errorBody = payload as ErrorResponse | unknown;
            throw new ApiError(
                (errorBody as ErrorResponse)?.message ?? "Request failed",
                response.status,
                errorBody
            );
        }

        return payload as T;
    }

    async getPlayerInfo(playerId: string): Promise<PlayerInfoResponse> {
        return this.request<PlayerInfoResponse>("/player-info", {
            params: { playerId },
        });
    }

    async getKvkSeasons(): Promise<SeasonsResponse> {
        return this.request<SeasonsResponse>("/kvk/seasons");
    }

    async getKvkMatches(params?: {
        season?: string | number | Array<string | number>;
        kingdom_a?: number;
        kingdom_b?: number;
        status?: KvkMatchStatusFilter;
        page?: number;
        limit?: number;
    }): Promise<MatchesResponse> {
        return this.request<MatchesResponse>("/kvk/matches", {
            params,
        });
    }

    async getGiftCodes(): Promise<GiftCodesResponse> {
        return this.request<GiftCodesResponse>("/gift-codes");
    }

    async getKingdomTracker(params?: {
        kingdomId?: number;
        recent?: number;
        limit?: number;
        sort?: SortOption;
    }): Promise<KingdomTrackerResponse> {
        return this.request<KingdomTrackerResponse>("/kingdom-tracker", {
            params,
        });
    }

    async getHealth(): Promise<HealthResponse> {
        return this.request<HealthResponse>("/health");
    }
}

export const kingshotApi = new KingshotApi({
    baseUrl: process.env.KINGSHOT_API_BASE_URL ?? "https://kingshot.net/api",
});