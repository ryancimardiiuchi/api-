import "./style.css";

import { useState, useEffect, useRef } from "react";

import api from "../../services/api";

import { Link, useNavigate } from "react-router-dom";

import socket from "../../services/socket";
import config from "../../assets/icon/config.png";



function formatarTrecho(texto) {
  return texto.split(/(\*\*.*?\*\*)/g).map((trecho, index) => {
    if (trecho.startsWith("**") && trecho.endsWith("**")) {
      return <strong key={index}>{trecho.slice(2, -2)}</strong>;
    }

    return <span key={index}>{trecho}</span>;
  });
}

function renderizarTextoChatbot(texto) {
  const linhas = String(texto || "").split("\n");

  return linhas.map((linha, index) => {
    const conteudo = linha.trim();

    if (!conteudo) {
      return <div className="chatbot-line-space" key={index} />;
    }

    if (/^#{1,3}\s/.test(conteudo)) {
      return (
        <h4 className="chatbot-text-heading" key={index}>
          {formatarTrecho(conteudo.replace(/^#{1,3}\s+/, ""))}
        </h4>
      );
    }

    if (/^[-*•]\s+/.test(conteudo)) {
      return (
        <div className="chatbot-text-list-item" key={index}>
          <span className="chatbot-text-bullet">•</span>
          <span>{formatarTrecho(conteudo.replace(/^[-*•]\s+/, ""))}</span>
        </div>
      );
    }

    if (/^\d+[.)]\s+/.test(conteudo)) {
      const numero = conteudo.match(/^\d+[.)]/)[0];
      const item = conteudo.replace(/^\d+[.)]\s+/, "");

      return (
        <div className="chatbot-text-list-item" key={index}>
          <span>{numero}</span>
          <span>{formatarTrecho(item)}</span>
        </div>
      );
    }

    return (
      <p className="chatbot-text-paragraph" key={index}>
        {formatarTrecho(conteudo)}
      </p>
    );
  });
}

