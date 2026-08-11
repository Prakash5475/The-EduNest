/**
 * Prisma models across this schema use `BigInt` (UnsignedBigInt) primary/foreign
 * keys. Node's `JSON.stringify` — and therefore Express's `res.json()` — throws
 * on plain `BigInt` values by default ("Do not know how to serialize a BigInt").
 *
 * Rather than hand-writing a serializer for every one of the 130+ models (as
 * Phase 1 did for the handful of auth-related types it needed), we teach
 * `BigInt` how to serialize itself once, globally, at process bootstrap. Every
 * id/foreign-key becomes a decimal string in JSON responses — the same shape
 * Phase 1's manual serializers already produced for User/Session/etc., so this
 * changes no API contract, only removes the need to repeat it by hand.
 *
 * Import this module for its side effect only, before anything touches Prisma
 * output (see server.ts / app.ts / tests/setupEnv.ts).
 */
declare global {
  interface BigInt {
    toJSON(): string;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function toJSON(this: bigint) {
  return this.toString();
};

export {};
