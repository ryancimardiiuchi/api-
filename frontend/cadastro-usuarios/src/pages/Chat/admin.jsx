import "./admin.css";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../../services/api";
import socket from "../../services/socket";

function ChatAdmin() {
  const location = useLocation();
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [conversas, setConversas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [buscaCliente, setBuscaCliente] = useState("");
   useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      if (payload.role !== "admin") {
        window.location.href = "/";
      }
    } catch (erro) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      console.log(erro)
    }
  }, []);
  useEffect(() => {
    async function carregarUsuarios() {
      try {
        const resposta = await api.get("/usuarios-chat");

        const usuarios = resposta.data.map((usuario) => ({
          id: usuario.id,
          nome: usuario.name,
          pedido: "—",
          ultimaMensagem: "Nenhuma mensagem",
          mensagens: [],
        }));

        setConversas(usuarios);
        const clienteAlvo = usuarios.find(
          (usuario) => usuario.id === location.state?.clienteId,
        );
        if (clienteAlvo) {
          await selecionarCliente(clienteAlvo);
        }
      } catch (erro) {
        console.error("Erro ao carregar usuários:", erro);
      } finally {
        setCarregando(false);
      }
    }

    carregarUsuarios();
  }, [location.state?.clienteId]);

  useEffect(() => {
    function conectarAdmin() {
      console.log("Admin conectado:", socket.id);
    }

    function receberMensagem(dados) {
      console.log("Mensagem recebida do cliente:", dados);

      setConversas((conversasAtuais) =>
        conversasAtuais.map((conversa) => {
          if (conversa.id !== dados.clienteId) {
            return conversa;
          }

          return {
            ...conversa,
            ultimaMensagem: dados.texto,
            mensagens: [
              ...conversa.mensagens,
              {
                tipo: "recebida",
                texto: dados.texto,
              },
            ],
          };
        })
      );

      setClienteSelecionado((clienteAtual) => {
        if (!clienteAtual) {
          return clienteAtual;
        }

        if (clienteAtual.id !== dados.clienteId) {
          return clienteAtual;
        }

        return {
          ...clienteAtual,
          ultimaMensagem: dados.texto,
          mensagens: [
            ...clienteAtual.mensagens,
            {
              tipo: "recebida",
              texto: dados.texto,
            },
          ],
        };
      });
    }

    socket.on("connect", conectarAdmin);
    socket.on("receber_mensagem", receberMensagem);

    if (socket.connected) {
      conectarAdmin();
    } else {
      socket.connect();
    }

    return () => {
      socket.off("connect", conectarAdmin);
      socket.off("receber_mensagem", receberMensagem);
      socket.disconnect();
    };
  }, []);

  async function selecionarCliente(conversa) {
    try {
      socket.emit("entrar_sala", conversa.id);

      console.log("Entrando na sala:", conversa.id);

      const resposta = await api.get(
        `/mensagens/${conversa.id}`
      );

      const mensagens = resposta.data.map((msg) => ({
        tipo:
          msg.remetente === "admin"
            ? "enviada"
            : "recebida",
        texto: msg.texto,
      }));

      const conversaAtualizada = {
        ...conversa,
        mensagens: mensagens,
        ultimaMensagem:
          mensagens.length > 0
            ? mensagens[mensagens.length - 1].texto
            : "Nenhuma mensagem",
      };

      setClienteSelecionado(conversaAtualizada);

      setConversas((conversasAtuais) =>
        conversasAtuais.map((item) =>
          item.id === conversa.id
            ? conversaAtualizada
            : item
        )
      );
    } catch (erro) {
      console.error(
        "Erro ao carregar mensagens:",
        erro
      );
    }
  }

  function enviarMensagem() {
    if (!mensagem.trim() || !clienteSelecionado) {
      return;
    }

    const textoMensagem = mensagem.trim();

    socket.emit("mensagem", {
      clienteId: clienteSelecionado.id,
      texto: textoMensagem,
      remetente: "admin",
    });

    const novaMensagem = {
      tipo: "enviada",
      texto: textoMensagem,
    };

    const conversaAtualizada = {
      ...clienteSelecionado,
      ultimaMensagem: textoMensagem,
      mensagens: [
        ...clienteSelecionado.mensagens,
        novaMensagem,
      ],
    };

    setClienteSelecionado(conversaAtualizada);

    setConversas((conversasAtuais) =>
      conversasAtuais.map((conversa) =>
        conversa.id === clienteSelecionado.id
          ? conversaAtualizada
          : conversa
      )
    );

    setMensagem("");
  }

  const conversasFiltradas = conversas.filter((conversa) =>
    `${conversa.nome} ${conversa.ultimaMensagem}`
      .toLocaleLowerCase("pt-BR")
      .includes(buscaCliente.trim().toLocaleLowerCase("pt-BR")),
  );

  return (
    <div className="chat-admin">

      {/* SIDEBAR */}
      <aside className="chat-sidebar">

        <div className="chat-sidebar-header">

          <Link
            to="/admin"
            className="btn-voltar-admin"
            title="Voltar para o painel"
          >
            <i className="bi bi-arrow-left"></i>
          </Link>

          <div>
            <h2>Mensagens</h2>
            <span>Atendimento aos clientes</span>
          </div>

          <div className="chat-status">
            ● Online
          </div>

        </div>

        <div className="chat-search">
          <input
            type="text"
            placeholder="Pesquisar cliente..."
            value={buscaCliente}
            onChange={(event) => setBuscaCliente(event.target.value)}
          />
        </div>

        <div className="conversas">

          {carregando ? (
            <p>Carregando clientes...</p>
          ) : conversasFiltradas.length === 0 ? (
            <p>Nenhum cliente encontrado.</p>
          ) : (
            conversasFiltradas.map((conversa) => (

              <button
                key={conversa.id}
                className={
                  clienteSelecionado?.id === conversa.id
                    ? "conversa ativa"
                    : "conversa"
                }
                onClick={() =>
                  selecionarCliente(conversa)
                }
              >

                <div className="conversa-avatar">
                  {conversa.nome.charAt(0).toUpperCase()}
                </div>

                <div className="conversa-info">

                  <div className="conversa-top">
                    <strong>{conversa.nome}</strong>
                    <small>Agora</small>
                  </div>

                  <span>
                    Pedido {conversa.pedido}
                  </span>

                  <p>
                    {conversa.ultimaMensagem}
                  </p>

                </div>

              </button>

            ))
          )}

        </div>

      </aside>

      {/* CHAT PRINCIPAL */}
      <main className="chat-main">

        {!clienteSelecionado ? (

          <div className="chat-vazio">

            <div className="chat-vazio-icon">
              💬
            </div>

            <h2>Selecione uma conversa</h2>

            <p>
              Escolha um cliente para começar o atendimento.
            </p>

          </div>

        ) : (

          <>

            {/* CABEÇALHO DO CHAT */}
            <header className="chat-main-header">

              <div className="chat-cliente">

                <div className="chat-avatar">
                  {clienteSelecionado.nome
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>

                  <strong>
                    {clienteSelecionado.nome}
                  </strong>

                  <span>
                    ● Online
                  </span>

                </div>

              </div>

              <div className="chat-pedido">
                Pedido {clienteSelecionado.pedido}
              </div>

            </header>

            {/* MENSAGENS */}
            <div className="chat-mensagens">

              {clienteSelecionado.mensagens.map(
                (msg, index) => (

                  <div
                    key={index}
                    className={
                      msg.tipo === "enviada"
                        ? "mensagem mensagem-enviada"
                        : "mensagem mensagem-recebida"
                    }
                  >

                    {msg.texto}

                    <small>
                      23:20
                    </small>

                  </div>

                )
              )}

            </div>

            {/* CAMPO DE ENVIO */}
            <div className="chat-footer">

              <input
                type="text"
                placeholder="Digite uma mensagem..."
                value={mensagem}
                onChange={(e) =>
                  setMensagem(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    enviarMensagem();
                  }
                }}
              />

              <button onClick={enviarMensagem}>
                ➤
              </button>

            </div>

          </>

        )}

      </main>

    </div>
  );
}


export default ChatAdmin;