import "./style.css";
import api from "../../services/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Configuracoes() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin");
  const [message, setMessage] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      if (payload.role !== "admin") {
        navigate("/");
      }
    } catch (error) {
      localStorage.removeItem("token");
      navigate("/");
    }
  }, [navigate]);

  async function alterarPermissao(event) {
    event.preventDefault();

    setMessage("");
    setErro("");

    if (!email) {
      setErro("Digite o e-mail do usuário.");
      return;
    }

    try {
      const resposta = await api.put("/admin/usuarios/role", {
        email: email,
        role: role
      });

      setMessage(resposta.data.message);
      setEmail("");
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/");
        return;
      }

      setErro(
        error.response?.data?.message ||
        "Não foi possível alterar a permissão."
      );
    }
  }

  return (
    <main className="configuracoes-page">
      <div className="configuracoes-container">
        <button
          className="voltar-button"
          onClick={() => navigate("/admin")}
        >
          ← Voltar para Administração
        </button>

        <div className="configuracoes-header">
          <span>⚙️</span>
          <div>
            <h1>Configurações</h1>
            <p>Gerencie as permissões dos usuários da Lavô+.</p>
          </div>
        </div>

        <section className="admin-card">
          <div className="card-header">
            <div className="card-icon">
              👤
            </div>

            <div>
              <h2>Gerenciar administradores</h2>
              <p>
                Altere a permissão de um usuário através do e-mail cadastrado.
              </p>
            </div>
          </div>

          <form onSubmit={alterarPermissao}>
            <label htmlFor="email">
              E-mail do usuário
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="usuario@email.com"
            />

            <label htmlFor="role">
              Permissão
            </label>

            <select
              id="role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="admin">
                Administrador
              </option>

              <option value="cliente">
                Cliente
              </option>
            </select>

            {message && (
              <div className="config-success">
                {message}
              </div>
            )}

            {erro && (
              <div className="config-error">
                {erro}
              </div>
            )}

            <button
              type="submit"
              className="alterar-permissao"
            >
              {role === "admin"
                ? "Tornar administrador"
                : "Remover administrador"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default Configuracoes;