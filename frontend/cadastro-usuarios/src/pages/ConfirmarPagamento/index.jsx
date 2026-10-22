import "./style.css";
import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";
import api from "../../services/api.js";
import CheckoutSteps from "../../components/CheckoutSteps.jsx";

const PUBLIC_KEY = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY;
const formatarMoeda = (valor) =>
    new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(valor) || 0);

if (PUBLIC_KEY) {
    initMercadoPago(PUBLIC_KEY, { locale: "pt-BR" });
}

function ConfirmacaoPedido() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState("");
    const [pagamento, setPagamento] = useState(null);
    const [pedido, setPedido] = useState(null);
    const [dataColeta, setDataColeta] = useState("");
    const [horarioColeta, setHorarioColeta] = useState("");
    const [tentativasRegistro, setTentativasRegistro] = useState(0);
    const pedidoEmCriacao = useRef(false);

    useEffect(() => {
        if (!pagamento?.id || pagamento.status === "approved" || !pagamento.qrCode) {
            return undefined;
        }

        let ativo = true;
        const intervalo = window.setInterval(async () => {
            try {
                const resposta = await api.get(`/api/pagamento/${pagamento.id}`);
                if (ativo) {
                    setPagamento((atual) => ({ ...atual, ...resposta.data }));
                }
            } catch (error) {
                if (ativo) {
                    console.error("Erro ao consultar status do pagamento Pix:", error);
                    setErro(
                        error.response?.data?.erro ||
                        "Não foi possível atualizar o status do Pix."
                    );
                }
            }
        }, 5000);

        return () => {
            ativo = false;
            window.clearInterval(intervalo);
        };
    }, [pagamento?.id, pagamento?.status, pagamento?.qrCode]);

    const formaPagamento = state?.formaPagamento || "pix";
    const metodoTaxa = state?.metodoTaxa || "pix";
    const metodoDigital = formaPagamento === "dinheiro" ? metodoTaxa : formaPagamento;
    const subtotal = Number(state?.subtotal) || 0;
    const taxaColeta = Number(state?.taxaColeta) || 0;
    const valorAdiantado = Number(state?.valorAdiantado) || 0;
    const valorNaColeta = Number(state?.valorNaColeta) || 0;
    const enderecoColeta =
        state?.enderecoColeta?.enderecoCompleto ||
        state?.enderecoColeta?.endereco;
    function formatarDataInput(data) {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        const dia = String(data.getDate()).padStart(2, "0");
        return `${ano}-${mes}-${dia}`;
    }

    const hoje = new Date();
    const dataMinima = formatarDataInput(hoje);
    const ultimoDiaAgendamento = new Date(hoje);
    ultimoDiaAgendamento.setDate(ultimoDiaAgendamento.getDate() + 30);
    const dataMaxima = formatarDataInput(ultimoDiaAgendamento);
    const dataDentroDoPrazo =
        dataColeta >= dataMinima && dataColeta <= dataMaxima;
    const agendamentoCompleto = Boolean(
        dataDentroDoPrazo &&
        ["08:00 às 10:00", "10:00 às 12:00", "12:00 às 14:00", "14:00 às 16:00", "16:00 às 18:00"].includes(horarioColeta)
    );
    const dataFormatada = dataColeta
        ? new Date(`${dataColeta}T12:00:00`).toLocaleDateString("pt-BR")
        : "";
    const formaLabel = {
        pix: "Pix",
        credito: "Cartão de crédito",
        debito: "Cartão de débito",
        dinheiro: "Dinheiro na coleta",
    }[formaPagamento];
    const estadoCheckoutValido = Boolean(
        state?.enderecoColeta?.id &&
        ["pix", "credito", "debito", "dinheiro"].includes(state?.formaPagamento) &&
        valorAdiantado > 0
    );

    useEffect(() => {
        if (
            pagamento?.status !== "approved" ||
            !pagamento?.id ||
            pedido ||
            pedidoEmCriacao.current ||
            !state?.enderecoColeta?.id ||
            !agendamentoCompleto
        ) {
            return;
        }

        pedidoEmCriacao.current = true;
        setCarregando(true);

        api.post("/api/pedidos", {
            EnderecoId: state.enderecoColeta.id,
            dataColeta,
            horarioColeta,
            formaPagamento,
            pagamentoId: String(pagamento.id),
        })
            .then((resposta) => {
                setPedido(resposta.data.pedido);
                setErro("");
            })
            .catch((error) => {
                console.error("Erro ao registrar pedido após pagamento aprovado:", error);
                setErro(
                    error.response?.data?.erro ||
                    "O pagamento foi aprovado, mas não foi possível registrar o pedido."
                );
            })
            .finally(() => {
                pedidoEmCriacao.current = false;
                setCarregando(false);
            });
    }, [
        agendamentoCompleto,
        dataColeta,
        formaPagamento,
        horarioColeta,
        pagamento?.id,
        pagamento?.status,
        pedido,
        state?.enderecoColeta?.id,
        tentativasRegistro,
    ]);

    async function criarPagamentoPix() {
        if (!agendamentoCompleto) {
            setErro("Escolha a data e o horário da coleta antes de continuar.");
            return;
        }

        if (!state?.formaPagamento || valorAdiantado <= 0) {
            setErro("Volte à etapa de pagamento e revise os dados do pedido.");
            return;
        }

        setCarregando(true);
        setErro("");

        try {
            const resposta = await api.post("/api/pagamento", {
                formaPagamento,
                metodoTaxa,
            });
            setPagamento(resposta.data);
        } catch (error) {
            console.error("Erro ao criar pagamento Pix:", error);
            setErro(
                error.response?.data?.erro ||
                error.response?.data?.message ||
                error.message ||
                "Não foi possível criar o pagamento Pix."
            );
        } finally {
            setCarregando(false);
        }
    }

    async function pagarComCartao(cardData) {
        if (!agendamentoCompleto) {
            setErro("Escolha a data e o horário da coleta antes de continuar.");
            return;
        }

        setCarregando(true);
        setErro("");

        try {
            const resposta = await api.post("/api/pagamento", {
                formaPagamento,
                metodoTaxa,
                cardData,
            });
            setPagamento(resposta.data);
        } catch (error) {
            console.error("Erro ao processar pagamento com cartão:", error);
            setErro(
                error.response?.data?.erro ||
                error.response?.data?.message ||
                error.message ||
                "Não foi possível processar o pagamento com cartão."
            );
        } finally {
            setCarregando(false);
        }
    }

    if (!estadoCheckoutValido) {
        return <Navigate to="/agendarcoleta" replace />;
    }

    const cartao = metodoDigital === "credito" || metodoDigital === "debito";
    const tipoCartao = metodoDigital === "credito" ? "credit_card" : "debit_card";
    const pagamentoAprovado = pagamento?.status === "approved";
    const valorRestanteNaColeta = pagamentoAprovado ? valorNaColeta : 0;

    return (
        <div className="confirmacao-page">
            <header className="checkout-header">
                <div className="checkout-header-inner">
                    <div className="checkout-title">
                        <span>ETAPA FINAL</span>
                        <h1>Confirmar pedido</h1>
                        <p>Revise as informações antes de concluir o pagamento.</p>
                    </div>

                    <CheckoutSteps currentStep={3} />
                </div>
            </header>

            <main className="confirmacao-container">
                <section className="confirmacao-principal">
                    <div className="titulo-secao">
                        <h2>Revise seu pedido</h2>
                        <p>Confira o endereço e os valores antes de gerar a cobrança.</p>
                    </div>

                    <div className="card-confirmacao">
                        <div className="card-titulo">
                            <h3>📍 Endereço de coleta</h3>
                            <button type="button" onClick={() => navigate("/agendarcoleta")}>Editar</button>
                        </div>
                        <p>{enderecoColeta || "Endereço não informado"}</p>
                    </div>

                    {pedido && (
                        <p className="agendamento-selecionado">
                            Pedido #{pedido.id} registrado para acompanhamento.
                        </p>
                    )}

                    <div className="card-confirmacao agendamento-card">
                        <div className="card-titulo">
                            <div>
                                <h3>📅 Agendar coleta</h3>
                                <p>Escolha o dia e o horário para buscarmos seu pedido.</p>
                            </div>
                        </div>
                        <div className="agendamento-campos">
                            <label>
                                <span>Data da coleta</span>
                                <input
                                    type="date"
                                    value={dataColeta}
                                    min={dataMinima}
                                    max={dataMaxima}
                                    required
                                    aria-required="true"
                                    onChange={(event) => {
                                        setDataColeta(event.target.value);
                                        setErro("");
                                    }}
                                />
                            </label>
                            <label>
                                <span>Horário disponível (08h às 18h)</span>
                                <select
                                    value={horarioColeta}
                                    required
                                    aria-required="true"
                                    onChange={(event) => {
                                        setHorarioColeta(event.target.value);
                                        setErro("");
                                    }}
                                >
                                    <option value="">Selecione um horário</option>
                                    <option value="08:00 às 10:00">08:00 às 10:00</option>
                                    <option value="10:00 às 12:00">10:00 às 12:00</option>
                                    <option value="12:00 às 14:00">12:00 às 14:00</option>
                                    <option value="14:00 às 16:00">14:00 às 16:00</option>
                                    <option value="16:00 às 18:00">16:00 às 18:00</option>
                                </select>
                            </label>
                        </div>
                        {agendamentoCompleto && (
                            <p className="agendamento-selecionado">
                                Coleta agendada para {dataFormatada}, das {horarioColeta}.
                            </p>
                        )}
                        <p className="agendamento-limite">
                            Você pode agendar para hoje ou para até 30 dias à frente.
                        </p>
                    </div>

                    <div className="card-confirmacao">
                        <div className="card-titulo"><h3>💳 Forma de pagamento</h3></div>
                        <p>{formaLabel}</p>
                        {formaPagamento === "dinheiro" ? (
                            <>
                                <p>Taxa de coleta antecipada ({metodoTaxa}): {formatarMoeda(taxaColeta)}</p>
                                <p>Serviços a pagar em dinheiro na coleta: {formatarMoeda(subtotal)}</p>
                            </>
                        ) : (
                            <p>Valor a pagar agora: {formatarMoeda(valorAdiantado)}</p>
                        )}
                    </div>

                    {erro && <p className="pagamento-erro" role="alert">{erro}</p>}

                    {pagamento?.qrCode && (
                        <div className="card-confirmacao pix-cobranca">
                            <h3>
                                {pagamentoAprovado ? "Pix pago" : "Pix aguardando pagamento"}
                            </h3>
                            {!pagamentoAprovado && pagamento.qrCodeBase64 && (
                                <img
                                    src={`data:image/png;base64,${pagamento.qrCodeBase64}`}
                                    alt="QR Code para pagar com Pix"
                                />
                            )}
                            {!pagamentoAprovado && (
                                <>
                                    <label htmlFor="codigo-pix">Pix copia e cola</label>
                                    <textarea id="codigo-pix" readOnly value={pagamento.qrCode} />
                                    <p>A página consulta automaticamente o status do pagamento.</p>
                                </>
                            )}
                            {pagamentoAprovado && (
                                <p>
                                    {valorRestanteNaColeta > 0
                                        ? `Taxa paga. Serviços a pagar na coleta: ${formatarMoeda(valorRestanteNaColeta)}.`
                                        : "Pagamento aprovado."}
                                </p>
                            )}
                        </div>
                    )}

                    {pagamento && !pagamento.qrCode && (
                        <>
                            <div className={`pagamento-resultado ${pagamentoAprovado ? "aprovado" : ""}`}>
                                {pagamentoAprovado
                                    ? `Pagamento aprovado. ${valorRestanteNaColeta > 0
                                        ? `Serviços a pagar na coleta: ${formatarMoeda(valorRestanteNaColeta)}.`
                                        : "Seu pedido foi pago."}`
                                    : `Status do pagamento: ${pagamento.status || "em processamento"}.`}
                            </div>
                            {!pagamentoAprovado && (
                                <button
                                    className="btn-confirmar"
                                    type="button"
                                    onClick={() => setPagamento(null)}
                                >
                                    Tentar outro pagamento
                                </button>
                            )}
                        </>
                    )}

                    {pagamentoAprovado && !pedido && (
                        <div className="pagamento-resultado aprovado">
                            <p>
                                {carregando
                                    ? "Pagamento aprovado. Registrando pedido..."
                                    : "Pagamento aprovado. O pedido ainda não foi registrado."}
                            </p>
                            {!carregando && (
                                <button
                                    className="btn-confirmar"
                                    type="button"
                                    onClick={() => setTentativasRegistro((tentativa) => tentativa + 1)}
                                >
                                    Tentar registrar pedido
                                </button>
                            )}
                        </div>
                    )}

                    {!pagamento && cartao && agendamentoCompleto && (
                        PUBLIC_KEY ? (
                            <div className="card-confirmacao cartao-form">
                                <h3>
                                    {formaPagamento === "dinheiro"
                                        ? "Pague antecipadamente a taxa de coleta"
                                        : "Pagamento com cartão"}
                                </h3>
                                <CardPayment
                                    initialization={{ amount: valorAdiantado }}
                                    customization={{
                                        paymentMethods: {
                                            types: { included: [tipoCartao] },
                                        },
                                    }}
                                    onSubmit={pagarComCartao}
                                    onError={(error) => {
                                        console.error("Erro no formulário de cartão Mercado Pago:", error);
                                        setErro("Não foi possível carregar ou validar o formulário do cartão.");
                                    }}
                                    locale="pt-BR"
                                />
                            </div>
                        ) : (
                            <p className="pagamento-erro" role="alert">
                                Configure VITE_MERCADO_PAGO_PUBLIC_KEY no .env do frontend para habilitar cartão.
                            </p>
                        )
                    )}

                    {!pagamento && cartao && !agendamentoCompleto && (
                        <p className="agendamento-aviso">
                            Selecione a data e o horário da coleta para liberar o pagamento.
                        </p>
                    )}

                    <div className="botoes-confirmacao">
                        <button
                            className="btn-voltar"
                            type="button"
                            onClick={() => navigate("/pagamento", { state: { enderecoColeta } })}
                        >
                            Voltar
                        </button>

                        {!cartao && !pagamento && (
                            <button
                                className="btn-confirmar"
                                type="button"
                                onClick={criarPagamentoPix}
                                disabled={carregando || !state?.formaPagamento || !agendamentoCompleto}
                            >
                                {carregando
                                    ? "Gerando Pix..."
                                    : formaPagamento === "dinheiro"
                                        ? `Adiantar taxa de ${formatarMoeda(valorAdiantado)} via Pix`
                                        : `Pagar ${formatarMoeda(valorAdiantado)} via Pix`}
                            </button>
                        )}
                    </div>
                </section>

                <aside className="resumo-final">
                    <h2>Resumo</h2>
                    <div className="resumo-linha">
                        <span>Serviços</span>
                        <strong>{formatarMoeda(subtotal)}</strong>
                    </div>
                    <div className="resumo-linha">
                        <span>Taxa de coleta (combustível)</span>
                        <strong>{formatarMoeda(taxaColeta)}</strong>
                    </div>
                    <div className="separador"></div>
                    <div className="resumo-total">
                        <span>Total do pedido</span>
                        <strong>{formatarMoeda(subtotal + taxaColeta)}</strong>
                    </div>
                    <div className="status-pedido">
                        {formaPagamento === "dinheiro"
                            ? `Agora: ${formatarMoeda(valorAdiantado)}; na coleta: ${formatarMoeda(subtotal)}`
                            : `Pagar agora: ${formatarMoeda(valorAdiantado)}`}
                    </div>
                </aside>
            </main>
        </div>
    );
}

export default ConfirmacaoPedido;
