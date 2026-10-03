import "./style.css";
import Footer from "../../components/footer";
import api from "../../services/api";
import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import mostrarSenha from "../../ultils/senha";
import { useState } from "react";

function Login() {
  const inputEmail = useRef();
  const inputSenha = useRef();
  const navigate = useNavigate();
  const [message, setMessage] = useState({
    text:"",
    sucess:true

});

  async function EsqueceuSenha() {
    const email = inputEmail.current.value;

    if (!email) {
     setMessage({ text: "Digite seu e-mail primeiro.", sucess: false });
      return;
    }

    try {
      const resposta = await api.post("/esqueceusenha", {
        email: email,
      });

      setMessage({ text: resposta.data.message, sucess: true });

      navigate("/esqueceusenha", {
        state: {
          email: email,
        },
      });
    } catch (erro) {
      setMessage({ text: erro.response?.data?.message || "Não foi possível enviar o código.", sucess: false });
    }
  }

  async function fazerLogin() {
    const email = inputEmail.current.value;
    const senha = inputSenha.current.value;

    if (!email || !senha) {
      setMessage({ text: "Preencha o e-mail e a senha.", sucess: false });
      return;
    }

    try {
      const resposta = await api.post("/login", {
        email: email,
        senha: senha,
      });

      localStorage.setItem("token", resposta.data.token);

      setMessage({ text: resposta.data.message, sucess: true });

      navigate("/principal");
    } catch (error) {
      if (error.response?.status === 403) {
        try {
          await api.post("/reenviar-codigo", {
            email: email,
          });

          setMessage({ text: "Seu e-mail ainda não foi verificado. Enviamos um novo código para seu e-mail.", sucess: false });

          navigate("/verificar-email", {
            state: {
              email: email,
            },
          });
        } catch (erroReenvio) {
          setMessage({ text: erroReenvio.response?.data?.message || "Não foi possível reenviar o código.", sucess: false });
        }

        return;
      }

      if (error.response?.status === 401) {
        setMessage({ text: "E-mail ou senha inválidos.", sucess: false });
        return;
      }

      setMessage({ text: "Não foi possível realizar o login.", sucess: false });
    }
  }

  return (
    <>
      <main className="login-page">
        <div className="login-container">

          <div className="login-info">
            <div className="info-icon">🧺</div>

            <h1>Bem-vindo de volta!</h1>

            <p>
              Entre na sua conta para acompanhar seus pedidos, agendar coletas e
              cuidar das suas roupas de forma simples e rápida.
            </p>

            <div className="benefit">
              <div className="benefit-icon">📦</div>

              <div>
                <strong>Acompanhe seus pedidos</strong>
                <span>Veja em qual etapa está sua roupa.</span>
              </div>
            </div>

            <div className="benefit">
              <div className="benefit-icon">📅</div>

              <div>
                <strong>Agende sua coleta</strong>
                <span>Escolha o melhor dia e horário.</span>
              </div>
            </div>

            <div className="benefit">
              <div className="benefit-icon">🏠</div>

              <div>
                <strong>Receba em casa</strong>
                <span>Suas roupas limpas e dobradas.</span>
              </div>
            </div>
          </div>

          <div className="login-card">

            <div className="login-header">
              <h2>Entrar na conta</h2>

              <p>Informe seus dados para continuar.</p>
            </div>

            <form id="loginForm">

              <div className="input-group">
                <label htmlFor="email">E-mail</label>

                <div className="input-wrapper">
                  <span>📧</span>

                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="seuemail@email.com"
                    required
                    ref={inputEmail}
                  />
                </div>
              </div>

              <div className="input-group">

                <div className="password-label">
                  <label htmlFor="senha">Senha</label>

                  <button
                    type="button"
                    className="forgot-password"
                    onClick={EsqueceuSenha}
                  >
                    Esqueci minha senha
                  </button>
                </div>

                <div className="input-wrapper">
                  <span>🔒</span>

                  <input
                    type="password"
                    id="senha"
                    name="senha"
                    placeholder="Digite sua senha"
                    required
                    ref={inputSenha}
                  />

                  <button
                    type="button"
                    className="show-password"
                    onClick={mostrarSenha}
                  >
                    <i className="bi bi-eye"></i>
                  </button>
                </div>
              </div>
              {message.text && (
                <span className={message.sucess ? "message-success" : "message-error"}>
                  {message.text}
                </span>
              )}

              <div className="remember">
                <label>
                  <input
                    type="checkbox"
                    id="lembrar"
                  />

                  <span>Lembrar de mim</span>
                </label>
              </div>

              <button
                type="button"
                className="login-btn"
                onClick={fazerLogin}
              >
                ENTRAR
                <span>→</span>
              </button>

            </form>

            <div className="register">
              <span>Ainda não possui uma conta?</span>

              <Link to="/cadastro">
                Criar minha conta
              </Link>
            </div>

            <div className="security">
              🔒 Seus dados são protegidos com segurança.
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default Login;
