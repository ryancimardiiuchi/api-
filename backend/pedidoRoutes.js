import express from "express";
import { verificarToken } from "./authMiddleware.js";
import { buscarMeuPedido, criarPedidoCheckout } from "./pedidoController.js";

const router = express.Router();

router.get("/pedidos/meu", verificarToken, buscarMeuPedido);
router.post("/pedidos", verificarToken, criarPedidoCheckout);

export default router;
