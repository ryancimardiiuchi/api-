import { PrismaClient } from "./generated/prisma/index.js";
import { MercadoPagoConfig, Payment } from "mercadopago";

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
    const {
        EnderecoId,
        dataColeta,
        horarioColeta,
        formaPagamento,
        pagamentoId,
    } = req.body || {};

    if (
        typeof EnderecoId !== "string" ||
        !dataColetaValida(dataColeta) ||
        !HORARIOS_DISPONIVEIS.has(horarioColeta) ||
        !["pix", "credito", "debito", "dinheiro"].includes(formaPagamento) ||
        (typeof pagamentoId !== "string" && typeof pagamentoId !== "number")
    ) {
        return res.status(400).json({
            erro: "Informe um endereço, data (até 30 dias), horário, forma de pagamento e pagamento aprovado válidos.",
        });
    }

    try {
        const accessToken = process.env.TOKEN_MERCADO_PAGO;
        if (!accessToken) {
            console.error("TOKEN_MERCADO_PAGO não está configurado.");
            return res.status(503).json({
                erro: "Não foi possível confirmar o pagamento no momento.",
            });
        }

        let pagamento;
        try {
            const payment = new Payment(new MercadoPagoConfig({ accessToken }));
            pagamento = await payment.get({ id: String(pagamentoId) });
        } catch (error) {
            console.error("Erro ao validar pagamento antes de criar pedido:", error);
            return res.status(502).json({
                erro: "Não foi possível confirmar o pagamento.",
            });
        }

        if (
            pagamento.status !== "approved" ||
            pagamento.external_reference !== req.usuario.id
        ) {
            return res.status(402).json({
                erro: "O pedido só pode ser registrado após a aprovação do pagamento.",
            });
        }

        const pedidoExistente = await prisma.pedido.findFirst({
            where: {
                UserId: req.usuario.id,
                pagamentoId: String(pagamentoId),
            },
            include: incluirDadosPedido,
        });

        if (pedidoExistente) {
            return res.status(200).json({ pedido: pedidoExistente });
        }

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
        const valorEsperado = formaPagamento === "dinheiro"
            ? TAXA_COLETA
            : subtotal + TAXA_COLETA;

        if (
            !Number.isFinite(Number(pagamento.transaction_amount)) ||
            Math.round(Number(pagamento.transaction_amount) * 100) !==
                Math.round(valorEsperado * 100)
        ) {
            return res.status(402).json({
                erro: "O valor pago não corresponde ao valor esperado para este pedido.",
            });
        }

        const pedido = await prisma.pedido.create({
            data: {
                UserId: req.usuario.id,
                EnderecoId,
                valor: subtotal + TAXA_COLETA,
                status: "coleta agendada",
                pagamentoId: String(pagamentoId),
                statusPagamento: pagamento.status,
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
