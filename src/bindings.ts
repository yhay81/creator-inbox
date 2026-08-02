export type RateLimiter = {
  limit(input: { key: string }): Promise<{ success: boolean }>;
};

export type Bindings = {
  ASSETS: Fetcher;
  BETTER_AUTH_SECRET: string;
  DB: D1Database;
  ENVIRONMENT: "development" | "preview" | "production";
  PUBLIC_TURNSTILE_SITE_KEY?: string;
  RATE_LIMITER: RateLimiter;
  SIGNUP_RATE_LIMITER: RateLimiter;
  TURNSTILE_SECRET_KEY?: string;
};
