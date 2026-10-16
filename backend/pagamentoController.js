import { MercadoPagoConfig, Payment } from "mercadopago";
import crypto from "crypto";
import { PrismaClient } from "./generated/prisma/index.js";

const prisma = new PrismaClient();
const TAXA_COLETA = 5;

export async function criarPagamento(req, res) {
    const formaPagamento = req.body?.formaPagamento;
    const metodoTaxa = req.body?.metodoTaxa;
    const cardData = req.body?.cardData;
    const formaDigital = formaPagamento === "dinheiro" ? metodoTaxa : formaPagamento;

    if (!["pix", "credito", "debito", "dinheiro"].includes(formaPagamento)) {
        return res.status(400).json({ erro: "Forma de pagamento inválida." });
    }

    if (formaPagamento === "dinheiro" && !["pix", "credito", "debito"].includes(metodoTaxa)) {
        return res.status(400).json({
            erro: "Escolha Pix ou cartão para adiantar a taxa de coleta."
        });
    }

    if (!["pix", "credito", "debito"].includes(formaDigital)) {
        return res.status(400).json({ erro: "Método de pagamento eletrônico inválido." });
    }

    if (formaDigital !== "pix" && (
        typeof cardData?.token !== "string" ||
        typeof cardData?.payment_method_id !== "string" ||
        !Number.isInteger(Number(cardData?.installments)) ||
        Number(cardData?.installments) < 1 ||
        !cardData?.payer?.identification?.number
    )) {
        return res.status(400).json({
            erro: "Dados tokenizados do cartão incompletos. Preencha o formulário do Mercado Pago."
        });
    }

    const accessToken = process.env.TOKEN_MERCADO_PAGO;
    if (!accessToken) {
        console.error("TOKEN_MERCADO_PAGO não está configurado.");
        return res.status(503).json({
            erro: "O pagamento está indisponível: configure TOKEN_MERCADO_PAGO no backend."
        });
    }

    try {
        const usuario = await prisma.user.findUnique({
            where: { id: req.usuario.id },
            include: {
                cart: {
                    include: { itens: true }
                }
            }
        });

        if (!usuario) {
            return res.status(404).json({ erro: "Usuário do pagamento não encontrado." });
        }

        const itens = usuario.cart?.itens || [];
        if (itens.length === 0) {
            return res.status(400).json({ erro: "O carrinho está vazio." });
        }

        const subtotal = itens.reduce(
            (total, item) => total + Number(item.preco) * Number(item.quantidade),
            0
        );
        const valor = formaPagamento === "dinheiro"
            ? TAXA_COLETA
            : subtotal + TAXA_COLETA;
        const nomes = usuario.name.trim().split(/\s+/);
        const primeiroNome = nomes[0] || "Cliente";
        const sobrenome = nomes.slice(1).join(" ") || primeiroNome;
        const payer = {
            email: usuario.email,
            first_name: primeiroNome,
            last_name: sobrenome,
        };

        if (formaDigital === "pix" && req.body?.cpf) {
            const cpf = String(req.body.cpf).replace(/\D/g, "");
            if (cpf.length !== 11) {
                return res.status(400).json({ erro: "CPF inválido." });
            }
            payer.identification = { type: "CPF", number: cpf };
        }

        if (formaDigital !== "pix") {
            payer.identification = {
                type: cardData.payer.identification.type || "CPF",
                number: String(cardData.payer.identification.number).replace(/\D/g, ""),
            };
        }

        const body = formaDigital === "pix"
            ? {
                transaction_amount: valor,
                description: formaPagamento === "dinheiro"
                    ? "Taxa antecipada de coleta Lavô+"
                    : "Pedido Lavô+",
                external_reference: usuario.id,
                payment_method_id: "pix",
                payer,
            }
            : {
                transaction_amount: valor,
                description: formaPagamento === "dinheiro"
                    ? "Taxa antecipada de coleta Lavô+"
                    : "Pedido Lavô+",
                external_reference: usuario.id,
                token: cardData.token,
                payment_method_id: cardData.payment_method_id,
                installments: Number(cardData.installments),
                issuer_id: cardData.issuer_id,
                payer,
            };

        const payment = new Payment(new MercadoPagoConfig({ accessToken }));
        const pagamento = await payment.create({
            body,
            requestOptions: {
                idempotencyKey: crypto.randomUUID()
            }
        });

        console.log("PAGAMENTO CRIADO:", pagamento.id, pagamento.status);
        return res.status(201).json({
            id: pagamento.id,
            status: pagamento.status,
            statusDetail: pagamento.status_detail,
            valor,
            qrCode: pagamento.point_of_interaction?.transaction_data?.qr_code,
            qrCodeBase64: pagamento.point_of_interaction?.transaction_data?.qr_code_base64
        });
    } catch (erro) {
        console.error("ERRO AO CRIAR PAGAMENTO NO MERCADO PAGO:", erro);

        const statusProvedor = Number(erro?.status);
        const status = statusProvedor >= 400 && statusProvedor < 500
            ? statusProvedor
            : 502;

        return res.status(status).json({
            erro: "Falha ao criar o pagamento no Mercado Pago.",
            detalhe: erro?.message || "Erro sem detalhe retornado pelo provedor."
        });
    }
}

export async function consultarPagamento(req, res) {
    const accessToken = process.env.TOKEN_MERCADO_PAGO;
    const paymentId = req.params.id;

    if (!accessToken) {
        return res.status(503).json({
            erro: "O pagamento está indisponível: configure TOKEN_MERCADO_PAGO no backend."
        });
    }

    if (!paymentId) {
        return res.status(400).json({ erro: "ID do pagamento não informado." });
    }

    try {
        const payment = new Payment(new MercadoPagoConfig({ accessToken }));
        const pagamento = await payment.get({ id: paymentId });

        if (pagamento.external_reference !== req.usuario.id) {
            return res.status(404).json({ erro: "Pagamento não encontrado." });
        }

        return res.status(200).json({
            id: pagamento.id,
            status: pagamento.status,
            statusDetail: pagamento.status_detail,
        });
    } catch (erro) {
        console.error("ERRO AO CONSULTAR PAGAMENTO NO MERCADO PAGO:", erro);

        const statusProvedor = Number(erro?.status);
        const status = statusProvedor >= 400 && statusProvedor < 500
            ? statusProvedor
            : 502;

        return res.status(status).json({
            erro: "Falha ao consultar o pagamento no Mercado Pago.",
            detalhe: erro?.message || "Erro sem detalhe retornado pelo provedor."
        });
    }
}
