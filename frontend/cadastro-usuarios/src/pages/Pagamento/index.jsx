import "./style.css";
import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api.js";
import CheckoutSteps from "../../components/CheckoutSteps.jsx";

const TAXA_COLETA = 5;
const formatarMoeda = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);

const formasPagamento = {
  pix: {
    nome: "Pix",
    titulo: "Pagamento via Pix",
    descricao: "Após confirmar, as informações para pagar via Pix serão exibidas.",
    icone: "◆",
  },
  credito: {
    nome: "Cartão de crédito",
    titulo: "Cartão de crédito selecionado",
    descricao: "Você selecionou cartão de crédito para pagar este pedido.",
    icone: "💳",
  },
  debito: {
    nome: "Cartão de débito",
    titulo: "Cartão de débito selecionado",
    descricao: "Você selecionou cartão de débito para pagar este pedido.",
    icone: "💳",
  },
  dinheiro: {
    nome: "Dinheiro",
    titulo: "Pagamento em dinheiro",
    descricao: "Os serviços serão pagos em dinheiro na coleta. A taxa de coleta deve ser paga antecipadamente por Pix ou cartão.",
    icone: "💵",
  },
};

function Pagamento() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [formaSelecionada, setFormaSelecionada] = useState("pix");
  const [metodoTaxa, setMetodoTaxa] = useState("pix");
  const [itensCarrinho, setItensCarrinho] = useState([]);
  const [carregandoCarrinho, setCarregandoCarrinho] = useState(true);
  const [erroCarrinho, setErroCarrinho] = useState("");

  useEffect(() => {
    let ativo = true;

    async function buscarCarrinho() {
      try {
        const resposta = await api.get("/carrinho");
        if (ativo) {
          setItensCarrinho(resposta.data.itens || []);
        }
      } catch (error) {
        if (!ativo) return;

        if (error.response?.status === 404) {
          setItensCarrinho([]);
        } else {
          console.error("Erro ao carregar resumo do carrinho:", error);
          setErroCarrinho(
            error.response?.data?.message ||
              "Não foi possível carregar os itens do carrinho."
          );
        }
      } finally {
        if (ativo) {
          setCarregandoCarrinho(false);
        }
      }
    }

    buscarCarrinho();

    return () => {
      ativo = false;
    };
  }, []);

  const subtotal = itensCarrinho.reduce(
    (total, item) => total + Number(item.preco) * Number(item.quantidade),
    0
  );
  const taxaColeta = itensCarrinho.length > 0 ? TAXA_COLETA : 0;
  const total = subtotal + taxaColeta;
  const valorAdiantado = formaSelecionada === "dinheiro" ? taxaColeta : total;
  const valorNaColeta = formaSelecionada === "dinheiro" ? subtotal : 0;
  const enderecoColeta = state?.enderecoColeta;
  const enderecoExibicao =
    enderecoColeta?.enderecoCompleto ||
    enderecoColeta?.endereco ||
    "Endereço não informado";
  const informacaoPagamento = formasPagamento[formaSelecionada];

  function continuarParaConfirmacao() {
    if (
      carregandoCarrinho ||
      erroCarrinho ||
      itensCarrinho.length === 0 ||
      !enderecoColeta?.id
    ) return;

    navigate("/confirmarpagamento", {
      state: {
        enderecoColeta,
        formaPagamento: formaSelecionada,
        metodoTaxa,
        valorAdiantado,
        valorNaColeta,
        subtotal,
        taxaColeta,
        total,
      },
    });
  }

  if (
    !enderecoColeta?.id ||
    !enderecoExibicao ||
    enderecoExibicao === "Endereço não informado"
  ) {
    return <Navigate to="/agendarcoleta" replace />;
  }

  return (
    <div className="pagamento-page">

      <main className="pagamento-container">

        <div className="pagamento-header">

          <Link to="/agendarcoleta" className="voltar">
            ←
          </Link>

          <div>
            <h1>Pagamento</h1>
            <p>
              Escolha como deseja pagar pelo seu pedido.
            </p>
          </div>

        </div>


        <CheckoutSteps currentStep={2} />

        <div className="checkout">

          <section className="area-esquerda">

            <div className="card pagamento-card">

              <div className="card-titulo">

                <div className="icone-titulo">
                  💳
                </div>

                <div>
                  <h2>Forma de pagamento</h2>

                  <p>
                    Selecione uma opção para pagar seu pedido.
                  </p>
                </div>

              </div>

              <label className={`forma-pagamento ${formaSelecionada === "pix" ? "selecionado" : ""}`}>

                <input
                  type="radio"
                  name="pagamento"
                  value="pix"
                  checked={formaSelecionada === "pix"}
                  onChange={() => setFormaSelecionada("pix")}
                />

                <div className="pagamento-icone pix">
                  ◆
                </div>

                <div className="pagamento-info">

                  <strong>Pix</strong>

                  <span>
                    Pagamento rápido e seguro
                  </span>

                </div>

                {formaSelecionada === "pix" && <span className="check">✓</span>}

              </label>
              <label className={`forma-pagamento ${formaSelecionada === "credito" ? "selecionado" : ""}`}>

                <input
                  type="radio"
                  name="pagamento"
                  value="credito"
                  checked={formaSelecionada === "credito"}
                  onChange={() => setFormaSelecionada("credito")}
                />

                <div className="pagamento-icone">
                  💳
                </div>

                <div className="pagamento-info">

                  <strong>Cartão de crédito</strong>

                  <span>
                    Pague à vista ou parcele
                  </span>

                </div>

                {formaSelecionada === "credito" && <span className="check">✓</span>}

              </label>

              <label className={`forma-pagamento ${formaSelecionada === "debito" ? "selecionado" : ""}`}>

                <input
                  type="radio"
                  name="pagamento"
                  value="debito"
                  checked={formaSelecionada === "debito"}
                  onChange={() => setFormaSelecionada("debito")}
                />

                <div className="pagamento-icone">
                  💳
                </div>

                <div className="pagamento-info">

                  <strong>Cartão de débito</strong>

                  <span>
                    Pagamento realizado na hora
                  </span>

                </div>

                {formaSelecionada === "debito" && <span className="check">✓</span>}

              </label>

              <label className={`forma-pagamento ${formaSelecionada === "dinheiro" ? "selecionado" : ""}`}>

                <input
                  type="radio"
                  name="pagamento"
                  value="dinheiro"
                  checked={formaSelecionada === "dinheiro"}
                  onChange={() => setFormaSelecionada("dinheiro")}
                />

                <div className="pagamento-icone">
                  💵
                </div>

                <div className="pagamento-info">

                  <strong>Dinheiro</strong>

                  <span>
                    Serviços na coleta; taxa antecipada
                  </span>

                </div>

                {formaSelecionada === "dinheiro" && <span className="check">✓</span>}

              </label>

              {formaSelecionada === "dinheiro" && (
                <div className="taxa-adiantamento">
                  <strong>Como adiantar a taxa de coleta?</strong>
                  <p>
                    A taxa de {formatarMoeda(taxaColeta)} referente ao combustível
                    é paga agora. Os serviços ficam para pagamento em dinheiro na coleta.
                  </p>
                  <div className="taxa-metodos">
                    <label>
                      <input
                        type="radio"
                        name="metodoTaxa"
                        value="pix"
                        checked={metodoTaxa === "pix"}
                        onChange={() => setMetodoTaxa("pix")}
                      />
                      Pix
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="metodoTaxa"
                        value="credito"
                        checked={metodoTaxa === "credito"}
                        onChange={() => setMetodoTaxa("credito")}
                      />
                      Cartão de crédito
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="metodoTaxa"
                        value="debito"
                        checked={metodoTaxa === "debito"}
                        onChange={() => setMetodoTaxa("debito")}
                      />
                      Cartão de débito
                    </label>
                  </div>
                </div>
              )}


              <div className="pix-info">

                <div className="pix-info-icone">
                  {informacaoPagamento.icone}
                </div>

                <div>

                  <strong>
                    {informacaoPagamento.titulo}
                  </strong>

                  <p>
                    {informacaoPagamento.descricao}
                  </p>

                </div>

              </div>


              {/* ENDEREÇO */}
              <div className="informacao-confirmacao">

                <div className="info-icon">
                  📍
                </div>

                <div>

                  <strong>
                    Endereço de coleta
                  </strong>

                  <span>{enderecoExibicao}</span>

                </div>

                <Link to="/agendarcoleta">
                  Editar
                </Link>

              </div>


              {/* DATA */}
              <div className="informacao-confirmacao">

                <div className="info-icon">
                  📅
                </div>

                <div>

                  <strong>
                    Data e horário
                  </strong>

                  <span className="horario-proxima-etapa">
                    Escolha na confirmação
                  </span>

                </div>

              </div>


              {/* BOTÕES */}
              <div className="acoes">

                <button
                  className="btn-continuar"
                  type="button"
                  disabled={
                    carregandoCarrinho ||
                    Boolean(erroCarrinho) ||
                    itensCarrinho.length === 0
                  }
                  onClick={continuarParaConfirmacao}
                >
                  Continuar
                  <span>→</span>
                </button>

              </div>

            </div>

          </section>


          {/* =========================
              RESUMO
          ========================= */}
          <aside className="resumo">

            <div className="card resumo-card">

              <div className="resumo-header">

                <div>
                  🛒
                  <strong>Resumo do pedido</strong>
                </div>

                <Link to="/carrinho">
                  Ver carrinho
                </Link>

              </div>


              {carregandoCarrinho && (
                <p className="resumo-mensagem">Carregando itens do carrinho...</p>
              )}

              {erroCarrinho && <p className="resumo-erro" role="alert">{erroCarrinho}</p>}

              {!carregandoCarrinho && !erroCarrinho && itensCarrinho.length === 0 && (
                <p className="resumo-mensagem">
                  Seu carrinho está vazio. <Link to="/carrinho">Voltar ao carrinho</Link>
                </p>
              )}

              {itensCarrinho.map((item) => (
                <div className="produto" key={item.id}>
                  <div className="produto-icone">🧺</div>
                  <div className="produto-info">
                    <strong>{item.servico?.nome || "Serviço"}</strong>
                    <span>Quantidade: {item.quantidade}</span>
                  </div>
                  <strong>
                    {formatarMoeda(Number(item.preco) * Number(item.quantidade))}
                  </strong>
                </div>
              ))}


              {/* VALORES */}
              <div className="valores">

                <div>
                  <span>Subtotal</span>
                  <strong>{formatarMoeda(subtotal)}</strong>
                </div>

                <div>
                  <span>Taxa de coleta e entrega</span>
                  <strong>{formatarMoeda(taxaColeta)}</strong>
                </div>
                <div>
                  <span>
                    {formaSelecionada === "dinheiro" ? "Adiantamento agora" : "Pagar agora"}
                  </span>
                  <strong>{formatarMoeda(valorAdiantado)}</strong>
                </div>
                {formaSelecionada === "dinheiro" && (
                  <div>
                    <span>Serviços pagos na coleta</span>
                    <strong>{formatarMoeda(valorNaColeta)}</strong>
                  </div>
                )}

              </div>


              {/* TOTAL */}
              <div className="total">

                <strong>
                  Total da compra
                </strong>

                <strong>
                  {formatarMoeda(total)}
                </strong>

              </div>


              {/* PAGAMENTO */}
              <div className="resumo-box">

                <div className="resumo-box-header">

                  <div>
                    <span>💳</span>
                    <strong>
                      Forma de pagamento
                    </strong>
                  </div>

                </div>

                <div className="pagamento-resumo">

                  <span className="pix-mini">{informacaoPagamento.icone}</span>

                  <span>
                    {informacaoPagamento.nome}
                  </span>

                </div>

              </div>


              <div className="resumo-box">

                <div className="resumo-box-header">

                  <div>
                    <span>📍</span>
                    <strong>
                      Endereço de coleta
                    </strong>
                  </div>

                  <Link to="/agendarcoleta">
                    Editar
                  </Link>

                </div>

                <div className="endereco-resumo">

                  <strong>{enderecoExibicao}</strong>

                </div>

              </div>


              {/* DATA */}
              <div className="resumo-box">

                <div className="resumo-box-header">

                  <div>
                    <span>📅</span>
                    <strong>
                      Data e horário
                    </strong>
                  </div>

                  <span className="horario-proxima-etapa">
                    Escolha na confirmação
                  </span>

                </div>

                <div className="data-resumo">

                  <span>📅 Data e horário definidos na confirmação</span>

                </div>

              </div>


              {/* SEGURANÇA */}
              <div className="seguranca">

                <span>
                  🛡️
                </span>

                <div>

                  <strong>
                    Seus dados estão seguros
                  </strong>

                  <p>
                    Utilizamos boas práticas de segurança
                    para proteger suas informações.
                  </p>

                </div>

              </div>

            </div>

          </aside>

        </div>

      </main>

    </div>
  );
}

export default Pagamento;