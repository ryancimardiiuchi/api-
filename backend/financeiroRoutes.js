import express from "express";
import { PrismaClient } from "./generated/prisma/index.js";
import gerarExcel from "./excel/gerarExcel.js";
import { verificarToken, verificarAdmin } from "./authMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();

router.use(verificarToken, verificarAdmin);

router.get("/", async (req, res) => {
    try {
        const pedidos = await prisma.pedido.findMany({
            include: {
                itensPedido: {
                    include: {
                        servico: true
                    }
                }
            },
            orderBy: {
                dataPedido: "asc"
            }
        });

        let faturamentoTotal = 0;

        const faturamentoPorMes = {};

        pedidos.forEach(pedido => {

            pedido.itensPedido.forEach(item => {

                const valorItem = item.preco;

                faturamentoTotal += valorItem;


                const data = new Date(pedido.dataPedido);

                const mes = data.getMonth();
                const ano = data.getFullYear();


                const chave = `${ano}-${mes}`;

                if (!faturamentoPorMes[chave]) {
                    faturamentoPorMes[chave] = {
                        mes,
                        ano,
                        valor: 0
                    };
                }

                faturamentoPorMes[chave].valor += valorItem;
            });
        });

  
        const dadosGrafico = Object.values(faturamentoPorMes)
            .sort((a, b) => {
                if (a.ano !== b.ano) {
                    return a.ano - b.ano;
                }

                return a.mes - b.mes;
            })
            .map(item => {

                const nomesMeses = [
                    "Jan",
                    "Fev",
                    "Mar",
                    "Abr",
                    "Mai",
                    "Jun",
                    "Jul",
                    "Ago",
                    "Set",
                    "Out",
                    "Nov",
                    "Dez"
                ];

                return {
                    mes: nomesMeses[item.mes],
                    ano: item.ano,
                    valor: item.valor
                };
            });

        res.json({
            quantidadePedidos: pedidos.length,
            faturamentoTotal,
            faturamentoPorMes: dadosGrafico
        });

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao buscar dados financeiros"
        });
    }
});

router.get("/excel", async (req, res) => {
    try {
        await gerarExcel();

        res.download("./financeiro.xlsx", "financeiro.xlsx");

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao gerar relatório financeiro"
        });
    }
});

export default router;