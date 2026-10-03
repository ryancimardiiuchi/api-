import "./style.css";
import { useState, useEffect } from "react";
import api from "../../services/api";

function Admin() {
  const [isLoading, setIsLoading] = useState(false);

  const [pedidos, setPedidos] = useState([
    {
      id: 1042,
      cliente: "João Silva",
      telefone: "(11) 98765-4321",
      servicos: "Viagem pra desgraça",
      valor: 38,
      status: "recebido",
      horario: "Hoje, 08:15",
    },
    {
      id: 1045,
      cliente: "Ana Costa",
      telefone: "(11) 91234-5678",
      servicos: "Morar no caribe",
      valor: 22,
      status: "recebido",
      horario: "Hoje, 09:32",
    },
    {
      id: 1048,
      cliente: "Pedro Santos",
      telefone: "(11) 99876-5432",
      servicos: "Mudança de casa",
      valor: 46,
      status: "coleta",
      horario: "Hoje, 11:00",
    },
    {
      id: 1050,
      cliente: "Carla Souza",
      telefone: "(11) 98743-2109",
      servicos: "Passadoria",
      valor: 18,
      status: "coleta",
      horario: "Hoje, 13:30",
    },
    {
      id: 1039,
      cliente: "Maria Souza",
      telefone: "(11) 97654-3210",
      servicos: "Ir no mercado",
      valor: 52,
      status: "andamento",
      horario: "Hoje, 07:45",
    },
    {
      id: 1040,
      cliente: "Lucas Tavares",
      telefone: "(11) 93456-7890",
      servicos: "Jogar Truco",
      valor: 28,
      status: "andamento",
      horario: "Hoje, 10:20",
    },
    {
      id: 1037,
      cliente: "Rafael Castro",
      telefone: "(11) 96543-2109",
      servicos: "Ir pra Faculdade",
      valor: 64,
      status: "pronto",
      horario: "Hoje, 06:50",
    },
    {
      id: 1036,
      cliente: "Fernanda Lima",
      telefone: "(11) 91234-5678",
      servicos: "Jogar Truco",
      valor: 48,
      status: "entregue",
      horario: "Ontem, 17:30",
    },
  ]);
  const [servicos, setServicos] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [EditarAberto, setEditarAberto] = useState(false);
  const [novoServico, setNovoServico] = useState({
    nome: "",
    preco: "",
    descricao: "",
  });
  const [chatAberto, setChatAberto] = useState(null);

  function avancarPedido(id) {
    setPedidos((pedidosAtuais) =>
      pedidosAtuais.map((pedido) => {
        if (pedido.id !== id) {
          return pedido;
        }

        if (pedido.status === "recebido") {
          return {
            ...pedido,
            status: "coleta",
          };
        }

        if (pedido.status === "coleta") {
          return {
            ...pedido,
            status: "andamento",
          };
        }

        if (pedido.status === "andamento") {
          return {
            ...pedido,
            status: "pronto",
          };
        }

        if (pedido.status === "pronto") {
          return {
            ...pedido,
            status: "entregue",
          };
        }

        return pedido;
      }),
    );
  }

  function textoBotao(pedido) {
    if (pedido.status === "recebido") {
      return "Iniciar →";
    }

    if (pedido.status === "coleta") {
      return "Iniciar lavagem →";
    }

    if (pedido.status === "andamento") {
      return "Finalizar →";
    }

    if (pedido.status === "pronto") {
      return "Entregar →";
    }

    return "Ver detalhes";
  }

  async function cadastrarServico(event) {
    event.preventDefault();

    setIsLoading(true);

    if (!novoServico.nome || !novoServico.preco || !novoServico.descricao) {
      alert("Preencha todos os campos do serviço antes de cadastrar.");
      return;
    }

    try {
      const resposta = await api.post("/servicos", {
        nome: novoServico.nome,
        descricao: novoServico.descricao,
        preco: Number(novoServico.preco),
      });

      alert("Serviço cadastrado com sucesso!");

      setIsLoading(false);

      setServicos((servicosAtuais) => [...servicosAtuais, resposta.data]);

      setNovoServico({
        nome: "",
        preco: "",
        descricao: "",
      });

      setModalAberto(false);
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao cadastrar serviço.");
    }
  }

  async function excluirServico(id) {
    try {
      await api.delete(`/servicos/${id}`);

      setServicos((servicosAtuais) =>
        servicosAtuais.filter((servico) => servico.id !== id),
      );

      alert("Serviço excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir serviço:", error);
    }
  }
  async function editarServico(event) {
    event.preventDefault();

    setIsLoading(true);

    try {
      const resposta = await api.put(`/servicos/${novoServico.id}`, {
        nome: novoServico.nome,
        descricao: novoServico.descricao,
        preco: Number(novoServico.preco),
      });

      alert("Serviço atualizado com sucesso!");
      setServicos((servicosAtuais) =>
        servicosAtuais.map((servico) =>
          servico.id === novoServico.id ? resposta.data : servico,
        ),
      );

      setNovoServico({
        nome: "",
        preco: "",
        descricao: "",
      });

      setEditarAberto(false);
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao editar serviço.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function puxarPedidos() {
      try {
        const resposta = await api.get("/servicos");

        setServicos(resposta.data);
      } catch (error) {
        console.log("Erro ao buscar serviços:", error);
      }
    }

    puxarPedidos();
  }, []);

  async function gerarDescricaoIA() {
    setIsLoading(true);

    if (!novoServico.nome || !novoServico.preco) {
      setNovoServico({
        ...novoServico,
        descricao:
          "Digite primeiro o nome e o preço do serviço para gerar a descrição.",
      });

      return setIsLoading(false);
    }

    try {
      const resposta = await api.post("/ia/descricao", {
        nome: novoServico.nome,
        preco: novoServico.preco,
      });

      setNovoServico({
        ...novoServico,
        descricao: resposta.data.descricao,
      });

      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao gerar descrição:", error);

      setNovoServico({
        ...novoServico,
        descricao: "Não foi possível gerar a descrição.",
      });
    }
  }

  const pedidosRecebidos = pedidos.filter(
    (pedido) => pedido.status === "recebido",
  );

  const pedidosColeta = pedidos.filter((pedido) => pedido.status === "coleta");

  const pedidosAndamento = pedidos.filter(
    (pedido) => pedido.status === "andamento",
  );

  const pedidosProntos = pedidos.filter((pedido) => pedido.status === "pronto");

  const pedidosEntregues = pedidos.filter(
    (pedido) => pedido.status === "entregue",
  );

  function PedidoCard({ pedido }) {
    return (
      <div className="pedido-card">
        <div className="pedido-top">
          <strong>#{pedido.id}</strong>

          <span className="pedido-menu">⋮</span>
        </div>

        <small>{pedido.horario}</small>

        <div className="cliente">
          <div className="cliente-avatar">{pedido.cliente[0]}</div>

          <div>
            <strong>{pedido.cliente}</strong>

            <span>{pedido.telefone}</span>
          </div>
        </div>

        <div className="pedido-servicos">{pedido.servicos}</div>

        <strong className="pedido-valor">
          R$ {pedido.valor.toFixed(2).replace(".", ",")}
        </strong>

        <div className="pedido-acoes">
          <button className="btn-chat" onClick={() => setChatAberto(pedido)}>
            💬 Chat
          </button>

          {pedido.status !== "entregue" ? (
            <button
              className="btn-proximo"
              onClick={() => avancarPedido(pedido.id)}
            >
              {textoBotao(pedido)}
            </button>
          ) : (
            <button className="btn-detalhes">Ver detalhes</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">♧</div>

          <div>
            <strong>
              RN<span>+</span>
            </strong>

            <small>Teste ADMIN</small>
          </div>
        </div>

        <nav>
          <button className="menu-item active">📊 Dashboard</button>

          <button className="menu-item">📦 Pedidos</button>

          <button className="menu-item">🧺 Serviços</button>

          <button className="menu-item">👥 Clientes</button>

          <button className="menu-item">
            💬 Mensagens
            <span className="notification">3</span>
          </button>

          <div className="menu-separator"></div>

          <button className="menu-item">📈 Relatórios</button>

          <button className="menu-item">⚙️ Configurações</button>
        </nav>

        <div className="sidebar-bottom">
          <div className="admin-user">
            <div className="admin-avatar">R</div>

            <div>
              <strong>Ryan Cimardi</strong>

              <span>Administrador</span>
            </div>
          </div>

          <button className="logout">⇥ Sair</button>
        </div>
      </aside>

      <main className="admin-content">
        <header className="topbar">
          <button className="mobile-menu">☰</button>

          <div className="search">
            🔎
            <input placeholder="Buscar por pedidos, clientes ou serviços..." />
          </div>

          <div className="topbar-right">
            <button className="notification-button">
              🔔
              <span>3</span>
            </button>

            <div className="profile">
              <div className="profile-avatar">R</div>

              <div>
                <strong>Ryan Cimardi</strong>

                <small>Administrador</small>
              </div>

              <span>⌄</span>
            </div>
          </div>
        </header>

        <section className="dashboard">
          <div className="welcome">
            <h1>Olá, Ryan! 👋</h1>

            <p>Aqui está o resumo do que está acontecendo na RN hoje.</p>
          </div>

          <div className="stats">
            <div className="stat-card blue">
              <div className="stat-icon">📦</div>

              <div>
                <span>Total de pedidos</span>

                <strong>28</strong>

                <small>↑ 12% em relação a ontem</small>
              </div>
            </div>

            <div className="stat-card purple">
              <div className="stat-icon">🕐</div>

              <div>
                <span>Em espera</span>

                <strong>
                  {pedidosRecebidos.length + pedidosColeta.length}
                </strong>

                <small>pedidos aguardando início</small>
              </div>
            </div>

            <div className="stat-card orange">
              <div className="stat-icon">🔄</div>

              <div>
                <span>Em andamento</span>

                <strong>{pedidosAndamento.length}</strong>

                <small>pedidos em processamento</small>
              </div>
            </div>

            <div className="stat-card green">
              <div className="stat-icon">✓</div>

              <div>
                <span>Concluídos hoje</span>

                <strong>{pedidosProntos.length}</strong>

                <small>pedidos finalizados</small>
              </div>
            </div>
          </div>

          <section className="pedidos-section">
            <div className="section-header">
              <div>
                <h2>📦 Pedidos</h2>

                <p>Acompanhe e gerencie o fluxo de cada pedido.</p>
              </div>

              <div className="pedido-filtros">
                <input placeholder="🔎  Buscar pedido, cliente ou número..." />

                <select>
                  <option>Todos</option>
                  <option>Em espera</option>
                  <option>Em andamento</option>
                  <option>Prontos</option>
                </select>
              </div>
            </div>

            <div className="kanban">
              <div className="kanban-column recebido">
                <div className="column-title">
                  <span>📦 Pedido recebido</span>

                  <strong>{pedidosRecebidos.length}</strong>
                </div>

                {pedidosRecebidos.map((pedido) => (
                  <PedidoCard key={pedido.id} pedido={pedido} />
                ))}
              </div>

              <div className="kanban-column coleta">
                <div className="column-title">
                  <span>🛍️ Coleta agendada</span>

                  <strong>{pedidosColeta.length}</strong>
                </div>

                {pedidosColeta.map((pedido) => (
                  <PedidoCard key={pedido.id} pedido={pedido} />
                ))}
              </div>

              <div className="kanban-column andamento">
                <div className="column-title">
                  <span>🔄 Em andamento</span>

                  <strong>{pedidosAndamento.length}</strong>
                </div>

                {pedidosAndamento.map((pedido) => (
                  <PedidoCard key={pedido.id} pedido={pedido} />
                ))}
              </div>

              <div className="kanban-column pronto">
                <div className="column-title">
                  <span>✓ Pronto para entrega</span>

                  <strong>{pedidosProntos.length}</strong>
                </div>

                {pedidosProntos.map((pedido) => (
                  <PedidoCard key={pedido.id} pedido={pedido} />
                ))}
              </div>

              <div className="kanban-column entregue">
                <div className="column-title">
                  <span>✓ Entregue</span>

                  <strong>{pedidosEntregues.length}</strong>
                </div>

                {pedidosEntregues.map((pedido) => (
                  <PedidoCard key={pedido.id} pedido={pedido} />
                ))}
              </div>
            </div>
          </section>

          <section className="bottom-grid">
            <div className="services-section">
              <div className="section-header">
                <div>
                  <h2>🧺 Serviços cadastrados</h2>

                  <p>Gerencie os serviços oferecidos pela Lavô+.</p>
                </div>

                <button
                  className="new-service"
                  onClick={() => setModalAberto(true)}
                >
                  + Novo serviço
                </button>
              </div>

              <div className="services-grid">
                {servicos.map((servico) => (
                  <div className="service-card" key={servico.id}>
                    <div className="service-image">🧺</div>

                    <h3>{servico.nome}</h3>

                    <p>{servico.descricao}</p>

                    <strong>
                      R$ {servico.preco.toFixed(2).replace(".", ",")}
                    </strong>

                    <div className="service-actions">
                      <button
                        className="edit"
                        onClick={() => {
                          setNovoServico({
                            id: servico.id,
                            nome: servico.nome,
                            preco: servico.preco,
                            descricao: servico.descricao,
                          });

                          setEditarAberto(true);
                        }}
                      >
                        ✎ Editar
                      </button>

                      <button
                        className="delete"
                        onClick={() => excluirServico(servico.id)}
                      >
                        🗑 Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="messages-section">
              <div className="section-header">
                <div>
                  <h2>💬 Mensagens recentes</h2>
                </div>

                <button>Ver todas</button>
              </div>

              <div className="messages">
                <div className="message">
                  <div className="message-avatar">J</div>

                  <div>
                    <strong>João Silva</strong>

                    <p>Olá, qual o prazo de entrega?</p>
                  </div>

                  <span>10:24</span>
                </div>

                <div className="message">
                  <div className="message-avatar">A</div>

                  <div>
                    <strong>Ana Costa</strong>

                    <p>Pode confirmar o endereço da coleta?</p>
                  </div>

                  <span>09:47</span>
                </div>

                <div className="message">
                  <div className="message-avatar">M</div>

                  <div>
                    <strong>Maria Souza</strong>

                    <p>Ok, obrigado!</p>
                  </div>

                  <span>08:32</span>
                </div>
              </div>

              <button
                className="open-chat"
                onClick={() =>
                  setChatAberto({
                    cliente: "João Silva",
                  })
                }
              >
                💬 Abrir chat
              </button>
            </div>
          </section>
        </section>
      </main>

      {/* MODAL NOVO SERVIÇO */}

      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>Novo serviço</h2>

                <p>Cadastre um novo serviço para seus clientes.</p>
              </div>

              <button onClick={() => setModalAberto(false)}>×</button>
            </div>

            <form onSubmit={cadastrarServico}>
              <label>Nome do serviço</label>

              <input
                value={novoServico.nome}
                onChange={(e) =>
                  setNovoServico({
                    ...novoServico,
                    nome: e.target.value,
                  })
                }
                placeholder="Ex: Comprar Claude Code e dar de presente para o Ryan"
              />

              <label>Preço</label>

              <input
                type="number"
                step="0.01"
                value={novoServico.preco}
                onChange={(e) =>
                  setNovoServico({
                    ...novoServico,
                    preco: e.target.value,
                  })
                }
                placeholder="15.00"
              />

              <div className="description-title">
                <label>Descrição</label>

                <button
                  type="button"
                  onClick={gerarDescricaoIA}
                  disabled={isLoading}
                >
                  {isLoading ? "✦Gerando..." : "✦ Gerar com IA"}
                </button>
              </div>

              <textarea
                value={novoServico.descricao}
                onChange={(e) =>
                  setNovoServico({
                    ...novoServico,
                    descricao: e.target.value,
                  })
                }
                placeholder="Digite a descrição ou gere com IA..."
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel"
                  onClick={() => setModalAberto(false)}
                >
                  Cancelar
                </button>

                <button type="submit" className="save" disabled={isLoading}>
                  {isLoading ? "Cadastrando..." : "Cadastrar Serviço"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {EditarAberto && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>Editar serviço</h2>

                <p>Atualize as informações do serviço.</p>
              </div>

              <button onClick={() => setEditarAberto(false)}>×</button>
            </div>

            <form onSubmit={editarServico}>
              <label>Nome do serviço</label>

              <input
                value={novoServico.nome}
                onChange={(e) =>
                  setNovoServico({
                    ...novoServico,
                    nome: e.target.value,
                  })
                }
                placeholder="Ex: Comprar Claude Code e dar de presente para o Ryan"
              />

              <label>Preço</label>

              <input
                type="number"
                step="0.01"
                value={novoServico.preco}
                onChange={(e) =>
                  setNovoServico({
                    ...novoServico,
                    preco: e.target.value,
                  })
                }
                placeholder="15.00"
              />

              <div className="description-title">
                <label>Descrição</label>

                <button
                  type="button"
                  onClick={gerarDescricaoIA}
                  disabled={isLoading}
                >
                  {isLoading ? "✦Gerando..." : "✦ Gerar com IA"}
                </button>
              </div>

              <textarea
                value={novoServico.descricao}
                onChange={(e) =>
                  setNovoServico({
                    ...novoServico,
                    descricao: e.target.value,
                  })
                }
                placeholder="Digite a descrição ou gere com IA..."
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel"
                  onClick={() => setEditarAberto(false)}
                >
                  Cancelar
                </button>

                <button type="submit" className="save" disabled={isLoading}>
                  {isLoading ? "Editando..." : "Editar Serviço"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHAT */}

      {chatAberto && (
        <div className="chat-window">
          <div className="chat-header">
            <div>
              💬
              <strong>{chatAberto.cliente}</strong>
            </div>

            <button onClick={() => setChatAberto(null)}>×</button>
          </div>

          <div className="chat-body">
            <div className="chat-message received">
              Olá, qual o prazo de entrega?
            </div>

            <div className="chat-message sent">
              Olá! Seu pedido está sendo processado.
            </div>

            <div className="chat-message received">Perfeito, obrigado!</div>
          </div>

          <div className="chat-input">
            <input placeholder="Digite uma mensagem..." />

            <button>➤</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
