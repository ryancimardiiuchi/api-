import xl from "excel4node";
import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

async function gerarExcel() {
    try {

        const pedidos = await prisma.pedido.findMany({
            include: {
                user: {
                    select: {
                        name: true
                    }
                },
                itensPedido: {
                    include: {
                        servico: {
                            select: {
                                nome: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                dataPedido: "asc"
            }
        });

        const wb = new xl.Workbook();

        const wsPedidos = wb.addWorksheet("Pedidos");
        const wsResumo = wb.addWorksheet("Resumo");

        const estiloCabecalho = {
            font: {
                bold: true,
                color: "#FFFFFF",
                size: 12
            },
            fill: {
                type: "pattern",
                patternType: "solid",
                fgColor: "#222222"
            },
            alignment: {
                horizontal: "center",
                vertical: "center"
            }
        };

        const estiloTitulo = {
            font: {
                bold: true,
                size: 18,
                color: "#FFFFFF"
            },
            fill: {
                type: "pattern",
                patternType: "solid",
                fgColor: "#222222"
            },
            alignment: {
                horizontal: "center",
                vertical: "center"
            }
        };

        const estiloMoeda = wb.createStyle({
            numberFormat: '"R$" #,##0.00'
        });

        const colunas = [
            "Pedido",
            "Cliente",
            "Serviço",
            "Quantidade",
            "Valor do item",
            "Data",
            "Status"
        ];

        colunas.forEach((coluna, index) => {

            wsPedidos
                .cell(1, index + 1)
                .string(coluna)
                .style(estiloCabecalho);

        });

        let linha = 2;

        let faturamentoTotal = 0;

        pedidos.forEach(pedido => {

            pedido.itensPedido.forEach(item => {

                const valorItem = item.preco;

                faturamentoTotal += valorItem;

                wsPedidos
                    .cell(linha, 1)
                    .string(pedido.id);

                wsPedidos
                    .cell(linha, 2)
                    .string(pedido.user.name);

                wsPedidos
                    .cell(linha, 3)
                    .string(item.servico.nome);

                wsPedidos
                    .cell(linha, 4)
                    .number(item.quantidade);

                wsPedidos
                    .cell(linha, 5)
                    .number(valorItem)
                    .style(estiloMoeda);

                wsPedidos
                    .cell(linha, 6)
                    .string(
                        pedido.dataPedido.toLocaleDateString("pt-BR")
                    );

                wsPedidos
                    .cell(linha, 7)
                    .string(pedido.status);

                linha++;
            });

        });

        wsPedidos.column(1).setWidth(28);
        wsPedidos.column(2).setWidth(25);
        wsPedidos.column(3).setWidth(25);
        wsPedidos.column(4).setWidth(15);
        wsPedidos.column(5).setWidth(18);
        wsPedidos.column(6).setWidth(15);
        wsPedidos.column(7).setWidth(22);

        wsResumo
            .cell(1, 1, 1, 4, true)
            .string("RELATÓRIO FINANCEIRO - LAVÔ+")
            .style(estiloTitulo);

        wsResumo
            .cell(3, 1)
            .string("Indicador")
            .style(estiloCabecalho);

        wsResumo
            .cell(3, 2)
            .string("Valor")
            .style(estiloCabecalho);

        wsResumo
            .cell(4, 1)
            .string("Quantidade de pedidos");

        wsResumo
            .cell(4, 2)
            .number(pedidos.length);

        wsResumo
            .cell(5, 1)
            .string("Faturamento total");

        wsResumo
            .cell(5, 2)
            .number(faturamentoTotal)
            .style(estiloMoeda);

        wsResumo.column(1).setWidth(30);
        wsResumo.column(2).setWidth(20);
        wsResumo.column(3).setWidth(20);
        wsResumo.column(4).setWidth(20);

        await wb.write("financeiro.xlsx");

        console.log("Excel criado com sucesso!");

    } catch (erro) {

        console.error("Erro ao gerar Excel:");
        console.error(erro);

    } finally {

        await prisma.$disconnect();

    }
}

export default gerarExcel