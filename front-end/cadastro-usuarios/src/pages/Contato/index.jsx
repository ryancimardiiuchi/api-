import Navbar from "../../components/navbar";
import "./style.css";
import Footer from "../../components/footer";
import whatsApp from "../../assets/img/whatsapp.png";
import gmail from "../../assets/img/email.png";
import maps from "../../assets/img/maps.png";
import api from "../../services/api";
import { useState } from "react";

function Contato() {
  const [isLoading,setIsLoading]= useState(false)
  const [email, setEMail] = useState("");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function SendEmail(e) {
    e.preventDefault();

    if (
      email === "" ||
      assunto === "" ||
      mensagem === ""
    ) {
      alert("Por favor preencha todo o formulário");
      return;
    }
    setIsLoading(true)
    try {
      await api.post("/contato", {
        email: email,
        assunto: assunto,
        mensagem: mensagem
      });
      
      alert("Sua mensagem foi enviada!");

      setEMail("");
      setAssunto("");
      setMensagem("");
      setIsLoading(false)
    } catch (error) {
      console.log(error);
      alert("Erro ao enviar mensagem.");
    }
  }

  return (
    <>
      <Navbar />

      <section className="contato">

        <div className="contato-header">

          <span className="contato-tag">
            Fale conosco
          </span>

          <h1>
            Entre em contato com a <span>Lavô+</span>
          </h1>

          <p>
            Ficou com alguma dúvida ou precisa de ajuda?
            Nossa equipe está pronta para atender você.
          </p>

        </div>

        <div className="contato-container">

          <div className="contato-info">

            <h2>
              Estamos aqui para ajudar
            </h2>

            <p>
              Entre em contato conosco através de um dos nossos
              canais de atendimento.
            </p>

            <div className="info-item">

              <div className="info-icon">
                <img src={whatsApp} alt="WhatsApp" />
              </div>

              <div>
                <h3>WhatsApp</h3>
                <p>(49) 99947-1251</p>
              </div>

            </div>

            <div className="info-item">

              <div className="info-icon">
                <img src={gmail} alt="Gmail" />
              </div>

              <div>
                <h3>E-mail</h3>
                <p>ryancimardiiuchi@gmail.com</p>
              </div>

            </div>

            <div className="info-item">

              <div className="info-icon">
                <img src={maps} alt="Maps" />
              </div>

              <div>
                <h3>Localização</h3>
                <p>Lages - Santa Catarina</p>
              </div>

            </div>

            <div className="info-item">

              <div className="info-icon">
                🕐
              </div>

              <div>
                <h3>Horário de atendimento</h3>
                <p>Segunda a sábado, das 8h às 18h</p>
              </div>

            </div>

            <a
              href="https://wa.me/5549999471251"
              target="_blank"
              rel="noreferrer"
              className="whatsapp-btn"
            >
              Falar pelo WhatsApp
            </a>

          </div>

          <div className="contato-form">

            <h2>
              Envie uma mensagem
            </h2>

            <form onSubmit={SendEmail}>

              <div className="form-group">

                <label htmlFor="email">
                  E-mail
                </label>

                <input
                  type="email"
                  id="email"
                  placeholder="Digite seu e-mail"
                  onChange={(e) => setEMail(e.target.value)}
                  value={email}
                />

              </div>

              <div className="form-group">

                <label htmlFor="assunto">
                  Assunto
                </label>

                <input
                  type="text"
                  id="assunto"
                  placeholder="Qual é o assunto?"
                  onChange={(e) => setAssunto(e.target.value)}
                  value={assunto}
                />

              </div>

              <div className="form-group">

                <label htmlFor="mensagem">
                  Mensagem
                </label>

                <textarea
                  id="mensagem"
                  rows="5"
                  placeholder="Digite sua mensagem..."
                  onChange={(e) => setMensagem(e.target.value)}
                  value={mensagem}
                ></textarea>

              </div>

              <button
                type="submit"
                className="enviar-btn"
                disabled={isLoading}
              >
                {isLoading ? "Enviando...": "Enviar" }
              </button>

            </form>

          </div>

        </div>

        <div className="localizacao">

          <div>

            <span className="contato-tag">
              Nossa localização
            </span>

            <h2>
              Estamos em Lages - SC
            </h2>

            <p>
              Atendemos clientes da cidade com coleta e
              entrega de roupas.
            </p>

          </div>

          <div className="mapa-placeholder">

            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3528.6958330493544!2d-50.3110588!3d-27.819132!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94e01f20f04d020d%3A0x3c35d4cced3f87ea!2sR.%20Esp%C3%ADrito%20Santo%20-%20S%C3%A3o%20Cristov%C3%A3o%2C%20Lages%20-%20SC%2C%2088509-000!5e0!3m2!1spt-BR!2sbr!4v1790608277939!5m2!1spt-BR!2sbr"
              width="600"
              height="450"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
            ></iframe>

          </div>

        </div>

      </section>

      <Footer />
    </>
  );
}

export default Contato;