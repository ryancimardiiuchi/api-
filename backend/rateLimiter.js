import { createHash } from "node:crypto";

const WINDOW_SCRIPT = `
  local count = redis.call("INCR", KEYS[1])
  if count == 1 then
    redis.call("EXPIRE", KEYS[1], ARGV[1])
  end
  return { count, redis.call("TTL", KEYS[1]) }
`;

export function createRateLimiter(
  redis,
  { name, limit, windowMs, accountField } = {},
) {
  if (!name || !Number.isInteger(limit) || limit < 1 || !windowMs) {
    throw new Error("Configuração inválida para o rate limit.");
  }

  const windowSeconds = Math.ceil(windowMs / 1000);

  return async function rateLimitRequest(req, res, next) {
    const ip = req.ip || req.socket.remoteAddress;
    const identifiers = [{ type: "ip", value: ip || "ip-desconhecido" }];
    const account =
      accountField && typeof req.body?.[accountField] === "string"
        ? req.body[accountField].trim().toLowerCase()
        : "";

    if (account) {
      identifiers.push({ type: "conta", value: account });
    }

    try {
      const results = await Promise.all(
        identifiers.map(async ({ type, value }) => {
          const hash = createHash("sha256").update(value).digest("hex");
          const [count, ttl] = await redis.eval(WINDOW_SCRIPT, {
            keys: [`rate-limit:${name}:${type}:${hash}`],
            arguments: [String(windowSeconds)],
          });

          return { count: Number(count), ttl: Number(ttl) };
        }),
      );
      const blocked = results.filter(({ count }) => count > limit);

      if (blocked.length) {
        const retryAfter = Math.max(
          1,
          ...blocked.map(({ ttl }) => (ttl > 0 ? ttl : windowSeconds)),
        );
        res.set("Retry-After", String(retryAfter));
        return res.status(429).json({
          message: "Muitas solicitações. Tente novamente mais tarde.",
          retryAfter,
        });
      }

      return next();
    } catch (error) {
      console.error(`Falha no rate limit "${name}":`, error);
      return res.status(503).json({
        message: "Não foi possível validar o limite de solicitações.",
      });
    }
  };
}
