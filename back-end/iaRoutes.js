import express from "express";
import { gerarDescricao } from "./iaController.js";
const router = express.Router()
router.post('/descricao', gerarDescricao)
export default router
