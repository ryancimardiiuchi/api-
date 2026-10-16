import express from "express";
import { gerarDescricao, responderChatbot } from "./iaController.js";
const router = express.Router()
router.post('/descricao', gerarDescricao)
router.post("/chatbot", responderChatbot);
export default router
