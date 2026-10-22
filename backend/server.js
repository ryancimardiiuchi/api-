import express from "express";
import bcrypt from "bcrypt";
import cors from "cors";
import prisma from "./prisma.js";
import nodemailer from "nodemailer";
import "dotenv/config";
import jwt from "jsonwebtoken";
import { verificarToken, verificarAdmin } from "./authMiddleware.js";
import iaRoutes from "./iaRoutes.js";
import mercadoRoutes from "./pagamentoRoutes.js";
import enderecoRoutes from "./enderecoRoutes.js";
import pedidoRoutes from "./pedidoRoutes.js";
import { createServer } from "http";
import { Server } from "socket.io";
import financeiroRoutes from "./financeiroRoutes.js";
import { createHash, randomInt, randomUUID } from "node:crypto";
import redis from "./redis.js";
import { createRateLimiter } from "./rateLimiter.js";

const app = express();
const server = createServer(app);
const janelaRateLimit = 15 * 60 * 1000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  }),
);
app.use(express.json());
app.use(
  createRateLimiter(redis, {
    name: "api-global",
    limit: 50,
    windowMs: janelaRateLimit,
    accountField: "email",
  }),
);
app.use("/financeiro", financeiroRoutes);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    next(new Error("Autenticação necessária."));
    return;
  }

  try {
    socket.data.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error("Token inválido ou expirado."));
  }
});

