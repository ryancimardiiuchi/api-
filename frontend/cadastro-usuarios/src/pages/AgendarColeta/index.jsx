import "./style.css";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import  MapaColeta  from "../Mapa";
import api from "../../services/api.js";
import CheckoutSteps from "../../components/CheckoutSteps.jsx";
import Cart from "../../assets/icon/cart.png"

const TAXA_COLETA = 5;
const formatarMoeda = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);

function AgendarColeta() {
  const navigate = useNavigate();
  const [enderecoSelecionado, setEnderecoSelecionado] = useState(null);
  const [itensCarrinho, setItensCarrinho] = useState([]);
  const [carregandoCarrinho, setCarregandoCarrinho] = useState(true);
  const [erroCarrinho, setErroCarrinho] = useState("");
  const [salvandoEndereco, setSalvandoEndereco] = useState(false);
  const [erroEndereco, setErroEndereco] = useState("");

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

  async function continuarParaPagamento() {
    if (!enderecoSelecionado?.endereco || itensCarrinho.length === 0) return;

    setSalvandoEndereco(true);
    setErroEndereco("");

    try {
      const resposta = await api.post(
        "/api/enderecos/coleta",
        enderecoSelecionado
      );
      const enderecoSalvo = {
        ...resposta.data,
        endereco: resposta.data.enderecoCompleto,
      };

      navigate("/pagamento", {
        state: {
          enderecoColeta: enderecoSalvo,
          total,
        },
      });
    } catch (error) {
      console.error("Erro ao salvar endereço de coleta:", error);
      setErroEndereco(
        error.response?.data?.erro ||
          "Não foi possível salvar o endereço. Tente novamente."
      );
    } finally {
      setSalvandoEndereco(false);
    }
  }

  return (
    <div className="agendar-page">

      <main className="agendar-container">

        <div className="agendar-header">
          <Link to="/" className="voltar">
            ←
          </Link>

          <div>
            <h1>Agendar coleta</h1>
            <p>
              Escolha o endereço onde iremos buscar suas roupas.
            </p>
          </div>
        </div>

        <CheckoutSteps currentStep={1} />

        <div className="checkout">

          <section className="area-esquerda">

            <div className="card endereco-card">

              <div className="card-titulo">
                <div className="icone-titulo">📍</div>

                <div>
                  <h2>Endereço de coleta</h2>
                  <p>
                    Escolha o endereço onde iremos buscar suas roupas.
                  </p>
                </div>
              </div>

              <MapaColeta
                compact
                onSelectionChange={setEnderecoSelecionado}
              />

              <div className="endereco-selecionado">
                <strong>Endereço selecionado</strong>
                <span>
                  {enderecoSelecionado?.endereco ||
                    "Busque um endereço ou marque um ponto no mapa."}
                </span>
              </div>
              {erroEndereco && (
                <p className="resumo-erro" role="alert">{erroEndereco}</p>
              )}

              <div className="aviso">

                <div className="aviso-icone">
                  🚚
                </div>

                <div>
                  <strong>
                    Confirme o endereço
                  </strong>

                  <p>
                    Verifique se o endereço está correto.
                    Nossa equipe irá até o local para realizar a coleta.
                  </p>
                </div>

              </div>
              <button
                className="btn-continuar"
                type="button"
                disabled={
                  !enderecoSelecionado?.endereco ||
                  salvandoEndereco ||
                  carregandoCarrinho ||
                  Boolean(erroCarrinho) ||
                  itensCarrinho.length === 0
                }
                onClick={continuarParaPagamento}
              >
                {salvandoEndereco ? "Salvando endereço..." : "Continuar"}
                <span>→</span>
              </button>
            </div>

          </section>


          <aside className="resumo">

            <div className="card resumo-card">

              <div className="resumo-header">

                <div>
                  <img src={Cart} alt="Cart" />
                  <strong>Resumo do pedido</strong>
                </div>

                <Link to="/carrinho">
                  Ver carrinho
                </Link>

              </div>


              {carregandoCarrinho && (
                <p className="resumo-mensagem">Carregando itens do carrinho...</p>
              )}

              {erroCarrinho && (
                <p className="resumo-erro" role="alert">{erroCarrinho}</p>
              )}

              {!carregandoCarrinho && !erroCarrinho && itensCarrinho.length === 0 && (
                <p className="resumo-mensagem">
                  Seu carrinho está vazio.{" "}
                  <Link to="/servicos">Escolha um serviço</Link>
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
                  <span>💳</span>
                  <strong>Forma de pagamento</strong>
                </div>

                <div className="pagamento">
                  <span>◆</span>
                  <strong>Pix</strong>
                  <span className="seta">›</span>
                </div>

              </div>

              <div className="resumo-box">

                <div className="resumo-box-header">

                  <div>
                    <span>📍</span>
                    <strong>Endereço de coleta</strong>
                  </div>

                  <button>
                    Editar
                  </button>

                </div>

                <div className="endereco-resumo">

                  <strong>
                    {enderecoSelecionado?.endereco || "Nenhum endereço selecionado"}
                  </strong>

                  <span>
                    {Number.isFinite(enderecoSelecionado?.lat) &&
                    Number.isFinite(enderecoSelecionado?.lng)
                      ? `Coordenadas: ${enderecoSelecionado.lat.toFixed(5)}, ${enderecoSelecionado.lng.toFixed(5)}`
                      : enderecoSelecionado?.endereco
                        ? "Endereço informado manualmente"
                        : "Busque ou marque o local no mapa"}
                  </span>

                </div>

              </div>

              <div className="resumo-box">

                <div className="resumo-box-header">

                  <div>
                    <span>📅</span>
                    <strong>Data e horário</strong>
                  </div>

                  <span className="horario-proxima-etapa">
                    Definido na etapa de confirmação
                  </span>

                </div>

                <div className="data-resumo">

                  <span>📅 Data e horário definidos na confirmação</span>

                </div>

              </div>

              <div className="seguranca">

                <span>🛡️</span>

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

export default AgendarColeta;