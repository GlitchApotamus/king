export type Nullable<T> = T | null;

export const apiStatus = ["success", "fail", "error", "healthy", "unhealthy"] as const;
export type ApiStatus = (typeof apiStatus)[number];

export const healthCheckStatus = ["ok", "error"] as const;
export type HealthCheckStatus = (typeof healthCheckStatus)[number];

export const kvkStatusFilter = ["all", "captured", "defended"] as const;
export type KvkMatchStatusFilter = (typeof kvkStatusFilter)[number];

export const kingdomSortOptions = [
    "openTime-asc",
    "openTime-desc",
    "kingdomId-asc",
    "kingdomId-desc",
] as const;
export type SortOption = (typeof kingdomSortOptions)[number];

export interface PlayerInfo {
    playerId: string;
    name: string;
    kingdom: number;
    level: number;
    levelRendered: string;
    levelRenderedDetailed: string;
    levelImage: string;
    profilePhoto: string;
}

export interface Season {
    season_id: number;
    season_date: string;
    kvk_title: Nullable<string>;
    description: Nullable<string>;
}

export interface Match {
    kvk_id: number;
    season_id: number;
    kingdom_a: number;
    kingdom_b: number;
    prep_winner: number;
    castle_winner: number;
    attacker: number;
    defender: number;
    castle_captured: boolean;
    season_date: string;
    kvk_title: Nullable<string>;
    description: Nullable<string>;
    created_at: string;
    updated_at: string;
}

export interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
}

export interface GiftCode {
    id: number;
    code: string;
    expiresAt: Nullable<string>;
    createdAt: string;
}

export interface GiftCodesData {
    giftCodes: GiftCode[];
    total: number;
    activeCount: number;
    expiredCount: number;
}

export interface KingdomServer {
    id: number;
    kingdomId: number;
    openTime: string;
    isExclusive: boolean;
    languages: Nullable<string[]>;
    isVerified: boolean;
}

export interface KingdomTrackerFilters {
    recent: Nullable<number>;
    limit: Nullable<number>;
    sort: string;
}

export interface KingdomTrackerData {
    servers: KingdomServer[];
    total: number;
    filters: KingdomTrackerFilters;
}

export interface HealthChecks {
    database: HealthCheckStatus;
    server: HealthCheckStatus;
}

export interface ErrorMeta {
    code: string;
    errorKey: string;
    details?: unknown;
}

export interface PlayerInfoResponse {
    status: "success";
    data: PlayerInfo;
    message: string;
    timestamp: string;
}

export interface SeasonsResponse {
    status: "success";
    data: Season[];
    message: string;
}

export interface MatchesResponse {
    status: "success";
    data: Match[];
    pagination: Pagination;
    message: string;
}

export interface GiftCodesResponse {
    status: "success";
    data: GiftCodesData;
    message: string;
    timestamp: string;
}

export interface KingdomTrackerResponse {
    status: "success";
    data: KingdomTrackerData;
    message: string;
}

export interface HealthResponse {
    status: "healthy" | "unhealthy";
    timestamp: string;
    checks: HealthChecks;
    error: Nullable<string>;
}

export interface ErrorResponse {
    status: "error" | "fail";
    message: string;
    data: null;
    meta: ErrorMeta;
    timestamp: string;
}

export type OpenApiLocation = "query" | "path" | "header" | "cookie";

export interface OpenApiSchema {
    type?: string;
    enum?: readonly unknown[];
    nullable?: boolean;
    format?: string;
    description?: string;
    default?: unknown;
    minimum?: number;
    maximum?: number;
    properties?: Record<string, OpenApiSchema>;
    items?: OpenApiSchema;
    required?: readonly string[];
    example?: unknown;
    $ref?: string;
}

export interface OpenApiParameter {
    name: string;
    in: OpenApiLocation;
    description?: string;
    required?: boolean;
    schema?: OpenApiSchema;
    example?: unknown;
}

export interface OpenApiMediaType {
    schema?: OpenApiSchema;
    examples?: Record<string, { value: unknown }>;
}

export interface OpenApiResponse {
    description: string;
    content?: Record<string, OpenApiMediaType>;
}

export interface OpenApiOperation {
    tags?: readonly string[];
    summary?: string;
    description?: string;
    operationId?: string;
    parameters?: readonly OpenApiParameter[];
    responses: Record<string, OpenApiResponse>;
}

export interface OpenApiPathItem {
    get?: OpenApiOperation;
    post?: OpenApiOperation;
    put?: OpenApiOperation;
    delete?: OpenApiOperation;
    patch?: OpenApiOperation;
}

export interface OpenApiComponents {
    schemas: Record<string, OpenApiSchema>;
}