io.on("connection", (socket) => {
  console.log("Usuário conectado:", socket.id);

  socket.on("entrar_sala", async (clienteId) => {
    try {
      const usuario = socket.data.usuario;
      const podeAcessar =
        usuario.role === "admin" || usuario.id === clienteId;
      if (!podeAcessar) return;

      const pedido = await prisma.pedido.findFirst({
        where: {
          UserId: clienteId,
          ...(usuario.role === "admin" ? {} : { status: { not: "Entregue" } }),
        },
        select: { id: true },
      });
      if (!pedido) return;

      socket.join(`cliente-${clienteId}`);
    } catch (erro) {
      console.error("Erro ao autorizar entrada na sala do chat:", erro);
    }
  });

  socket.on("mensagem", async (dados, confirmar) => {
    const responder = typeof confirmar === "function" ? confirmar : () => {};
    try {
      const usuario = socket.data.usuario;
      const clienteId =
        usuario.role === "admin" ? dados?.clienteId : usuario.id;
      const texto =
        typeof dados?.texto === "string" ? dados.texto.trim() : "";
      if (!clienteId || !texto || texto.length > 2000) {
        responder({ erro: "A mensagem está vazia ou excede 2000 caracteres." });
        return;
      }

      const pedido = await prisma.pedido.findFirst({
        where: { UserId: clienteId },
        select: { id: true },
      });
      if (!pedido) {
        responder({ erro: "É necessário ter um pedido para usar o chat." });
        return;
      }

      const novaMensagem = await prisma.mensagem.create({
        data: {
          clienteId: clienteId,
          texto: texto,
          remetente: usuario.role === "admin" ? "admin" : "cliente",
        },
      });

      const sala = `cliente-${clienteId}`;
      socket.to(sala).emit("receber_mensagem", {
        id: novaMensagem.id,
        clienteId: novaMensagem.clienteId,
        texto: novaMensagem.texto,
        remetente: novaMensagem.remetente,
        createdAt: novaMensagem.createdAt,
      });
      responder({ mensagem: novaMensagem });
    } catch (erro) {
      console.error("Erro ao salvar mensagem:", erro);
      responder({ erro: "Não foi possível enviar a mensagem." });
    }
  });

  socket.on("disconnect", () => {
    console.log("Usuário desconectado:", socket.id);
  });
});
app.use("/ia", iaRoutes);
app.use("/api", mercadoRoutes);
app.use("/api", enderecoRoutes);
app.use("/api", pedidoRoutes);
const verificarEmailLimiter = createRateLimiter(redis, {
  name: "verificar-email",
  limit: 5,
  windowMs: janelaRateLimit,
  accountField: "email",
});
const reenviarCodigoLimiter = createRateLimiter(redis, {
  name: "reenviar-codigo",
  limit: 5,
  windowMs: janelaRateLimit,
  accountField: "email",
});
const esqueceuSenhaLimiter = createRateLimiter(redis, {
  name: "esqueceusenha",
  limit: 5,
  windowMs: janelaRateLimit,
  accountField: "email",
});
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
function gerarCodigo() {
  return randomInt(100000, 1000000).toString();
}
async function enviarEmail(destinatario, codigo) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: destinatario,
    subject: "Teste de e-mail - API",
    text: `Seu código de verificação é: ${codigo}`,
  });
}
async function ReceberEmail(email, assunto, mensagem) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    replyTo: email,
    subject: `Contato Lavô+ - ${assunto}`,
    text: `Mensagem recebida pelo formulário de contato.E-mail do cliente: ${email}Assunto: ${assunto}Mensagem:${mensagem}`,
  });
}
async function EsqueceuSenha(email, codigo) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Teste Esqueceu Senha",
    text: `Para fazer uma nova senha adicione seu codigo na tela ${codigo}`,
  });
}
async function Agradecer(email) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Recebemos o seu contato",
    text: "Olá!Agradecemos pelo seu contato, Recebemos sua mensagem e nossa equipe irá analisá-la e responder o mais breve possível.Obrigado por entrar em contato conosco!Atenciosamente,Equipe RN",
  });
}
app.post("/contato", async (req, res) => {
  const { email, assunto, mensagem } = req.body;
  try {
    await ReceberEmail(email, assunto, mensagem);
    await Agradecer(email);
    return res.status(200).json({
      message: "E-mail enviado com sucesso",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "E-mail não enviado",
    });
  }
});
app.post("/esqueceusenha", esqueceuSenhaLimiter, async (req, res) => {
  const { email, codigo } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado.",
      });
    }
    if (codigo) {
      if (codigo !== user.codigoVerificacao) {
        return res.status(400).json({
          message: "Código inválido.",
        });
      }

      if (!user.codigoExpira || new Date() > user.codigoExpira) {
        return res.status(400).json({
          message: "Código expirado.",
        });
      }

      const resetTokenId = randomUUID();
      const chaveReset = `reset-senha:${resetTokenId}`;
      const resetRegistrado = await redis.set(chaveReset, user.id, {
        EX: 600,
        NX: true,
      });

      if (!resetRegistrado) {
        throw new Error("Não foi possível registrar o token de recuperação.");
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          codigoVerificacao: null,
          codigoExpira: null,
        },
      });

      const resetToken = jwt.sign(
        {
          id: user.id,
          tipo: "reset-senha",
          jti: resetTokenId,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "10m",
        },
      );

      return res.status(200).json({
        message: "Código confirmado.",
        resetToken: resetToken,
      });
    }

    const novoCodigo = gerarCodigo();

    const codigoExpira = new Date();

    codigoExpira.setMinutes(codigoExpira.getMinutes() + 10);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        codigoVerificacao: novoCodigo,
        codigoExpira: codigoExpira,
      },
    });

    await EsqueceuSenha(user.email, novoCodigo);

    return res.status(200).json({
      message: "Código para recuperação enviado para seu e-mail.",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Erro ao processar recuperação de senha.",
    });
  }
});
app.put("/novasenha", async (req, res) => {
  const { senha, resetToken } = req.body;

  if (!senha || !resetToken) {
    return res.status(400).json({
      message: "Senha e token são obrigatórios.",
    });
  }

  let payload;
  try {
    payload = jwt.verify(resetToken, process.env.JWT_SECRET);
  } catch (error) {
    console.error("Token de recuperação inválido:", error);
    return res.status(401).json({
      message: "Token inválido ou expirado.",
    });
  }

  if (
    payload.tipo !== "reset-senha" ||
    typeof payload.id !== "string" ||
    typeof payload.jti !== "string"
  ) {
    return res.status(401).json({
      message: "Token inválido para recuperação de senha.",
    });
  }

  try {
    const tokenConsumido = await redis.eval(
      `
        if redis.call("GET", KEYS[1]) == ARGV[1] then
          return redis.call("DEL", KEYS[1])
        end
        return 0
      `,
      {
        keys: [`reset-senha:${payload.jti}`],
        arguments: [payload.id],
      },
    );

    if (Number(tokenConsumido) !== 1) {
      return res.status(401).json({
        message: "Token inválido ou já utilizado.",
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    await prisma.user.update({
      where: {
        id: payload.id,
      },
      data: {
        senha: senhaHash,
      },
    });

    return res.status(200).json({
      message: "Senha alterada com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    return res.status(500).json({
      message: "Não foi possível alterar a senha.",
    });
  }
});

app.post("/usuarios", async (req, res) => {
  const codigo = gerarCodigo();
  const codigoExpira = new Date();

  codigoExpira.setMinutes(codigoExpira.getMinutes() + 10);
  try {
    const senhaHash = await bcrypt.hash(req.body.senha, 10);
    const user = await prisma.user.create({
      data: {
        email: req.body.email,
        name: req.body.name,
        telefone: req.body.telefone,
        senha: senhaHash,
        codigoVerificacao: codigo,
        codigoExpira: codigoExpira,
      },
      select: {
        id: true,
        email: true,
        name: true,
        telefone: true,
        emailVerificado: true,
      },
    });
    await enviarEmail(req.body.email, codigo);
    res.status(201).json(user);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Já existe uma conta com este e-mail.",
      });
    }

    res.status(500).json({
      message: "Erro ao cadastrar usuário.",
    });
  }
});
app.post("/verificar-email", verificarEmailLimiter, async (req, res) => {
  const { email, codigo } = req.body;

  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (!user) {
    return res.status(404).json({
      message: "Usuario não encontrado",
    });
  }
  if (codigo !== user.codigoVerificacao) {
    return res.status(400).json({
      message: "Codigo Invalido",
    });
  }
  if (!user.codigoExpira || new Date() > user.codigoExpira) {
    return res.status(400).json({
      message: "Codigo Expirado",
    });
  }
  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      emailVerificado: true,
      codigoVerificacao: null,
      codigoExpira: null,
    },
  });
  res.status(200).json({
    message: "Email Verificado",
  });
});
app.post("/reenviar-codigo", reenviarCodigoLimiter, async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado.",
      });
    }

    if (user.emailVerificado) {
      return res.status(400).json({
        message: "Este e-mail já está verificado.",
      });
    }

    const codigo = gerarCodigo();

    const codigoExpira = new Date();
    codigoExpira.setMinutes(codigoExpira.getMinutes() + 10);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        codigoVerificacao: codigo,
        codigoExpira: codigoExpira,
      },
    });

    await enviarEmail(user.email, codigo);

    return res.status(200).json({
      message: "Novo código enviado para seu e-mail.",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Erro ao reenviar código.",
    });
  }
});
const TEMPO_CONTADOR = 24 * 60 * 60;

