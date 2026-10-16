import "./style.css";
import { useState, useEffect, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import api from "../../services/api";
import socket from "../../services/socket";

function ChatCliente() {
  const token = localStorage.getItem("token");
  const [mensagem, setMensagem] = useState("");
  const [mensagens, setMensagens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroMensagem, setErroMensagem] = useState("");
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);
  const [pedido, setPedido] = useState(null);
  const [clienteId, setClienteId] = useState("");
  const [erroPedido, setErroPedido] = useState("");
  const [erroAtualizacao, setErroAtualizacao] = useState("");
  const mensagensRef = useRef(null);
  const pedidoAtivo = Boolean(pedido);

  useEffect(() => {
    let ativo = true;

    async function carregarPedidoEMensagens() {
      try {
        const respostaPedido = await api.get("/api/pedidos/meu");
        const pedidoAtual = respostaPedido.data.pedido;
        if (!ativo) return;

        setPedido(pedidoAtual);
        setClienteId(pedidoAtual.UserId);

        const respostaMensagens = await api.get(
          `/mensagens/${pedidoAtual.UserId}`
        );
        if (!ativo) return;

        setMensagens(respostaMensagens.data.map((msg) => ({
            id: msg.id,
            tipo:
              msg.remetente === "cliente"
                ? "enviada"
                : "recebida",
            texto: msg.texto,
            hora: new Date(
              msg.createdAt
            ).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          })));
      } catch (erro) {
        if (erro.response?.status === 404) {
          setErroPedido("Você não tem pedidos em andamento para acompanhar.");
        } else {
          console.error("Erro ao carregar pedido e mensagens:", erro);
          setErroPedido(
            erro.response?.data?.erro ||
              "Não foi possível carregar os dados do pedido."
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    if (token) carregarPedidoEMensagens();

    return () => {
      ativo = false;
    };
  }, [token]);

  useEffect(() => {
    if (!clienteId || !pedidoAtivo) return undefined;

    let ativo = true;
    const intervalo = window.setInterval(async () => {
      try {
        const resposta = await api.get("/api/pedidos/meu");
        if (ativo) {
          setPedido(resposta.data.pedido);
          setErroAtualizacao("");
        }
      } catch (erro) {
        if (!ativo) return;
        if (erro.response?.status === 404) {
          setPedido(null);
          setErroPedido("Você não tem pedidos em andamento para acompanhar.");
        } else {
          console.error("Erro ao atualizar o pedido acompanhado:", erro);
          setErroAtualizacao("Não foi possível atualizar os dados do pedido.");
        }
      }
    }, 15000);

    return () => {
      ativo = false;
      window.clearInterval(intervalo);
    };
  }, [clienteId, pedidoAtivo]);

  useEffect(() => {
    if (!clienteId || !pedidoAtivo) return undefined;

    function conectarCliente() {
      socket.emit("entrar_sala", clienteId);
    }

    function receberMensagem(dados) {
      if (dados.clienteId !== clienteId) {
        return;
      }

      if (dados.remetente === "cliente") {
        return;
      }

      setMensagens((mensagensAtuais) => [
          ...mensagensAtuais,
          {
            id: dados.id,
            tipo: "recebida",
            texto: dados.texto,
            hora: new Date(
              dados.createdAt
            ).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
    }

    socket.on("connect", conectarCliente);
    socket.on("receber_mensagem", receberMensagem);

    if (socket.connected) conectarCliente();
    else socket.connect();

    return () => {
      socket.off("connect", conectarCliente);
      socket.off("receber_mensagem", receberMensagem);
      socket.disconnect();
    };
  }, [clienteId, pedidoAtivo]);

  /*
  ========================================
  ROLAR CHAT PARA O FINAL
  ========================================
  */

  useEffect(() => {
    if (mensagensRef.current) {
      mensagensRef.current.scrollTop =
        mensagensRef.current.scrollHeight;
    }
  }, [mensagens]);

  /*
  ========================================
  ENVIAR MENSAGEM
  ========================================
  */

  function enviarMensagem() {
    if (
      !mensagem.trim() ||
      !clienteId ||
      !pedido ||
      enviandoMensagem
    ) {
      return;
    }

    const textoMensagem =
      mensagem.trim();

    setEnviandoMensagem(true);
    setErroMensagem("");
    socket.emit(
      "mensagem",
      {
        clienteId,
        texto: textoMensagem,
        remetente: "cliente",
      },
      (resposta) => {
        setEnviandoMensagem(false);
        if (resposta?.erro) {
          setErroMensagem(resposta.erro);
          return;
        }

        const mensagemSalva = resposta?.mensagem;
        if (!mensagemSalva) {
          setErroMensagem("O servidor não confirmou o envio da mensagem.");
          return;
        }

        setMensagens((mensagensAtuais) => [
          ...mensagensAtuais,
          {
            id: mensagemSalva.id,
            tipo: "enviada",
            texto: mensagemSalva.texto,
            hora: new Date(mensagemSalva.createdAt).toLocaleTimeString(
              "pt-BR",
              { hour: "2-digit", minute: "2-digit" }
            ),
          },
        ]);
        setMensagem("");
      }
    );
  }

  if (!token) return <Navigate to="/login" replace />;
  if (carregando) {
    return <div className="chat-estado">Carregando seu pedido...</div>;
  }
  if (erroPedido === "Você não tem pedidos em andamento para acompanhar.") {
    return <Navigate to="/carrinho" replace />;
  }
  if (erroPedido || !pedido) {
    return (
      <main className="chat-estado chat-estado-erro">
        <p>{erroPedido || "Não foi possível carregar o pedido."}</p>
        <Link to="/carrinho">Voltar ao carrinho</Link>
      </main>
    );
  }

  const formatarMoeda = (valor) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(valor) || 0);
  const itensPedido = pedido.itensPedido || [];
  const subtotalPedido = itensPedido.reduce(
    (total, item) => total + Number(item.preco) * Number(item.quantidade),
    0
  );
  const taxaPedido = Math.max(0, Number(pedido.valor) - subtotalPedido);
  const dataColetaFormatada = pedido.dataColeta
    ? new Date(pedido.dataColeta).toLocaleDateString("pt-BR", {
        timeZone: "UTC",
      })
    : "A definir";
  const enderecoPedido =
    pedido.endereco?.enderecoCompleto ||
    [
      pedido.endereco?.rua,
      pedido.endereco?.numero,
      pedido.endereco?.bairro,
      pedido.endereco?.cep,
    ].filter(Boolean).join(", ") ||
    "Endereço não informado";
  const cliente = pedido.user;
  const status = pedido.status || "coleta agendada";
  const etapaAtual =
    status === "Entregue" ? 4 :
    status === "Pronto para Entrega" ? 3 :
    status === "Em andamento" ? 2 : 0;
  const etapas = ["Agendado", "Coleta", "Lavando", "Pronto", "Entregue"];

  return (
    <div className="pedido-chat-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <header className="pedido-header">

        <Link to="/carrinho" className="pedido-voltar">
          <span aria-hidden="true">←</span>
          Voltar ao carrinho
        </Link>

        <div>
          <span className="pedido-header-subtitle">
            Lavô+
          </span>

          <h1>
            Meu pedido
          </h1>
        </div>

        <div className="pedido-numero">
          Pedido <strong>#{pedido.id.slice(-6)}</strong>
        </div>

      </header>


      {/* =====================================
          CONTEÚDO
      ===================================== */}

      <main className="pedido-layout">

        {/* ===================================
            LADO DO PEDIDO
        =================================== */}

        <section className="pedido-conteudo">

          <div className="pedido-card cliente-card">
            <div className="cliente-avatar" aria-hidden="true">
              {cliente?.name?.trim()?.charAt(0)?.toUpperCase() || "C"}
            </div>
            <div className="cliente-dados">
              <span className="titulo-pequeno">DADOS DO CLIENTE</span>
              <strong>{cliente?.name || "Cliente"}</strong>
              <span>{cliente?.email || "E-mail não informado"}</span>
              <span>{cliente?.telefone || "Telefone não informado"}</span>
            </div>
          </div>

          {erroAtualizacao && (
            <p className="pedido-atualizacao-aviso" role="status">
              {erroAtualizacao}
            </p>
          )}

          {/* STATUS */}

          <div className="pedido-card status-card">

            <div className="card-titulo">

              <div>
                <span className="titulo-pequeno">
                  STATUS DO PEDIDO
                </span>

                <h2>{status}</h2>
              </div>

              <span className="status-badge">{status}</span>

            </div>


            <div className="status-linha">
              {etapas.map((etapa, index) => (
                <div className="status-etapa-grupo" key={etapa}>
                  <div className={`status-etapa${index <= etapaAtual ? " ativa" : ""}`}>
                    <div className="status-circulo">
                      {index < etapaAtual ? "✓" : index + 1}
                    </div>
                    <span>{etapa}</span>
                  </div>
                  {index < etapas.length - 1 && (
                    <div
                      className={`status-conector${index < etapaAtual ? " ativo" : ""}`}
                    />
                  )}
                </div>
              ))}
            </div>

          </div>


          {/* INFORMAÇÕES */}

          <div className="pedido-grid">

            {/* SERVIÇOS */}

            <div className="pedido-card">

              <div className="card-titulo">
                <h3>
                  Serviços
                </h3>
              </div>

              {itensPedido.map((item) => (
                <div className="servico-item" key={item.id}>
                  <div>
                    <strong>{item.servico?.nome || "Serviço"}</strong>
                    <span>Quantidade: {item.quantidade}</span>
                  </div>
                  <strong>
                    {formatarMoeda(Number(item.preco) * Number(item.quantidade))}
                  </strong>
                </div>
              ))}

              <div className="servico-item">

                <div>
                  <strong>
                    Taxa de coleta
                  </strong>
                </div>

                <strong>{formatarMoeda(taxaPedido)}</strong>

              </div>

              <div className="pedido-total">

                <span>
                  Total
                </span>

                <strong>{formatarMoeda(pedido.valor)}</strong>

              </div>

            </div>


            {/* COLETA */}

            <div className="pedido-card">

              <div className="card-titulo">
                <h3>
                  Coleta
                </h3>
              </div>

              <div className="info-item">

                <span>
                  📅 Data
                </span>

                <strong>{dataColetaFormatada}</strong>

              </div>

              <div className="info-item">

                <span>
                  🕐 Horário
                </span>

                <strong>{pedido.horarioColeta || "A definir"}</strong>

              </div>

              <div className="info-item">

                <span>
                  📍 Endereço
                </span>

                <strong>{enderecoPedido}</strong>

              </div>

            </div>

          </div>


          {/* PREVISÃO */}

          <div className="pedido-card previsao-card">

            <div className="previsao-icon">
              🧺
            </div>

            <div>
              <span>
                PREVISÃO DE ENTREGA
              </span>

              <strong>
                {status === "Entregue"
                  ? "Pedido entregue"
                  : status === "Pronto para Entrega"
                    ? "Seu pedido está pronto"
                    : "Atualizada conforme o andamento do pedido"}
              </strong>
            </div>

          </div>

        </section>


        {/* ===================================
            CHAT
        =================================== */}

        <section className="chat-cliente-card">

          {/* HEADER CHAT */}

          <header className="chat-cliente-top">

            <div className="chat-atendimento-avatar">
              L
            </div>

            <div className="chat-atendimento-info">

              <strong>
                Atendimento Lavô+
              </strong>

              <span>
                <i></i>
                Online
              </span>

            </div>

          </header>


          {/* MENSAGENS */}

          <div
            className="chat-cliente-mensagens"
            ref={mensagensRef}
          >

            {carregando ? (
              <div className="chat-carregando">
                Carregando mensagens...
              </div>
            ) : mensagens.length === 0 ? (
              <div className="chat-sem-mensagens">

                <div>
                  💬
                </div>

                <strong>
                  Como podemos ajudar?
                </strong>

                <span>
                  Envie uma mensagem para falar
                  com nosso atendimento.
                </span>

              </div>
            ) : (
              mensagens.map(
                (msg, index) => (
                  <div
                    key={
                      msg.id || index
                    }
                    className={
                      msg.tipo ===
                      "enviada"
                        ? "mensagem mensagem-enviada"
                        : "mensagem mensagem-recebida"
                    }
                  >

                    <span>
                      {msg.texto}
                    </span>

                    <small>
                      {msg.hora}
                    </small>

                  </div>
                )
              )
            )}

          </div>

          {erroMensagem && (
            <p className="chat-mensagem-erro" role="alert">
              {erroMensagem}
            </p>
          )}

          {/* INPUT */}

          <div className="chat-cliente-footer">

            <input
              type="text"
              placeholder="Digite uma mensagem..."
              value={mensagem}
              disabled={enviandoMensagem}
              maxLength={2000}
              onChange={(e) =>
                setMensagem(
                  e.target.value
                )
              }
              onKeyDown={(e) => {

                if (
                  e.key === "Enter"
                ) {
                  enviarMensagem();
                }

              }}
            />

            <button
              onClick={enviarMensagem}
              title="Enviar mensagem"
              disabled={enviandoMensagem}
            >
              ➤
            </button>

          </div>

        </section>

      </main>

    </div>
  );
}

export default ChatCliente;