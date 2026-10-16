import { PrismaClient } from "./generated/prisma/index.js";

const prisma = new PrismaClient();
const TAXA_COLETA = 5;
const HORARIOS_DISPONIVEIS = new Set([
    "08:00 às 10:00",
    "10:00 às 12:00",
    "12:00 às 14:00",
    "14:00 às 16:00",
    "16:00 às 18:00",
]);

function dataHojeEmSaoPaulo() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
    }).format(new Date());
}

function dataMaximaAgendamento(dataHoje) {
    const data = new Date(`${dataHoje}T12:00:00.000Z`);
    data.setUTCDate(data.getUTCDate() + 30);
    return data.toISOString().slice(0, 10);
}

function dataColetaValida(data) {
    if (typeof data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return false;
    }

    const dataParseada = new Date(`${data}T12:00:00.000Z`);
    if (
        Number.isNaN(dataParseada.getTime()) ||
        dataParseada.toISOString().slice(0, 10) !== data
    ) {
        return false;
    }

    const hoje = dataHojeEmSaoPaulo();
    return data >= hoje && data <= dataMaximaAgendamento(hoje);
}

const incluirDadosPedido = {
    endereco: true,
    user: {
        select: {
            name: true,
            email: true,
            telefone: true,
        },
    },
    itensPedido: {
        include: {
            servico: true,
        },
    },
};

export async function criarPedidoCheckout(req, res) {
    const { EnderecoId, dataColeta, horarioColeta, formaPagamento } = req.body || {};

    if (
        typeof EnderecoId !== "string" ||
        !dataColetaValida(dataColeta) ||
        !HORARIOS_DISPONIVEIS.has(horarioColeta) ||
        !["pix", "credito", "debito", "dinheiro"].includes(formaPagamento)
    ) {
        return res.status(400).json({
            erro: "Informe um endereço, data (até 30 dias), horário e forma de pagamento válidos.",
        });
    }

    try {
        const [endereco, carrinho] = await Promise.all([
            prisma.endereco.findFirst({
                where: {
                    id: EnderecoId,
                    UserId: req.usuario.id,
                },
            }),
            prisma.cart.findUnique({
                where: { UserId: req.usuario.id },
                include: { itens: true },
            }),
        ]);

        if (!endereco) {
            return res.status(404).json({
                erro: "Endereço de coleta não encontrado para este usuário.",
            });
        }

        if (!carrinho?.itens?.length) {
            return res.status(400).json({ erro: "O carrinho está vazio." });
        }

        const subtotal = carrinho.itens.reduce(
            (total, item) => total + Number(item.preco) * Number(item.quantidade),
            0
        );
        const pedido = await prisma.pedido.create({
            data: {
                UserId: req.usuario.id,
                EnderecoId,
                valor: subtotal + TAXA_COLETA,
                status: "coleta agendada",
                dataColeta: new Date(`${dataColeta}T12:00:00.000Z`),
                horarioColeta,
                formaPagamento,
                itensPedido: {
                    create: carrinho.itens.map((item) => ({
                        ServicoId: item.ServicoId,
                        quantidade: item.quantidade,
                        preco: item.preco,
                    })),
                },
            },
            include: incluirDadosPedido,
        });

        return res.status(201).json({ pedido });
    } catch (error) {
        console.error("Erro ao criar pedido do checkout:", error);
        return res.status(500).json({
            erro: "Não foi possível registrar o pedido.",
        });
    }
}

export async function buscarMeuPedido(req, res) {
    try {
        const pedido = await prisma.pedido.findFirst({
            where: {
                UserId: req.usuario.id,
                status: { not: "Entregue" },
            },
            orderBy: { dataPedido: "desc" },
            include: incluirDadosPedido,
        });

        if (!pedido) {
            return res.status(404).json({
                erro: "Você não tem pedidos em andamento para acompanhar.",
            });
        }

        return res.status(200).json({ pedido });
    } catch (error) {
        console.error("Erro ao buscar pedido do usuário:", error);
        return res.status(500).json({
            erro: "Não foi possível carregar o pedido.",
        });
    }
}
