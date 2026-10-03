
import "./style.css";
import Footer from "../../components/footer";
import api from "../../services/api";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function NovaSenha() {
  const [verificarSenha, setVerificarSenha] = useState(false);

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const resetToken = location.state?.resetToken;

  async function trocarSenha(e) {
    e.preventDefault();

    setVerificarSenha(true);

   
    if (!resetToken) {
      alert("Token de recuperação não encontrado.");
      navigate("/login");
      return;
    }

    if (!senha || !confirmarSenha) {
      return;
    }

    if (senha !== confirmarSenha) {
      return;
    }
    if (senha.length < 8) {
      return;
    }

    if (!/[^A-Za-z0-9]/.test(senha)) {
      return;
    }

    if (!/[A-Z]/.test(senha)) {
      return;
    }

    try {
      const resposta = await api.put("/novasenha", {
        senha: senha,
        resetToken: resetToken,
      });

      alert(
        resposta.data.message ||
          "Senha alterada com sucesso!"
      );

      navigate("/login");

    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Não foi possível alterar a senha."
      );
    }
  }

  return (
    <>
      <main className="nova-senha-page">

        <div className="nova-senha-container">

          <div className="nova-senha-info">

            <div className="info-icon">
              🔐
            </div>

            <h1>
              Crie uma nova senha
            </h1>

            <p>
              Escolha uma nova senha para recuperar o acesso à sua
              conta de forma segura.
            </p>

            <div className="benefit">

              <div className="benefit-icon">
                ✓
              </div>

              <div>
                <strong>
                  Senha segura
                </strong>

                <span>
                  Use pelo menos 6 caracteres.
                </span>
              </div>

            </div>

            <div className="benefit">

              <div className="benefit-icon">
                🔒
              </div>

              <div>
                <strong>
                  Conta protegida
                </strong>

                <span>
                  Sua nova senha será usada no próximo login.
                </span>
              </div>

            </div>

            <div className="benefit">

              <div className="benefit-icon">
                ✓
              </div>

              <div>
                <strong>
                  Quase pronto!
                </strong>

                <span>
                  Depois de alterar a senha, você poderá entrar novamente.
                </span>
              </div>

            </div>

          </div>

          <div className="nova-senha-card">

            <div className="nova-senha-header">

              <span className="small-tag">
                🔑 Recuperação de conta
              </span>

              <h2>
                Nova senha
              </h2>

              <p>
                Digite sua nova senha abaixo.
              </p>

            </div>

            <form onSubmit={trocarSenha}>

              {/* NOVA SENHA */}
              <div className="input-group">

                <label htmlFor="senha">
                  Nova senha
                </label>

                <div className="input-wrapper">

                  <span>
                    🔒
                  </span>

                  <input
                    type={
                      mostrarSenha
                        ? "text"
                        : "password"
                    }
                    id="senha"
                    placeholder="Digite sua nova senha"
                    value={senha}
                    onChange={(e) =>
                      setSenha(e.target.value)
                    }
                    required
                  />

                  <button
                    type="button"
                    className="show-password"
                    onClick={() =>
                      setMostrarSenha(!mostrarSenha)
                    }
                  >
                    <i
                      className={
                        mostrarSenha
                          ? "bi bi-eye-slash"
                          : "bi bi-eye"
                      }
                    ></i>
                  </button>

                </div>

              </div>

              {/* CONFIRMAR SENHA */}
              <div className="input-group">

                <label htmlFor="confirmarSenha">
                  Confirmar nova senha
                </label>

                <div className="input-wrapper">

                  <span>
                    🔒
                  </span>

                  <input
                    type={
                      mostrarConfirmacao
                        ? "text"
                        : "password"
                    }
                    id="confirmarSenha"
                    placeholder="Digite a senha novamente"
                    value={confirmarSenha}
                    onChange={(e) =>
                      setConfirmarSenha(e.target.value)
                    }
                    required
                  />

                  <button
                    type="button"
                    className="show-password"
                    onClick={() =>
                      setMostrarConfirmacao(
                        !mostrarConfirmacao
                      )
                    }
                  >
                    <i
                      className={
                        mostrarConfirmacao
                          ? "bi bi-eye-slash"
                          : "bi bi-eye"
                      }
                    ></i>
                  </button>

                </div>

              </div>

              {/* REGRAS DA SENHA */}
              <div className="password-rules">

                {!verificarSenha ? (
                  <>
                    <span>
                      ✓ Mínimo de 8 caracteres
                    </span>

                    <span>
                      ✓ 1 caractere especial e 1 letra maiúscula
                    </span>

                    <span>
                      ✓ As senhas devem ser iguais
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      className={
                        senha.length >= 8
                          ? "message-success"
                          : "message-error"
                      }
                    >
                      Mínimo de 8 caracteres
                    </span>

                    <span
                      className={
                        /[A-Z]/.test(senha) &&
                        /[^A-Za-z0-9]/.test(senha)
                          ? "message-success"
                          : "message-error"
                      }
                    >
                      1 caractere especial e 1 letra maiúscula
                    </span>

                    <span
                      className={
                        senha === confirmarSenha &&
                        senha !== ""
                          ? "message-success"
                          : "message-error"
                      }
                    >
                      As senhas devem ser iguais
                    </span>
                  </>
                )}

              </div>

              {/* BOTÃO */}
              <button
                type="submit"
                className="change-password-btn"
              >
                ALTERAR SENHA

                <span>
                  →
                </span>
              </button>

            </form>

            <div className="back-login">

              <span>
                Já lembrou sua senha?
              </span>

              <button
                type="button"
                onClick={() =>
                  navigate("/login")
                }
              >
                Voltar para o login
              </button>

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

export default NovaSenha;

