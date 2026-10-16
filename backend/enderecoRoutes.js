import express from "express";
import { verificarToken } from "./authMiddleware.js";
import { salvarEnderecoColeta } from "./enderecoController.js";

const router = express.Router();

router.post("/enderecos/coleta", verificarToken, salvarEnderecoColeta);

export default router;