function criarChave(valor) {
  return createHash("sha256").update(valor).digest("hex");
}

function tempoDeEspera(tentativas) {
  if (tentativas >= 8) return 60 * 60;
  if (tentativas === 7) return 30 * 60;
  if (tentativas === 6) return 20 * 60;
  if (tentativas === 5) return 15 * 60;
  return 0;
}

async function registrarFalha(chave) {
  const tentativas = await redis.incr(chave);

  if (tentativas === 1) {
    await redis.expire(chave, TEMPO_CONTADOR);
  }

  const espera = tempoDeEspera(tentativas);

  if (espera > 0) {
    await redis.set(`${chave}:bloqueio`, "1", {
      EX: espera,
    });
  }

  return espera;
}

async function consultarBloqueio(chave) {
  const restante = await redis.ttl(`${chave}:bloqueio`);
  return restante > 0 ? restante : 0;
}

app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (
      typeof email !== "string" ||
      typeof senha !== "string" ||
      !email.trim() ||
      !senha
    ) {
      return res.status(400).json({
        message: "E-mail e senha são obrigatórios.",
      });
    }

    const emailNormalizado = email.trim().toLowerCase();
    const ip = req.ip || req.socket.remoteAddress || "ip-desconhecido";

    const chaveIP = `login:ip:${criarChave(ip)}`;
    const chaveConta = `login:conta:${criarChave(emailNormalizado)}`;

    const [bloqueioIP, bloqueioConta] = await Promise.all([
      consultarBloqueio(chaveIP),
      consultarBloqueio(chaveConta),
    ]);

    const esperaRestante = Math.max(bloqueioIP, bloqueioConta);

    if (esperaRestante > 0) {
      res.set("Retry-After", String(esperaRestante));

      return res.status(429).json({
        message: "Muitas tentativas. Tente novamente mais tarde.",
        retryAfter: esperaRestante,
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: emailNormalizado,
      },
    });

    let senhaCorreta = false;

    if (user) {
      senhaCorreta = await bcrypt.compare(senha, user.senha);
    }

    if (!user || !senhaCorreta) {
      const esperas = await Promise.all([
        registrarFalha(chaveIP),
        registrarFalha(chaveConta),
      ]);

      const espera = Math.max(...esperas);

      if (espera > 0) {
        res.set("Retry-After", String(espera));

        return res.status(429).json({
          message: "Muitas tentativas. Tente novamente mais tarde.",
          retryAfter: espera,
        });
      }

      return res.status(401).json({
        message: "E-mail ou senha inválidos.",
      });
    }

    await redis.del(
      chaveConta,
      `${chaveConta}:bloqueio`,
      chaveIP,
      `${chaveIP}:bloqueio`,
    );

    if (!user.emailVerificado) {
      return res.status(403).json({
        message: "Verifique seu e-mail antes de fazer login.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" },
    );

    return res.status(200).json({
      message: "Login realizado com sucesso!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (erro) {
    console.error("Erro no login:", erro);

    return res.status(500).json({
      message: "Erro interno ao realizar login.",
    });
  }
});
app.post("/carrinho", verificarToken, async (req, res) => {
  const userId = req.usuario.id;

  try {
    let carrinho = await prisma.cart.findUnique({
      where: {
        UserId: userId,
      },
    });

    if (!carrinho) {
      carrinho = await prisma.cart.create({
        data: {
          UserId: userId,
        },
      });
    }

    return res.status(200).json(carrinho);
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Erro ao acessar carrinho.",
    });
  }
});
app.post("/carrinho/itens", verificarToken, async (req, res) => {
  const userId = req.usuario.id;
  const { servicoId, quantidade } = req.body;

  try {
    let carrinho = await prisma.cart.findUnique({
      where: {
        UserId: userId,
      },
    });
    if (!carrinho) {
      carrinho = await prisma.cart.create({
        data: {
          UserId: userId,
        },
      });
    }

    const servico = await prisma.servicos.findUnique({
      where: {
        id: servicoId,
      },
    });

    if (!servico) {
      return res.status(404).json({
        message: "Serviço não encontrado.",
      });
    }
    const item = await prisma.cartItem.create({
      data: {
        cart: {
          connect: {
            id: carrinho.id,
          },
        },

        servico: {
          connect: {
            id: servicoId,
          },
        },

        quantidade: quantidade,
        preco: servico.preco,
      },
    });

    console.log("Item adicionado ao carrinho:");
    console.log(item);

    return res.status(201).json(item);
  } catch (error) {
    console.log("Erro ao adicionar item:");
    console.log(error);

    return res.status(500).json({
      message: "Erro ao adicionar item ao carrinho.",
    });
  }
});
app.delete("/carrinho/itens/:itemId", verificarToken, async (req, res) => {
  const userId = req.usuario.id;
  const { itemId } = req.params;
  if (!itemId) {
    return res.status(400).json({
      message: "ItemId não informado",
    });
  }
  try {
    await prisma.cartItem.deleteMany({
      where: {
        id: itemId,
        cart: {
          UserId: userId,
        },
      },
    });
    return res.status(200).json({
      message: "Item deletado com sucesso",
    });
  } catch (error) {
    console.log("Erro ao deletar item do carrinho:");
    console.log(error);
  }
});
app.get("/carrinho", verificarToken, async (req, res) => {
  const userId = req.usuario.id;

  try {
    const carrinho = await prisma.cart.findUnique({
      where: {
        UserId: userId,
      },

      include: {
        itens: {
          include: {
            servico: true,
          },
        },
      },
    });

    if (!carrinho) {
      return res.status(404).json({
        message: "Carrinho não encontrado.",
      });
    }

    return res.status(200).json(carrinho);
  } catch (error) {
    console.log("Erro ao buscar carrinho:");
    console.log(error);

    return res.status(500).json({
      message: "Erro ao buscar carrinho.",
    });
  }
});
app.post("/servicos", verificarToken, verificarAdmin, async (req, res) => {
  const { nome, descricao, preco } = req.body;

  try {
    const servico = await prisma.servicos.create({
      data: {
        nome: nome,
        descricao: descricao,
        preco: preco,
      },
    });
    return res.status(201).json(servico);
  } catch (error) {
    console.log("Erro ao cadastrar serviço:");
    console.log(error);

    res.status(500).json({
      message: "Erro ao cadastrar serviço.",
    });
  }
});

