import express from "express";
import { consultarPagamento, criarPagamento } from "./pagamentoController.js";
import { verificarToken } from "./authMiddleware.js";

const router = express.Router();

router.post("/pagamento", verificarToken, criarPagamento);
router.get("/pagamento/:id", verificarToken, consultarPagamento);


export default router;