export interface OpenApiDocument {
    openapi: "3.1.0";
    info: {
        title: string;
        version: string;
        description?: string;
        contact?: {
            name?: string;
            email?: string;
            url?: string;
        };
    };
    servers?: readonly {
        url: string;
        description?: string;
    }[];
    tags?: readonly {
        name: string;
        description?: string;
    }[];
    paths: Record<string, OpenApiPathItem>;
    components: OpenApiComponents;
}

export const kingshotApiSchema = {
    openapi: "3.1.0",
    info: {
        title: "KingShot.net - API Documentation",
        version: "1.0.0",
        description:
            "API documentation for KingShot.net - Kingdom vs Kingdom match tracking, player information, and gift codes",
        contact: {
            name: "API Support",
        },
    },
    servers: [{ url: "/api", description: "API Base URL" }],
    tags: [
        { name: "Player", description: "Player information endpoints" },
        { name: "KVK", description: "Kingdom vs Kingdom related endpoints" },
        { name: "Gift Codes", description: "Gift code management" },
        { name: "Kingdom Tracker", description: "Kingdom age and server tracking" },
        { name: "System", description: "System health and status endpoints" },
    ],
    paths: {
        "/player-info": {
            get: {
                tags: ["Player"],
                summary: "Get player information",
                operationId: "getPlayerInfo",
                parameters: [
                    {
                        name: "playerId",
                        in: "query",
                        required: true,
                        schema: {
                            type: "string",
                        },
                        example: "8767319",
                    },
                ],
                responses: {
                    "200": {
                        description: "Player info retrieved successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/PlayerInfoResponse",
                                },
                            },
                        },
                    },
                    "400": {
                        description: "Bad request - Player ID missing or invalid",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                },
            },
        },
        "/kvk/seasons": {
            get: {
                tags: ["KVK"],
                summary: "Get all KVK seasons",
                operationId: "getKvkSeasons",
                responses: {
                    "200": {
                        description: "Seasons retrieved successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/SeasonsResponse",
                                },
                            },
                        },
                    },
                },
            },
        },
        "/kvk/matches": {
            get: {
                tags: ["KVK"],
                summary: "Get KVK matches",
                operationId: "getKvkMatches",
                parameters: [
                    {
                        name: "season",
                        in: "query",
                        schema: {
                            type: "string",
                        },
                    },
                    {
                        name: "kingdom_a",
                        in: "query",
                        schema: {
                            type: "integer",
                        },
                    },
                    {
                        name: "kingdom_b",
                        in: "query",
                        schema: {
                            type: "integer",
                        },
                    },
                    {
                        name: "status",
                        in: "query",
                        schema: {
                            type: "string",
                            enum: ["all", "captured", "defended"],
                        },
                    },
                    {
                        name: "page",
                        in: "query",
                        schema: {
                            type: "integer",
                            default: 1,
                            minimum: 1,
                        },
                    },
                    {
                        name: "limit",
                        in: "query",
                        schema: {
                            type: "integer",
                            default: 21,
                            minimum: 1,
                            maximum: 100,
                        },
                    },
                ],
                responses: {
                    "200": {
                        description: "Matches retrieved successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/MatchesResponse",
                                },
                            },
                        },
                    },
                },
            },
        },
        "/gift-codes": {
            get: {
                tags: ["Gift Codes"],
                summary: "Get active gift codes",
                operationId: "getGiftCodes",
                responses: {
                    "200": {
                        description: "Gift codes retrieved successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/GiftCodesResponse",
                                },
                            },
                        },
                    },
                },
            },
        },
        "/kingdom-tracker": {
            get: {
                tags: ["Kingdom Tracker"],
                summary: "Get kingdom servers",
                operationId: "getKingdomTracker",
                parameters: [
                    {
                        name: "kingdomId",
                        in: "query",
                        schema: {
                            type: "integer",
                            minimum: 1,
                            maximum: 9999,
                        },
                    },
                    {
                        name: "recent",
                        in: "query",
                        schema: {
                            type: "integer",
                            minimum: 1,
                        },
                    },
                    {
                        name: "limit",
                        in: "query",
                        schema: {
                            type: "integer",
                            minimum: 1,
                            maximum: 20,
                            default: 20,
                        },
                    },
                    {
                        name: "sort",
                        in: "query",
                        schema: {
                            type: "string",
                            enum: [
                                "openTime-asc",
                                "openTime-desc",
                                "kingdomId-asc",
                                "kingdomId-desc",
                            ],
                            default: "openTime-desc",
                        },
                    },
                ],
                responses: {
                    "200": {
                        description: "Kingdom servers retrieved successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/KingdomTrackerResponse",
                                },
                            },
                        },
                    },
                },
            },
        },
        "/health": {
            get: {
                tags: ["System"],
                summary: "Health check",
                operationId: "getHealth",
                responses: {
                    "200": {
                        description: "Service health status",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/HealthResponse",
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    components: {
        schemas: {
            PlayerInfoResponse: {
                type: "object",
                properties: {
                    status: { type: "string", enum: ["success"] },
                    data: {
                        type: "object",
                        properties: {
                            playerId: { type: "string" },
                            name: { type: "string" },
                            kingdom: { type: "integer" },
                            level: { type: "integer" },
                            levelRendered: { type: "string" },
                            levelRenderedDetailed: { type: "string" },
                            levelImage: { type: "string" },
                            profilePhoto: { type: "string" },
                        },
                    },
                    message: { type: "string" },
                    timestamp: { type: "string", format: "date-time" },
                },
            },
            SeasonsResponse: {
                type: "object",
                properties: {
                    status: { type: "string", enum: ["success"] },
                    data: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                season_id: { type: "integer" },
                                season_date: { type: "string", format: "date-time" },
                                kvk_title: { type: "string", nullable: true },
                                description: { type: "string", nullable: true },
                            },
                        },
                    },
                    message: { type: "string" },
                },
            },
            MatchesResponse: {
                type: "object",
                properties: {
                    status: { type: "string", enum: ["success"] },
                    data: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                kvk_id: { type: "integer" },
                                season_id: { type: "integer" },
                                kingdom_a: { type: "integer" },
                                kingdom_b: { type: "integer" },
                                prep_winner: { type: "integer" },
                                castle_winner: { type: "integer" },
                                attacker: { type: "integer" },
                                defender: { type: "integer" },
                                castle_captured: { type: "boolean" },
                                season_date: { type: "string", format: "date" },
                                kvk_title: { type: "string", nullable: true },
                                description: { type: "string", nullable: true },
                                created_at: { type: "string", format: "date-time" },
                                updated_at: { type: "string", format: "date-time" },
                            },
                        },
                    },
                    pagination: {
                        type: "object",
                        properties: {
                            total: { type: "integer" },
                            page: { type: "integer" },
                            limit: { type: "integer" },
                            totalPages: { type: "integer" },
                            hasMore: { type: "boolean" },
                        },
                    },
                    message: { type: "string" },
                },
            },
            GiftCodesResponse: {
                type: "object",
                properties: {
                    status: { type: "string", enum: ["success"] },
                    data: {
                        type: "object",
                        properties: {
                            giftCodes: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: { type: "integer" },
                                        code: { type: "string" },
                                        expiresAt: { type: "string", format: "date-time", nullable: true },
                                        createdAt: { type: "string", format: "date-time" },
                                    },
                                },
                            },
                            total: { type: "integer" },
                            activeCount: { type: "integer" },
                            expiredCount: { type: "integer" },
                        },
                    },
                    message: { type: "string" },
                    timestamp: { type: "string", format: "date-time" },
                },
            },
            KingdomTrackerResponse: {
                type: "object",
                properties: {
                    status: { type: "string", enum: ["success"] },
                    data: {
                        type: "object",
                        properties: {
                            servers: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: { type: "integer" },
                                        kingdomId: { type: "integer" },
                                        openTime: { type: "string", format: "date-time" },
                                        isExclusive: { type: "boolean" },
                                        languages: {
                                            type: "array",
                                            items: { type: "string" },
                                            nullable: true,
                                        },
                                        isVerified: { type: "boolean" },
                                    },
                                },
                            },
                            total: { type: "integer" },
                            filters: {
                                type: "object",
                                properties: {
                                    recent: { type: "integer", nullable: true },
                                    limit: { type: "integer", nullable: true },
                                    sort: { type: "string" },
                                },
                            },
                        },
                    },
                    message: { type: "string" },
                },
            },
            HealthResponse: {
                type: "object",
                properties: {
                    status: { type: "string", enum: ["healthy", "unhealthy"] },
                    timestamp: { type: "string", format: "date-time" },
                    checks: {
                        type: "object",
                        properties: {
                            database: { type: "string", enum: ["ok", "error"] },
                            server: { type: "string", enum: ["ok", "error"] },
                        },
                    },
                    error: { type: "string", nullable: true },
                },
            },
            ErrorResponse: {
                type: "object",
                properties: {
                    status: { type: "string", enum: ["error", "fail"] },
                    message: { type: "string" },
                    data: { type: "null" },
                    meta: {
                        type: "object",
                        properties: {
                            code: { type: "string" },
                            errorKey: { type: "string" },
                            details: {},
                        },
                    },
                    timestamp: { type: "string", format: "date-time" },
                },
            },
        },
    },
} as const satisfies OpenApiDocument;