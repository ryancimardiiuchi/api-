import "./style.css";
import Footer from "../../components/footer";
import api from "../../services/api.js";
import { useLocation, useNavigate } from "react-router-dom";

function VerificarEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  async function validarCodigo() {
    const codigo = document.querySelector(".codigo-input").value;

    try {
      await api.post("/verificar-email", {
        email: email,
        codigo: codigo,
      });

      alert("E-mail verFificado com sucesso!");
      navigate("/login");
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao verificar e-mail.");
    }
  }
  async function reenviarCodigo() {
    try {
      const resposta = await api.post("/reenviar-codigo", {
        email: email,
      });

      alert(resposta.data.message);
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao reenviar código.");
    }
  }
  return (
    <>
      <div className="verificacao-container">
        <div className="verificacao-card">
          <div className="logo">Lavô+</div>

          <h1>Verifique seu e-mail</h1>

          <p className="descricao">
            Enviamos um código de verificação de 6 dígitos para o seu e-mail.
          </p>

          <p className="email-enviado">
            Confira sua caixa de entrada e digite o código abaixo.
          </p>

          <input
            type="text"
            maxLength="6"
            placeholder="000000"
            className="codigo-input"
          />

          <button className="verificar-button" onClick={validarCodigo}>
            VERIFICAR E-MAIL
          </button>

          <button className="reenviar-button" onClick={reenviarCodigo}>
            Reenviar código
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default VerificarEmail;
