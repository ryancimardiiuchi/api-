# 🧺 Lavô+ | Lavanderia Online

Sistema web de lavanderia online desenvolvido com o objetivo de facilitar o agendamento de coletas, gerenciamento de pedidos e acompanhamento dos serviços de lavagem.

> 🚧 **Projeto em desenvolvimento** — novas funcionalidades e melhorias estão sendo implementadas.

---

## 🚀 Tecnologias utilizadas

<div align="center">

<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original.svg" width="60px" alt="React"/>
&nbsp;&nbsp;&nbsp;
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original.svg" width="60px" alt="Node.js"/>
&nbsp;&nbsp;&nbsp;
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg" width="60px" alt="JavaScript"/>
&nbsp;&nbsp;&nbsp;
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/prisma/prisma-original.svg" width="60px" alt="Prisma"/>
&nbsp;&nbsp;&nbsp;
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/mongodb/mongodb-original.svg" width="60px" alt="MongoDB"/>
&nbsp;&nbsp;&nbsp;
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/css3/css3-original.svg" width="60px" alt="CSS3"/>
&nbsp;&nbsp;&nbsp;
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/html5/html5-original.svg" width="60px" alt="HTML5"/>

</div>

### Front-end

- ⚛️ React
- JavaScript
- HTML5
- CSS3
- React Router
- Axios
- Vite

### Back-end

- 🟢 Node.js
- Express
- Prisma ORM
- MongoDB
- JWT para autenticação
- bcrypt para proteção de senhas
- API REST

---

## 📌 Sobre o projeto

O **Lavô+** é uma aplicação web voltada para o gerenciamento de serviços de lavanderia.

A aplicação permite que o usuário tenha uma experiência digital para:

- Criar uma conta
- Realizar login
- Recuperar a senha
- Verificar o e-mail através de código
- Alterar a senha
- Visualizar serviços disponíveis
- Consultar preços
- Montar pedidos
- Acompanhar pedidos
- Solicitar coleta e entrega

O projeto possui uma arquitetura separando **front-end e back-end**, com comunicação através de uma API.

---

## 🖥️ Front-end

O front-end foi desenvolvido utilizando **React**, com componentes e páginas separadas para facilitar a organização e manutenção do projeto.

### Principais páginas

- 🏠 Home
- 🔐 Login
- 📝 Cadastro
- 🔑 Esqueci minha senha
- ✉️ Verificação de e-mail
- 🔒 Nova senha
- 🛒 Carrinho
- 🧺 Serviços
- 💰 Preços
- 📦 Administração
- 📞 Contato
- ℹ️ Sobre nós

---

## ⚙️ Back-end

O back-end foi desenvolvido com **Node.js e Express**, responsável pela criação da API e pelo processamento das regras da aplicação.

Entre as funcionalidades implementadas estão:

- Cadastro de usuários
- Login
- Autenticação
- Criação e validação de JWT
- Criptografia de senhas com bcrypt
- Recuperação de senha
- Verificação de código enviado por e-mail
- Rotas protegidas
- Integração com banco de dados
- API para comunicação com o front-end

---

## 🗄️ Banco de dados

O projeto utiliza:

**MongoDB + Prisma ORM**

O Prisma é utilizado para facilitar a comunicação entre o back-end e o banco de dados, permitindo trabalhar com os dados através de uma estrutura organizada.

---

## 🔐 Segurança

Algumas medidas de segurança implementadas no projeto:

- Senhas armazenadas utilizando hash com bcrypt
- Autenticação através de JWT
- Middleware para proteção de rotas
- Validação de autenticação no back-end
- Variáveis sensíveis armazenadas em `.env`
- Arquivos `.env` protegidos pelo `.gitignore`

---

## 📂 Estrutura do projeto

```text
lavanderia/
│
├── back-end/
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   ├── authMiddleware.js
│   ├── iaController.js
│   ├── iaRoutes.js
│   ├── server.js
│   ├── package.json
│   └── .gitignore
│
├── front-end/
│   └── cadastro-usuarios/
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── routes/
│       │   ├── services/
│       │   └── ultils/
│       │
│       ├── package.json
│       └── vite.config.js
│
└── template/
```

---

## 🚧 Em desenvolvimento

O projeto ainda está sendo desenvolvido e algumas funcionalidades estão em processo de implementação.

### 🔨 Melhorias atuais

- [ ] Melhorar validações dos formulários
- [ ] Melhorar tratamento de erros
- [ ] Aprimorar sistema de autenticação
- [ ] Melhorar responsividade
- [ ] Melhorar experiência do usuário
- [ ] Finalizar funcionalidades administrativas
- [ ] Aprimorar gerenciamento de pedidos
- [ ] Melhorar integração entre front-end e back-end

### 🔮 Próximas funcionalidades

- [ ] Sistema completo de pedidos
- [ ] Rastreamento de pedidos em tempo real
- [ ] Sistema de notificações
- [ ] Integração com pagamento
- [ ] Dashboard administrativo
- [ ] Gerenciamento de clientes
- [ ] Gerenciamento de serviços
- [ ] Relatórios administrativos
- [ ] Melhorias na segurança da API
- [ ] Deploy da aplicação

---

## 📚 Objetivo do projeto

Além de desenvolver uma aplicação funcional, o projeto tem como objetivo colocar em prática conhecimentos de:

- Desenvolvimento Front-end
- Desenvolvimento Back-end
- APIs REST
- Banco de dados
- Autenticação
- Segurança
- React
- Node.js
- Git e GitHub
- Arquitetura de aplicações web

---

## 👨‍💻 Desenvolvedor

**Ryan Cimardi Iuchi**

Estudante de Ciência da Computação e desenvolvedor em formação, com foco em desenvolvimento Back-end e aplicações web.

---

⭐ Projeto desenvolvido para fins de aprendizado e evolução profissional.