function Admin() {
  const navigate = useNavigate();
  const [conversaVozAtiva, setConversaVozAtiva] = useState(false);

const reconhecimentoRef = useRef(null);
const conversaVozAtivaRef = useRef(false);
const processandoVozRef = useRef(false);
const falandoRef = useRef(false);

  const [adminName] = useState(() => {
    try {
      const token = localStorage.getItem("token");

      return token
        ? JSON.parse(atob(token.split(".")[1])).name || "Administrador"
        : "Administrador";
    } catch {
      return "Administrador";
    }
  });

  const [secaoAtiva, setSecaoAtiva] = useState("dashboard");

  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  const [busca, setBusca] = useState("");

  const [buscaPedidos, setBuscaPedidos] = useState("");

  const [filtroStatus, setFiltroStatus] = useState("Todos");

  const [clientes, setClientes] = useState([]);

  const [erroClientes, setErroClientes] = useState("");

  const [notificacoes, setNotificacoes] = useState([]);

  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);

  const [mensagemChatbot, setMensagemChatbot] = useState("");

  const [mensagensChatbot, setMensagensChatbot] = useState([
    {
      tipo: "bot",

      texto: "Olá! Sou o assistente virtual da Lavô+. Como posso ajudar?",

      hora: "Agora",
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const [pedidos, setPedidos] = useState([]);

  const [servicos, setServicos] = useState([]);

  const [modalAberto, setModalAberto] = useState(false);

  const [EditarAberto, setEditarAberto] = useState(false);

  const [novoServico, setNovoServico] = useState({
    nome: "",

    preco: "",

    descricao: "",
  });

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

      console.log(erro);
    }
  }, []);

  useEffect(() => {
    let ativo = true;

    async function puxarClientes() {
      try {
        const resposta = await api.get("/usuarios");

        if (ativo) {
          setClientes(
            resposta.data.filter((usuario) => usuario.role === "cliente"),
          );
        }
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);

        if (ativo) {
          setErroClientes(
            error.response?.data?.message ||
              "Não foi possível carregar os clientes.",
          );
        }
      }
    }

    puxarClientes();

    return () => {
      ativo = false;
    };
  }, []);

  async function avancarPedido(id) {
    const pedido = pedidos.find((pedido) => pedido.id === id);

    if (!pedido) {
      return;
    }

    let novoStatus;

    if (pedido.status === "coleta agendada") {
      novoStatus = "Em andamento";
    } else if (pedido.status === "Em andamento") {
      novoStatus = "Pronto para Entrega";
    } else if (pedido.status === "Pronto para Entrega") {
      novoStatus = "Entregue";
    } else {
      return;
    }

    const atualizado = await AtualizarPedido(id, novoStatus);

    if (!atualizado) return;

    setPedidos((pedidosAtuais) =>
      pedidosAtuais.map((pedido) => {
        if (pedido.id !== id) {
          return pedido;
        }

        return {
          ...pedido,

          status: novoStatus,
          entregueEm:
            novoStatus === "Entregue" ? new Date().toISOString() : null,
        };
      }),
    );
  }

  async function AtualizarPedido(id, novoStatus) {
    try {
      await api.put(`/pedidos/${id}`, {
        status: novoStatus,
      });

      return true;
    } catch (erro) {
      console.error(erro);

      alert("Erro ao atualizar pedido");

      return false;
    }
  }

  function textoBotao(pedido) {
    if (pedido.status === "coleta agendada") {
      return "Iniciar lavagem →";
    }

    if (pedido.status === "Em andamento") {
      return "Finalizar →";
    }

    if (pedido.status === "Pronto para Entrega") {
      return "Entregar →";
    }

    return "Ver detalhes";
  }

  async function cadastrarServico(event) {
    event.preventDefault();

    if (!novoServico.nome || !novoServico.preco || !novoServico.descricao) {
      alert("Preencha todos os campos do serviço antes de cadastrar.");

      return;
    }

    setIsLoading(true);

    try {
      const resposta = await api.post("/servicos", {
        nome: novoServico.nome,

        descricao: novoServico.descricao,

        preco: Number(novoServico.preco),
      });

      alert("Serviço cadastrado com sucesso!");

      setServicos((servicosAtuais) => [...servicosAtuais, resposta.data]);

      setNovoServico({
        nome: "",

        preco: "",

        descricao: "",
      });

      setModalAberto(false);
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao cadastrar serviço.");
    } finally {
      setIsLoading(false);
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

      alert("Erro ao excluir serviço.");
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
    async function puxarServicos() {
      try {
        const resposta = await api.get("/servicos");

        setServicos(resposta.data);
      } catch (error) {
        console.log("Erro ao buscar serviços:", error);
      }
    }

    puxarServicos();
  }, []);

  async function gerarDescricaoIA() {
    if (!novoServico.nome || !novoServico.preco) {
      setNovoServico({
        ...novoServico,

        descricao:
          "Digite primeiro o nome e o preço do serviço para gerar a descrição.",
      });

      return;
    }

    setIsLoading(true);

    try {
      const resposta = await api.post("/ia/descricao", {
        nome: novoServico.nome,

        preco: novoServico.preco,
      });

      setNovoServico({
        ...novoServico,

        descricao: resposta.data.descricao,
      });
    } catch (error) {
      console.error("Erro ao gerar descrição:", error);

      setNovoServico({
        ...novoServico,

        descricao: "Não foi possível gerar a descrição.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function puxarPedidos() {
      try {
        const resposta = await api.get("/pedidos");

        const pedidosFormatados = resposta.data.map((pedido) => {
          if (pedido.cliente) {
            return {
              id: pedido.id,

              UserId: pedido.UserId,

              cliente: pedido.cliente,

              telefone: pedido.telefone || "",

              servicos: pedido.servicos || "Nenhum serviço",

              valor: Number(pedido.valor || 0),

              status: pedido.status || "coleta agendada",

              entregueEm: pedido.entregueEm || null,

              horario: pedido.horario || "",
            };
          }

          const servicosDoPedido =
            pedido.itensPedido

              ?.map((item) => {
                if (item.servico?.nome) {
                  return `${item.servico.nome} (${item.quantidade})`;
                }

                return null;
              })

              .filter(Boolean)

              .join(", ") || "Nenhum serviço";

          return {
            id: pedido.id,

            UserId: pedido.UserId,

            cliente: pedido.user?.name || "Cliente",

            telefone: pedido.user?.telefone || "",

            servicos: servicosDoPedido,

            valor: Number(pedido.valor || 0),

            status: pedido.status || "coleta agendada",

            entregueEm: pedido.entregueEm || null,

            horario: pedido.dataColeta
              ? `${new Date(pedido.dataColeta).toLocaleDateString("pt-BR", { timeZone: "UTC" })} ${pedido.horarioColeta || ""}`
              : pedido.dataPedido
                ? new Date(pedido.dataPedido).toLocaleString("pt-BR")
                : "",
          };
        });

        setPedidos(pedidosFormatados);
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
      }
    }

    puxarPedidos();
  }, []);

  const pedidosColeta = pedidos.filter(
    (pedido) => pedido.status === "coleta agendada",
  );

  const pedidosAndamento = pedidos.filter(
    (pedido) => pedido.status === "Em andamento",
  );

  const pedidosProntos = pedidos.filter(
    (pedido) => pedido.status === "Pronto para Entrega",
  );

  const termoBusca = busca.trim().toLocaleLowerCase("pt-BR");

  const termoBuscaPedido = buscaPedidos.trim().toLocaleLowerCase("pt-BR");

  const hojeSaoPaulo = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const pedidosDoDia = pedidos.filter(
    (pedido) =>
      pedido.status !== "Entregue" ||
      (pedido.entregueEm &&
        new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/Sao_Paulo",
        }).format(new Date(pedido.entregueEm)) === hojeSaoPaulo),
  );

  const pedidosFiltrados = pedidosDoDia.filter((pedido) => {
    const correspondeBuscaGlobal =
      !termoBusca ||
      `${pedido.id} ${pedido.cliente} ${pedido.telefone} ${pedido.servicos} ${pedido.status}`

        .toLocaleLowerCase("pt-BR")

        .includes(termoBusca);

    const correspondeBuscaPedido =
      !termoBuscaPedido ||
      `${pedido.id} ${pedido.cliente} ${pedido.telefone} ${pedido.servicos}`

        .toLocaleLowerCase("pt-BR")

        .includes(termoBuscaPedido);

    const correspondeStatus =
      filtroStatus === "Todos" ||
      (filtroStatus === "Em espera" && pedido.status === "coleta agendada") ||
      (filtroStatus === "Em andamento" && pedido.status === "Em andamento") ||
      (filtroStatus === "Prontos" && pedido.status === "Pronto para Entrega") ||
      (filtroStatus === "Entregues" && pedido.status === "Entregue");

    return (
      correspondeBuscaGlobal && correspondeBuscaPedido && correspondeStatus
    );
  });

  const filtrarPedidosPorStatus = (status) =>
    pedidosFiltrados.filter((pedido) => pedido.status === status);

  const servicosFiltrados = servicos.filter((servico) =>
    `${servico.nome} ${servico.descricao}`

      .toLocaleLowerCase("pt-BR")

      .includes(termoBusca),
  );

  const clientesFiltrados = clientes.filter((cliente) =>
    `${cliente.name} ${cliente.email} ${cliente.telefone}`

      .toLocaleLowerCase("pt-BR")

      .includes(termoBusca),
  );

  useEffect(() => {
    if (!pedidos.length) return undefined;

    function receberMensagem(dados) {
      if (!dados?.clienteId || dados.remetente === "admin") return;

      const pedidoDoCliente = pedidos.find(
        (pedido) => pedido.UserId === dados.clienteId,
      );

      setNotificacoes((atuais) =>
        [
          {
            id: dados.id || `${dados.clienteId}-${Date.now()}`,

            clienteId: dados.clienteId,

            cliente: pedidoDoCliente?.cliente || "Cliente",

            texto: dados.texto,

            hora: new Date(dados.createdAt || Date.now()).toLocaleTimeString(
              "pt-BR",

              { hour: "2-digit", minute: "2-digit" },
            ),
          },

          ...atuais,
        ].slice(0, 8),
      );
    }

    function entrarNasSalas() {
      const clientesComPedido = [
        ...new Set(pedidos.map((pedido) => pedido.UserId).filter(Boolean)),
      ];

      clientesComPedido.forEach((clienteId) =>
        socket.emit("entrar_sala", clienteId),
      );
    }

    socket.on("connect", entrarNasSalas);

    socket.on("receber_mensagem", receberMensagem);

    if (socket.connected) entrarNasSalas();
    else socket.connect();

    return () => {
      socket.off("connect", entrarNasSalas);

      socket.off("receber_mensagem", receberMensagem);

      socket.disconnect();
    };
  }, [pedidos]);

  function abrirNotificacao(notificacao) {
    setNotificacoesAbertas(false);

    setNotificacoes((atuais) =>
      atuais.filter((item) => item.id !== notificacao.id),
    );

    navigate("/chatadmin", {
      state: { clienteId: notificacao.clienteId },
    });
  }
  function falarResposta(texto) {
    if (!("speechSynthesis" in window)) {
      if (conversaVozAtivaRef.current) {
        iniciarEscutaVoz();
      }
      return;
    }

    window.speechSynthesis.cancel();

    const fala = new SpeechSynthesisUtterance(String(texto || ""));
    fala.lang = "pt-BR";
    fala.rate = 1;
    fala.pitch = 1;

    fala.onstart = () => {
      falandoRef.current = true;
    };

    fala.onend = () => {
      falandoRef.current = false;

      if (conversaVozAtivaRef.current) {
        iniciarEscutaVoz();
      }
    };

    fala.onerror = () => {
      falandoRef.current = false;

      if (conversaVozAtivaRef.current) {
        iniciarEscutaVoz();
      }
    };

    window.speechSynthesis.speak(fala);
  }

  function iniciarEscutaVoz() {
    const reconhecimento = reconhecimentoRef.current;

    if (
      !reconhecimento ||
      !conversaVozAtivaRef.current ||
      processandoVozRef.current ||
      falandoRef.current
    ) {
      return;
    }

    try {
      reconhecimento.start();
    } catch (erro) {
      // O navegador pode já estar iniciando o reconhecimento.
      console.debug("Reconhecimento de voz:", erro.message);
    }
  }

  function encerrarConversaVoz() {
    conversaVozAtivaRef.current = false;
    processandoVozRef.current = false;
    falandoRef.current = false;

    setConversaVozAtiva(false);

    if (reconhecimentoRef.current) {
      reconhecimentoRef.current.onend = null;

      try {
        reconhecimentoRef.current.stop();
      } catch {
        // O reconhecimento pode já estar parado.
      }

      reconhecimentoRef.current = null;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  async function processarMensagemVoz(texto) {
    const mensagem = texto.trim();

    if (!mensagem || processandoVozRef.current) {
      return;
    }

    processandoVozRef.current = true;

    const hora = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setMensagensChatbot((atuais) => [
      ...atuais,
      {
        tipo: "admin",
        texto: mensagem,
        hora,
      },
    ]);

    setIsLoading(true);

    try {
      const resposta = await api.post("/ia/chatbot", {
        mensagem,
      });

      const textoResposta =
        resposta.data?.resposta ||
        "Não consegui gerar uma resposta. Poderia tentar novamente?";

      setMensagensChatbot((atuais) => [
        ...atuais,
        {
          tipo: "bot",
          texto: textoResposta,
          hora: new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);

      processandoVozRef.current = false;
      falarResposta(textoResposta);
    } catch (error) {
      console.error("Erro ao conversar por voz:", error);

      const mensagemErro =
        error.response?.data?.message ||
        "Não foi possível obter uma resposta. Tente novamente.";

      setMensagensChatbot((atuais) => [
        ...atuais,
        {
          tipo: "bot",
          texto: mensagemErro,
          hora: new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);

      processandoVozRef.current = false;
      falarResposta(mensagemErro);
    } finally {
      setIsLoading(false);
    }
  }

  function mandarAudio() {
    if (conversaVozAtivaRef.current) {
      encerrarConversaVoz();
      return;
    }

    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!Recognition) {
      setMensagensChatbot((atuais) => [
        ...atuais,
        {
          tipo: "bot",
          texto:
            "Seu navegador não suporta reconhecimento de voz. Tente usar o Google Chrome.",
          hora: new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);

      return;
    }

    if (!("speechSynthesis" in window)) {
      setMensagensChatbot((atuais) => [
        ...atuais,
        {
          tipo: "bot",
          texto:
            "Seu navegador não suporta respostas por voz. Você ainda pode conversar por texto.",
          hora: new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);

      return;
    }

    const reconhecimento = new Recognition();

    reconhecimento.lang = "pt-BR";
    reconhecimento.continuous = true;
    reconhecimento.interimResults = false;
    reconhecimento.maxAlternatives = 1;

    reconhecimentoRef.current = reconhecimento;
    conversaVozAtivaRef.current = true;
    processandoVozRef.current = false;

    setConversaVozAtiva(true);

    reconhecimento.onresult = (event) => {
      const resultado = event.results[event.results.length - 1];
      const texto = resultado?.[0]?.transcript?.trim();

      if (!texto) {
        processandoVozRef.current = true;
        falarResposta("Não entendi, poderia repetir?");

        // A função de fala retoma a escuta ao terminar.
        return;
      }

      processarMensagemVoz(texto);
    };

    reconhecimento.onerror = (event) => {
      if (!conversaVozAtivaRef.current) {
        return;
      }

      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        setMensagensChatbot((atuais) => [
          ...atuais,
          {
            tipo: "bot",
            texto:
              "O acesso ao microfone foi bloqueado. Permita o uso do microfone nas configurações do navegador e tente novamente.",
            hora: new Date().toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);

        encerrarConversaVoz();
      } else if (event.error === "audio-capture") {
        setMensagensChatbot((atuais) => [
          ...atuais,
          {
            tipo: "bot",
            texto:
              "Não consegui acessar o microfone. Verifique se ele está conectado e tente novamente.",
            hora: new Date().toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);

        encerrarConversaVoz();
      }
    };

    reconhecimento.onend = () => {
      if (
        conversaVozAtivaRef.current &&
        !processandoVozRef.current &&
        !falandoRef.current
      ) {
        iniciarEscutaVoz();
      }
    };

    iniciarEscutaVoz();
  }

  async function enviarMensagemChatbot(event) {
    event.preventDefault();

    const texto = mensagemChatbot.trim();

    if (!texto || isLoading) return;

    const hora = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",

      minute: "2-digit",
    });

    setMensagensChatbot((atuais) => [
      ...atuais,

      { tipo: "admin", texto, hora },
    ]);

    setMensagemChatbot("");

    setIsLoading(true);

    try {
      const resposta = await api.post("/ia/chatbot", {
        mensagem: texto,
      });

      setMensagensChatbot((atuais) => [
        ...atuais,

        {
          tipo: "bot",

          texto: resposta.data.resposta,

          hora: new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",

            minute: "2-digit",
          }),
        },
      ]);
    } catch (error) {
      console.error("Erro ao conversar com o chatbot:", error);

      const mensagemErro =
        error.response?.data?.message ||
        "Não foi possível obter uma resposta. Tente novamente.";

      setMensagensChatbot((atuais) => [
        ...atuais,

        {
          tipo: "bot",

          texto: mensagemErro,

          hora: new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",

            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  const itensMenu = [
    { id: "dashboard", label: "📊 Dashboard" },

    { id: "pedidos", label: "📦 Pedidos" },

    { id: "servicos", label: "🧺 Serviços" },

    { id: "clientes", label: "👥 Clientes" },

    { id: "chatbot", label: "🤖 Chatbot" },
  ];

  function PedidoCard({ pedido }) {
    return (
      <div className="pedido-card">
        <div className="pedido-top">
          <strong>#{pedido.id}</strong>

          <span className="pedido-menu">⋮</span>
        </div>

        <small>{pedido.horario}</small>

        <div className="cliente">
          <div className="cliente-avatar">{pedido.cliente?.[0] || "?"}</div>

          <div>
            <strong>{pedido.cliente}</strong>

            <span>{pedido.telefone}</span>
          </div>
        </div>

        <div className="pedido-servicos">{pedido.servicos}</div>

        <strong className="pedido-valor">
          R${" "}
          {Number(pedido.valor || 0)
            .toFixed(2)

            .replace(".", ",")}
        </strong>

        <div className="pedido-acoes">
          <button
            className="btn-chat"
            onClick={() =>
              navigate("/chatadmin", { state: { clienteId: pedido.UserId } })
            }
            disabled={!pedido.UserId}
          >
            💬 Chat
          </button>

          {pedido.status !== "Entregue" ? (
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

  function sair() {
    localStorage.removeItem("token");

    window.location.href = "/";
  }

  function selecionarSecao(secao) {
    setSecaoAtiva(secao);

    setMenuMobileAberto(false);

    setBusca("");

    setBuscaPedidos("");

    setFiltroStatus("Todos");
  }

  return (
    <div className="admin-page">
      {menuMobileAberto && (
        <button
          className="sidebar-backdrop"
          aria-label="Fechar menu"
          onClick={() => setMenuMobileAberto(false)}
        />
      )}

      <aside className={`sidebar${menuMobileAberto ? " sidebar-open" : ""}`}>
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
          {itensMenu.map((item) => (
            <button
              key={item.id}
              className={`menu-item${secaoAtiva === item.id ? " active" : ""}`}
              onClick={() => selecionarSecao(item.id)}
            >
              {item.label}
            </button>
          ))}

          <Link
            to="/chatadmin"
            className="menu-item"
            onClick={() => setMenuMobileAberto(false)}
          >
            💬 Mensagens
            {notificacoes.length > 0 && (
              <span className="notification">{notificacoes.length}</span>
            )}
          </Link>

          <div className="menu-separator"></div>

          <Link
            to="/relatorios"
            className="menu-item"
            onClick={() => setMenuMobileAberto(false)}
          >
            📈 Relatórios
          </Link>

          <Link
            to="/configuracoes"
            className="menu-item"
            onClick={() => setMenuMobileAberto(false)}
          >
            <img src={config} id="icon" /> Configurações
          </Link>
        </nav>

        <div className="sidebar-bottom">
          <div className="admin-user">
            <div className="admin-avatar">
              {adminName.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{adminName}</strong>

              <span>Administrador</span>
            </div>
          </div>

          <button className="logout" onClick={sair}>
            ⇥ Sair
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <header className="topbar">
          <button
            className="mobile-menu"
            aria-label={menuMobileAberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuMobileAberto}
            onClick={() => setMenuMobileAberto((aberto) => !aberto)}
          >
            {menuMobileAberto ? "×" : "☰"}
          </button>

          <div className="search">
            🔎
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por pedidos, clientes ou serviços..."
              aria-label="Buscar pedidos, clientes e serviços"
            />
          </div>

          <div className="topbar-right">
            <button
              className="notification-button"
              aria-label={`${notificacoes.length} notificações de mensagens`}
              aria-expanded={notificacoesAbertas}
              onClick={() => setNotificacoesAbertas((abertas) => !abertas)}
            >
              🔔
              {notificacoes.length > 0 && <span>{notificacoes.length}</span>}
            </button>

            {notificacoesAbertas && (
              <div className="notification-popover">
                <strong>Mensagens recentes</strong>

                {notificacoes.length === 0 ? (
                  <p>Nenhuma mensagem nova.</p>
                ) : (
                  notificacoes.map((notificacao) => (
                    <button
                      key={notificacao.id}
                      onClick={() => abrirNotificacao(notificacao)}
                    >
                      <span>
                        {notificacao.cliente} · {notificacao.hora}
                      </span>

                      <small>{notificacao.texto}</small>
                    </button>
                  ))
                )}
              </div>
            )}

            <div className="profile">
              <div className="profile-avatar">
                {adminName.charAt(0).toUpperCase()}
              </div>

              <div>
                <strong>{adminName}</strong>

                <small>Administrador</small>
              </div>
            </div>
          </div>
        </header>

        <section className="dashboard">
          <div className="welcome">
            <h1>
              {secaoAtiva === "dashboard" && `Olá, ${adminName}! 👋`}

              {secaoAtiva === "pedidos" && "Pedidos"}

              {secaoAtiva === "servicos" && "Serviços"}

              {secaoAtiva === "clientes" && "Clientes"}

              {secaoAtiva === "chatbot" && "Chatbot"}
            </h1>

            <p>
              {secaoAtiva === "dashboard"
                ? "Aqui está o resumo do que está acontecendo na RN hoje."
                : secaoAtiva === "chatbot"
                  ? "Acompanhe o assistente virtual e sua integração com IA."
                  : "Consulte e gerencie as informações da Lavô+."}
            </p>
          </div>

          {secaoAtiva === "dashboard" && (
            <div className="stats">
              <div className="stat-card blue">
                <div className="stat-icon">📦</div>

                <div>
                  <span>Total de pedidos</span>

                  <strong>{pedidos.length}</strong>

                  <small>pedidos cadastrados</small>
                </div>
              </div>

              <div className="stat-card purple">
                <div className="stat-icon">🕐</div>

                <div>
                  <span>Em espera</span>

                  <strong>{pedidosColeta.length}</strong>

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
          )}

          {(secaoAtiva === "dashboard" || secaoAtiva === "pedidos") && (
            <section className="pedidos-section">
              <div className="section-header">
                <div>
                  <h2>📦 Pedidos</h2>

                  <p>Acompanhe e gerencie o fluxo de cada pedido.</p>
                </div>

                <div className="pedido-filtros">
                  <input
                    value={buscaPedidos}
                    onChange={(event) => setBuscaPedidos(event.target.value)}
                    placeholder="🔎  Buscar pedido, cliente ou número..."
                    aria-label="Buscar pedido"
                  />

                  <select
                    value={filtroStatus}
                    onChange={(event) => setFiltroStatus(event.target.value)}
                    aria-label="Filtrar pedidos por status"
                  >
                    <option>Todos</option>

                    <option>Em espera</option>

                    <option>Em andamento</option>

                    <option>Prontos</option>

                    <option>Entregues</option>
                  </select>
                </div>
              </div>

              <div className="kanban">
                <div className="kanban-column coleta">
                  <div className="column-title">
                    <span>🛍️ Coleta agendada</span>

                    <strong>
                      {filtrarPedidosPorStatus("coleta agendada").length}
                    </strong>
                  </div>

                  {filtrarPedidosPorStatus("coleta agendada").map((pedido) => (
                    <PedidoCard key={pedido.id} pedido={pedido} />
                  ))}

                  {filtrarPedidosPorStatus("coleta agendada").length === 0 && (
                    <p className="lista-vazia">Nenhum pedido nesta etapa.</p>
                  )}
                </div>

                <div className="kanban-column andamento">
                  <div className="column-title">
                    <span>🔄 Em andamento</span>

                    <strong>
                      {filtrarPedidosPorStatus("Em andamento").length}
                    </strong>
                  </div>

                  {filtrarPedidosPorStatus("Em andamento").map((pedido) => (
                    <PedidoCard key={pedido.id} pedido={pedido} />
                  ))}

                  {filtrarPedidosPorStatus("Em andamento").length === 0 && (
                    <p className="lista-vazia">Nenhum pedido nesta etapa.</p>
                  )}
                </div>

                <div className="kanban-column pronto">
                  <div className="column-title">
                    <span>✓ Pronto para entrega</span>

                    <strong>
                      {filtrarPedidosPorStatus("Pronto para Entrega").length}
                    </strong>
                  </div>

                  {filtrarPedidosPorStatus("Pronto para Entrega").map(
                    (pedido) => (
                      <PedidoCard key={pedido.id} pedido={pedido} />
                    ),
                  )}

                  {filtrarPedidosPorStatus("Pronto para Entrega").length ===
                    0 && (
                    <p className="lista-vazia">Nenhum pedido nesta etapa.</p>
                  )}
                </div>

                <div className="kanban-column entregue">
                  <div className="column-title">
                    <span>✓ Entregue</span>

                    <strong>
                      {filtrarPedidosPorStatus("Entregue").length}
                    </strong>
                  </div>

                  {filtrarPedidosPorStatus("Entregue").map((pedido) => (
                    <PedidoCard key={pedido.id} pedido={pedido} />
                  ))}

                  {filtrarPedidosPorStatus("Entregue").length === 0 && (
                    <p className="lista-vazia">Nenhum pedido nesta etapa.</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {(secaoAtiva === "dashboard" || secaoAtiva === "servicos") && (
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
                  {servicosFiltrados.map((servico) => (
                    <div className="service-card" key={servico.id}>
                      <div className="service-image">🧺</div>

                      <h3>{servico.nome}</h3>

                      <p>{servico.descricao}</p>

                      <strong>
                        R${" "}
                        {Number(servico.preco || 0)
                          .toFixed(2)

                          .replace(".", ",")}
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

                  {servicosFiltrados.length === 0 && (
                    <p className="lista-vazia">
                      {termoBusca
                        ? "Nenhum serviço corresponde à busca."
                        : "Nenhum serviço cadastrado."}
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {secaoAtiva === "clientes" && (
            <section className="clients-section">
              <div className="section-header">
                <div>
                  <h2>👥 Clientes cadastrados</h2>

                  <p>Dados reais das contas registradas na plataforma.</p>
                </div>

                <span className="clients-count">
                  {clientesFiltrados.length} clientes
                </span>
              </div>

              {erroClientes ? (
                <p className="lista-vazia" role="alert">
                  {erroClientes}
                </p>
              ) : clientesFiltrados.length === 0 ? (
                <p className="lista-vazia">
                  {termoBusca
                    ? "Nenhum cliente corresponde à busca."
                    : "Nenhum cliente cadastrado."}
                </p>
              ) : (
                <div className="clients-table-wrap">
                  <table className="clients-table">
                    <thead>
                      <tr>
                        <th>Cliente</th>

                        <th>E-mail</th>

                        <th>Telefone</th>

                        <th>Conta</th>
                      </tr>
                    </thead>

                    <tbody>
                      {clientesFiltrados.map((cliente) => (
                        <tr key={cliente.id}>
                          <td>
                            <span className="client-name">
                              <span className="client-table-avatar">
                                {cliente.name?.charAt(0)?.toUpperCase() || "C"}
                              </span>

                              {cliente.name || "Cliente"}
                            </span>
                          </td>

                          <td>{cliente.email}</td>

                          <td>{cliente.telefone || "Não informado"}</td>

                          <td>
                            <span
                              className={`client-badge${cliente.emailVerificado ? " verified" : ""}`}
                            >
                              {cliente.emailVerificado
                                ? "Verificada"
                                : "Pendente"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {secaoAtiva === "chatbot" && (
            <section className="chatbot-admin">
              <div className="chatbot-panel">
                <header className="chatbot-panel-header">
                  <div className="chatbot-brand">
                    <span className="chatbot-brand-icon" aria-hidden="true">
                      ✦
                    </span>

                    <div>
                      <strong>Assistente Lavô+</strong>

                      <span>
                        <i /> Assistente com IA
                      </span>
                    </div>
                  </div>

                  <span className="chatbot-preview-badge">
                    Integração com IA
                  </span>
                </header>

                <div className="chatbot-messages" aria-live="polite">
                  {mensagensChatbot.map((item, index) => (
                    <div
                      className={`chatbot-message-row ${item.tipo}`}
                      key={`${item.hora}-${index}`}
                    >
                      {item.tipo === "bot" && (
                        <span
                          className="chatbot-message-avatar"
                          aria-hidden="true"
                        >
                          ✦
                        </span>
                      )}

                      <div className="chatbot-bubble">
                        <div className="chatbot-message-text">
                          {renderizarTextoChatbot(item.texto)}
                        </div>

                        <time>{item.hora}</time>
                      </div>
                    </div>
                  ))}
                </div>

                <form
                  className="chatbot-composer"
                  onSubmit={enviarMensagemChatbot}
                >
                  <input
                    aria-label="Mensagem para o chatbot"
                    value={mensagemChatbot}
                    onChange={(event) => setMensagemChatbot(event.target.value)}
                    placeholder="Escreva uma mensagem..."
                    maxLength={1000}
                  />
                  <button
                    type="button"
                    className={`chatbot-voice-button ${
                      conversaVozAtiva ? "active" : ""
                    }`}
                    onClick={mandarAudio}
                    aria-label={
                      conversaVozAtiva
                        ? "Encerrar conversa por voz"
                        : "Iniciar conversa por voz"
                    }
                    aria-pressed={conversaVozAtiva}
                    title={
                      conversaVozAtiva
                        ? "Encerrar conversa por voz"
                        : "Iniciar conversa por voz"
                    }
                  >
                    {conversaVozAtiva ? "⏹️" : "🎙️"}
                  </button>
                  <button
                    type="submit"
                    aria-label="Enviar mensagem"
                    disabled={!mensagemChatbot.trim() || isLoading}
                  >
                    ➤
                  </button>
                </form>

                <p className="chatbot-disclaimer">
                  O assistente está sendo integrado à IA e ao contexto
                  necessário para atender os clientes.
                </p>
              </div>

              <aside className="chatbot-info">
                <span className="chatbot-info-icon" aria-hidden="true">
                  🤖
                </span>

                <h2>Chatbot da Lavô+</h2>

                <p>
                  O chatbot utiliza IA para apoiar o atendimento. A integração
                  dos dados de serviços e pedidos está em andamento.
                </p>

                <div className="chatbot-capabilities">
                  <strong>Recursos do assistente</strong>

                  <span>💬 Atendimento automatizado</span>

                  <span>🧺 Informações sobre serviços</span>

                  <span>📦 Ajuda com pedidos</span>
                </div>
              </aside>
            </section>
          )}
        </section>
      </main>

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
                placeholder="Ex: Lavagem de roupas"
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
                  {isLoading ? "✦ Gerando..." : "✦ Gerar com IA"}
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
                placeholder="Ex: Lavagem de roupas"
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
                  {isLoading ? "✦ Gerando..." : "✦ Gerar com IA"}
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
    </div>
  );
}

export default Admin;
