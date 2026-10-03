import express from "express";
import bcrypt from "bcrypt";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import "dotenv/config";
import jwt from "jsonwebtoken";
import { verificarToken } from "./authMiddleware.js";
import iaRoutes from "./iaRoutes.js";
const prisma = new PrismaClient();
const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  }),
);
app.use(express.json());
app.use("/ia", iaRoutes);
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
function gerarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
async function EsqueceuSenha(email,codigo){
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to:email,
    subject:"Teste Esqueceu Senha",
    text: `Para fazer uma nova senha adicione seu codigo na tela ${codigo}`
  })
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
app.post("/esqueceusenha", async (req, res) => {

    const { email, codigo } = req.body;

    try {

        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if (!user) {
            return res.status(404).json({
                message: "Usuário não encontrado."
            });
        }
        if (codigo) {

            if (codigo !== user.codigoVerificacao) {
                return res.status(400).json({
                    message: "Código inválido."
                });
            }

            if (
                !user.codigoExpira ||
                new Date() > user.codigoExpira
            ) {
                return res.status(400).json({
                    message: "Código expirado."
                });
            }

            // Código correto → cria token exclusivo para reset
            const resetToken = jwt.sign(
                {
                    id: user.id,
                    tipo: "reset-senha"
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "10m"
                }
            );

            return res.status(200).json({
                message: "Código confirmado.",
                resetToken: resetToken
            });
        }


        const novoCodigo = gerarCodigo();

        const codigoExpira = new Date();

        codigoExpira.setMinutes(
            codigoExpira.getMinutes() + 10
        );

        await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                codigoVerificacao: novoCodigo,
                codigoExpira: codigoExpira
            }
        });

        await EsqueceuSenha(
            user.email,
            novoCodigo
        );

        return res.status(200).json({
            message: "Código para recuperação enviado para seu e-mail."
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Erro ao processar recuperação de senha."
        });
    }
});
app.put("/novasenha", async (req, res) => {

    const { senha, resetToken } = req.body;

    if (!senha || !resetToken) {
        return res.status(400).json({
            message: "Senha e token são obrigatórios."
        });
    }

    try {

        const payload = jwt.verify(
            resetToken,
            process.env.JWT_SECRET
        );

        if (payload.tipo !== "reset-senha") {
            return res.status(401).json({
                message: "Token inválido para recuperação de senha."
            });
        }

        const senhaHash = await bcrypt.hash(
            senha,
            10
        );

        await prisma.user.update({
            where: {
                id: payload.id
            },
            data: {
                senha: senhaHash
            }
        });

        return res.status(200).json({
            message: "Senha alterada com sucesso!"
        });

    } catch (error) {

        console.error(error);

        return res.status(401).json({
            message: "Token inválido ou expirado."
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
app.post("/verificar-email", async (req, res) => {
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
    },
  });
  res.status(200).json({
    message: "Email Verificado",
  });
});
app.post("/reenviar-codigo", async (req, res) => {
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
app.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({
      message: "E-mail e senha são obrigatórios.",
    });
  }

  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (!user) {
    return res.status(401).json({
      message: "E-mail ou senha inválidos.",
    });
  }

  const senhaCorreta = await bcrypt.compare(senha, user.senha);

  if (!senhaCorreta) {
    return res.status(401).json({
      message: "E-mail ou senha inválidos.",
    });
  }

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
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" },
  );
  return res.status(200).json({
    message: "Login realizado com sucesso!",
    token: token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
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
  if(!itemId){
    return res.status(400).json({
      message:"ItemId não informado"
    })
  }
  try {
    await prisma.cartItem.deleteMany({
      where:{
        id:itemId,
        cart:{
          UserId:userId
        }
    }
  })
   return res.status(200).json({
      message:"Item deletado com sucesso"
    })
  } catch (error) {
    console.log("Erro ao deletar item do carrinho:");
    console.log(error);

}
})
app.get("/carrinho", verificarToken, async (req, res) => {

  const userId = req.usuario.id;

  try {

    const carrinho = await prisma.cart.findUnique({
      where: {
        UserId: userId
      },

      include: {
        itens: {
          include: {
            servico: true
          }
        }
      }
    });

    if (!carrinho) {
      return res.status(404).json({
        message: "Carrinho não encontrado."
      });
    }

    return res.status(200).json(carrinho);

  } catch (error) {

    console.log("Erro ao buscar carrinho:");
    console.log(error);

    return res.status(500).json({
      message: "Erro ao buscar carrinho."
    });
  }
});
app.post("/servicos", async (req, res) => {
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

app.get("/usuarios", async (req, res) => {
  const users = await prisma.user.findMany();
  res.status(200).json(users);
});

app.put("/usuarios/:id", async (req, res) => {
  await prisma.user.update({
    where: {
      id: req.params.id,
    },
    data: {
      email: req.body.email,
      name: req.body.name,
      telefone: req.body.telefone,
      senha: req.body.senha,
    },
  });
  res.status(201).json(req.body);
});
app.delete("/usuarios/:email", async (req, res) => {
  await prisma.user.delete({
    where: {
      email: req.params.email
    },
  });

  res.status(200).json({
    message: "usuario deletado com sucesso",
  });
});
app.delete("/servicos/:id", async (req, res) => {
  try {
    const servico = await prisma.servicos.findUnique({
      where: {
        id: req.params.id
      }
    })

    if (!servico) {
      return res.status(404).json({
        message: "Serviço não encontrado"
      })
    }

    await prisma.servicos.delete({
      where: {
        id: req.params.id
      }
    })

    res.status(200).json({
      message: "Serviço deletado com sucesso"
    })

  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: "Erro ao deletar serviço"
    })
  }
})
app.put("/servicos/:id", async (req, res) => {
  const { nome, descricao, preco } = req.body;
  const { id } = req.params;

  try {
    const servico = await prisma.servicos.findUnique({
      where: {
        id: id
      }
    });

    if (!servico) {
      return res.status(404).json({
        message: "Serviço não encontrado"
      });
    }

    const servicoAtualizado = await prisma.servicos.update({
      where: {
        id: id
      },
      data: {
        nome: nome,
        descricao: descricao,
        preco: preco
      }
    });

    return res.status(200).json(servicoAtualizado);

  } catch (error) {
    console.error("ERRO COMPLETO:", error);

    return res.status(500).json({
      message: error.message
    });
  }
});



app.listen(process.env.PORT, () => {
  console.log(`Servidor rodando na porta ${process.env.PORT}`);
});