app.get("/servicos", async (req, res) => {
  try {
    const servicos = await prisma.servicos.findMany();

    res.json(servicos);
  } catch (error) {
    console.log("Erro ao buscar serviços");
    console.log(error);
    res.status(500).json({
      message: "Erro ao buscar serviços",
    });
  }
});

app.get("/usuarios", verificarToken, verificarAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        telefone: true,
        emailVerificado: true,
        role: true,
      },
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({
      message: "Erro ao buscar usuários.",
    });
  }
});

app.put(
  "/usuarios/:id",
  verificarToken,
  verificarAdmin,
  async (req, res) => {
    const data = {};
    const { email, name, telefone, senha } = req.body;

    if (email !== undefined) {
      if (typeof email !== "string" || !email.trim()) {
        return res.status(400).json({ message: "E-mail inválido." });
      }
      data.email = email.trim().toLowerCase();
    }
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "Nome inválido." });
      }
      data.name = name.trim();
    }
    if (telefone !== undefined) {
      if (typeof telefone !== "string" || !telefone.trim()) {
        return res.status(400).json({ message: "Telefone inválido." });
      }
      data.telefone = telefone.trim();
    }
    if (senha !== undefined) {
      if (typeof senha !== "string" || senha.length < 8) {
        return res.status(400).json({
          message: "A senha deve ter pelo menos 8 caracteres.",
        });
      }
      data.senha = await bcrypt.hash(senha, 10);
    }
    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: "Informe ao menos um campo para atualizar.",
      });
    }

    try {
      const usuarioAtualizado = await prisma.user.update({
        where: { id: req.params.id },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          telefone: true,
          emailVerificado: true,
          role: true,
        },
      });
      res.status(200).json(usuarioAtualizado);
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      res.status(error.code === "P2025" ? 404 : error.code === "P2002" ? 409 : 500).json({
        message:
          error.code === "P2025"
            ? "Usuário não encontrado."
            : error.code === "P2002"
              ? "Já existe uma conta com este e-mail."
              : "Erro ao atualizar usuário.",
      });
    }
  },
);
app.delete(
  "/usuarios/:email",
  verificarToken,
  verificarAdmin,
  async (req, res) => {
    try {
      await prisma.user.delete({
        where: {
          email: req.params.email.trim().toLowerCase(),
        },
      });
      res.status(200).json({
        message: "Usuário deletado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      res.status(error.code === "P2025" ? 404 : 500).json({
        message:
          error.code === "P2025"
            ? "Usuário não encontrado."
            : "Erro ao deletar usuário.",
      });
    }
  });
