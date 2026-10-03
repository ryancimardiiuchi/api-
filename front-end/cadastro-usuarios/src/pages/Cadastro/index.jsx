import "./style.css";
import Footer from "../../components/footer";
import api from "../../services/api";
import { useRef, useState} from "react";
import { Link, useNavigate } from "react-router-dom";
import mostrarSenha from "../../ultils/senha";

function Cadastro() {
  const [message, setMessage] = useState({
    text:"",
    sucess:false
  });
  const navigate = useNavigate();
  const inputName = useRef();
  const inputEmail = useRef();
  const inputSenha = useRef();
  const inputTelefone = useRef();
  const inputConfirmarSenha = useRef();
 
  function formatarTelefone(valor) {
    valor = valor.replace(/\D/g, "");
    if (valor.length <= 2) {
      return "(" + valor;
    }
    if (valor.length <= 7) {
      return "(" + valor.slice(0, 2) + ")" + valor.slice(2);
    }
    return (
      "(" +
      valor.slice(0, 2) +
      ")" +
      valor.slice(2, 7) +
      "-" +
      valor.slice(7, 11)
    );
  }

  async function createUsers() {
    const senha = inputSenha.current.value;
    const confirmarSenha = inputConfirmarSenha.current.value;
    const cadastroTelefone = inputTelefone.current.value.replace(/\D/g, "");
    if (
      inputName.current.value === "" ||
      inputEmail.current.value === "" ||
      inputTelefone.current.value === "" ||
      senha === "" ||
      confirmarSenha === ""
    ) {
      setMessage({ text: "Preencha todos os campos!", success: false });
      return;
    }

    if (senha !== confirmarSenha) {
      setMessage({ text: "As senhas não são iguais", success: false });
      return;
    }
    if (cadastroTelefone.length !== 11) {
      setMessage({ text: "Digite um telefone válido com DDD.", success: false });
      return;
    }
    if (senha.length < 8) {
      setMessage({ text: "Sua senha precisa ter no minimo 8 caracteres", success: false });
      return;
    }
    if (/[0-9]/.test(inputName.current.value)) {
      setMessage({ text: "Seu nome não pode ter numeros", success: false });
      return;
    }
    if (!/^[A-Za-zÀ-ÿ ]+$/.test(inputName.current.value)) {
      setMessage({ text: "Seu nome só pode possuir letras", success: false });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputEmail.current.value)) {
      setMessage({ text: "Digite um email valido", success: false });
      return;
    }
    if (!/[A-Z]/.test(senha)) {
      setMessage({ text: "Sua senha precisa ter no minimo uma letra Maiuscula", success: false });
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(senha)) {
      setMessage({ text: "A senha precisa ter pelo menos um caractere especial.", success: false });
      return;
    }

    try {
      await api.post("/usuarios", {
        name: inputName.current.value,
        email: inputEmail.current.value,
        telefone: inputTelefone.current.value,
        senha: senha,
      });

      setMessage({ text: "Cadastro realizado! Verifique seu e-mail.", success: true });
      navigate("/verificar-email", {
        state: {
          email: inputEmail.current.value,
        },
      });
    } catch (error) {
      setMessage({ text: error.response?.data?.message || "Erro ao cadastrar usuário.", success: false });
    }
  }

  return (
    <>
      <div className="cadastro-page">
        <div className="cadastro-container">
          <div className="cadastro-info">
            <h1>Crie sua conta!</h1>

            <p>Cadastre-se no Lavô+ e facilite o cuidado com suas roupas.</p>

            <div className="cadastro-benefits">
              <div className="benefit">
                <span>🧺</span>
                <div>
                  <h3>Lavanderia online</h3>
                  <p>Solicite seus serviços de forma rápida.</p>
                </div>
              </div>

              <div className="benefit">
                <span>🚚</span>
                <div>
                  <h3>Coleta e entrega</h3>
                  <p>Receba suas roupas com praticidade.</p>
                </div>
              </div>

              <div className="benefit">
                <span>🔒</span>
                <div>
                  <h3>Conta segura</h3>
                  <p>Tenha seus dados organizados em um só lugar.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="cadastro-card">
            <div className="cadastro-header">
              <h2>Criar conta</h2>
              <p>Preencha seus dados para começar</p>
            </div>

            <form>
              <h3 className="form-section-title">Dados pessoais</h3>

              <div className="form-group">
                <label htmlFor="nome">Nome completo</label>

                <input
                  type="text"
                  id="nome"
                  name="name"
                  placeholder="Digite seu nome completo"
                  ref={inputName}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">E-mail</label>

                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Digite seu e-mail"
                  ref={inputEmail}
                />
              </div>

              <div className="form-group">
                <label htmlFor="telefone">Telefone</label>

                <input
                  type="tel"
                  id="telefone"
                  name="telefone"
                  placeholder="(00) 00000-0000"
                  ref={inputTelefone}
                  onChange={(e) => {
                    e.target.value = formatarTelefone(e.target.value);
                  }}
                />
              </div>

              <h3 className="form-section-title">Dados de acesso</h3>

              <div className="form-group">
                <label htmlFor="senha">Senha</label>

                <input
                  type="password"
                  id="senha"
                  name="senha"
                  placeholder="Digite sua senha"
                  ref={inputSenha}
                  onClick={mostrarSenha}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmarSenha">Confirmar senha</label>

                <input
                  type="password"
                  id="confirmarSenha"
                  name="confirmarSenha"
                  placeholder="Digite sua senha novamente"
                  ref={inputConfirmarSenha}
                />
              </div>
              {message.text && (
                <div className={message.sucess ? "message-success" : "message-error"}>
                  {message.text}
                </div>
              )}

              <button
                type="button"
                className="cadastro-button"
                onClick={createUsers}
              >
                CRIAR CONTA
              </button>
            </form>

            <p className="login-link">
              Já possui uma conta?
              <Link to={"/login"}>
                <a href="/"> Entrar</a>
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Cadastro;
