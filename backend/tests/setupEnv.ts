process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'mysql://edunest:edunest_pass@localhost:3306/edunest_test';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.JWT_ACCESS_SECRET ??= 'test_access_secret_at_least_16_chars';
process.env.JWT_REFRESH_SECRET ??= 'test_refresh_secret_at_least_16_chars';
process.env.COOKIE_SECRET ??= 'test_cookie_secret_at_least_16_chars';
process.env.SMTP_HOST ??= 'localhost';
