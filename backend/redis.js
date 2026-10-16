import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.on("error", (erro) => {
  console.error("Erro no Redis:", erro.message);
});

await redis.connect();

console.log("Redis conectado com sucesso!");

export default redis;