import "dotenv/config";
import redis from "./redis.js";

await redis.set("lavomais:teste", "conectado", {
  EX: 60,
});

const resultado = await redis.get("lavomais:teste");

console.log(resultado);

await redis.quit();