app.delete("/servicos/:id", verificarToken, verificarAdmin, async (req, res) => {
  try {
    const servico = await prisma.servicos.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!servico) {
      return res.status(404).json({
        message: "Serviço não encontrado",
      });
    }

    await prisma.servicos.delete({
      where: {
        id: req.params.id,
      },
    });

    res.status(200).json({
      message: "Serviço deletado com sucesso",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erro ao deletar serviço",
    });
  }
});
app.put("/servicos/:id", verificarToken, verificarAdmin, async (req, res) => {
  const { nome, descricao, preco } = req.body;
  const { id } = req.params;

  try {
    const servico = await prisma.servicos.findUnique({
      where: {
        id: id,
      },
    });

    if (!servico) {
      return res.status(404).json({
        message: "Serviço não encontrado",
      });
    }

    const servicoAtualizado = await prisma.servicos.update({
      where: {
        id: id,
      },
      data: {
        nome: nome,
        descricao: descricao,
        preco: preco,
      },
    });

    return res.status(200).json(servicoAtualizado);
  } catch (error) {
    console.error("ERRO COMPLETO:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
});
app.get("/pedidos", verificarToken, verificarAdmin, async (req, res) => {
  try {
    const hojeSaoPaulo = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
    }).format(new Date());
    const inicioDoDia = new Date(`${hojeSaoPaulo}T03:00:00.000Z`);
    const inicioDoProximoDia = new Date(inicioDoDia);
    inicioDoProximoDia.setUTCDate(inicioDoProximoDia.getUTCDate() + 1);
    const pedidos = await prisma.pedido.findMany({
      where: {
        OR: [
          { status: { not: "Entregue" } },
          {
            status: "Entregue",
            entregueEm: {
              gte: inicioDoDia,
              lt: inicioDoProximoDia,
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            telefone: true,
          },
        },
        endereco: true,
        itensPedido: {
          include: {
            servico: true,
          },
        },
      },
    });

    res.json(pedidos);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erro ao buscar pedidos",
    });
  }
});
app.post("/enderecos", async (req, res) => {
  const { UserId, rua, numero, complemento, bairro, cep } = req.body;
  try {
    const endereco = await prisma.endereco.create({
      data: {
        UserId: UserId,
        rua: rua,
        numero: numero,
        complemento: complemento,
        bairro: bairro,
        cep: cep,
      },
    });
    return res.status(200).json(endereco, {
      message: "Endereço Cadastrado",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "não foi possivel cadastrar o endereço",
    });
  }
});
app.put("/pedidos/:id", verificarToken, verificarAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  await prisma.pedido.update({
    where: {
      id: id,
    },
    data: {
      status: status,
      entregueEm: status === "Entregue" ? new Date() : null,
    },
  });
  res.status(200).json({ message: "Pedido Atualizado" });
});
app.get("/usuarios-chat", verificarToken, verificarAdmin, async (req, res) => {
  try {
    const usuarios = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    res.json(usuarios);
  } catch (erro) {
    console.error("Erro ao buscar usuários:", erro);

    res.status(500).json({
      erro: "Erro ao buscar usuários",
    });
  }
});

app.get("/mensagens/:clienteId", verificarToken, async (req, res) => {
  try {
    const { clienteId } = req.params;
    if (req.usuario.role !== "admin" && req.usuario.id !== clienteId) {
      return res.status(403).json({ erro: "Acesso negado ao chat deste usuário." });
    }

    const pedido = await prisma.pedido.findFirst({
      where: {
        UserId: clienteId,
        ...(req.usuario.role === "admin" ? {} : { status: { not: "Entregue" } }),
      },
      select: { id: true },
    });
    if (!pedido) {
    return res.status(404).json({ erro: "É necessário ter um pedido em andamento para acessar o chat." });
    }

    const mensagens = await prisma.mensagem.findMany({
      where: {
        clienteId: clienteId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    res.json(mensagens);
  } catch (erro) {
    console.error("Erro ao buscar mensagens:", erro);

    res.status(500).json({
      erro: "Erro ao buscar mensagens",
    });
  }
});
app.put(
  "/admin/usuarios/role",
  verificarToken,
  verificarAdmin,
  async (req, res) => {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({
        message: "E-mail e permissão são obrigatórios.",
      });
    }

    if (role !== "admin" && role !== "cliente") {
      return res.status(400).json({
        message: "Permissão inválida.",
      });
    }

    try {
      const usuario = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      if (!usuario) {
        return res.status(404).json({
          message: "Usuário não encontrado.",
        });
      }

      const usuarioAtualizado = await prisma.user.update({
        where: {
          id: usuario.id,
        },
        data: {
          role: role,
        },
      });

      return res.status(200).json({
        message:
          role === "admin"
            ? "Usuário promovido para administrador."
            : "Usuário removido da administração.",
        usuario: {
          id: usuarioAtualizado.id,
          name: usuarioAtualizado.name,
          email: usuarioAtualizado.email,
          role: usuarioAtualizado.role,
        },
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Erro ao alterar permissão do usuário.",
      });
    }
  },
);
app.get("/config/maps", (req, res) => {
  res.json({
    apiKey: process.env.GOOGLE_MAPS_API,
  });
});

server.listen(process.env.PORT, () => {
  console.log(`Servidor rodando na porta ${process.env.PORT}`);
});
