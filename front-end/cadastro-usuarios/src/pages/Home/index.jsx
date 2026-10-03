import "./style.css";
import Navbar from "../../components/navbar";
import Footer from "../../components/footer";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../../services/api";

function Principal() {
  const [servicos, setServicos] = useState([]);

  useEffect(() => {
    async function buscarServicos() {
      try {
        const resposta = await api.get("/servicos");

        setServicos(resposta.data);
      } catch (error) {
        console.log("Erro ao buscar serviços:", error);
      }
    }

    buscarServicos();
  }, []);


  return (
    <>
      <Navbar />

      <main>

        <section className="hero" id="inicio">
          <div className="hero-content">

            <span className="tag">
              🚚 Coleta e entrega na sua cidade
            </span>

            <h1>
              Roupa limpa sem
              <span>você precisar sair de casa</span>
            </h1>

            <p>
              Buscamos suas roupas, lavamos com carinho e entregamos tudo
              limpo e cheiroso na sua porta.
            </p>

            <div className="hero-buttons">

              <a href="coleta.html">
                <button className="primary-btn">
                  📅 Agendar coleta
                </button>
              </a>

              <Link to="/servicos">
                <button className="secondary-btn">
                  🏷️ Ver preços
                </button>
              </Link>

            </div>

            <div className="hero-benefits">

              <div className="benefit">
                <div className="benefit-icon">📅</div>

                <div>
                  <h4>Coleta agendada</h4>
                  <p>No dia e horário que preferir</p>
                </div>
              </div>

              <div className="benefit">
                <div className="benefit-icon">👤</div>

                <div>
                  <h4>Profissionais</h4>
                  <p>Cuidado especial com suas roupas</p>
                </div>
              </div>

              <div className="benefit">
                <div className="benefit-icon">🚚</div>

                <div>
                  <h4>Entrega rápida</h4>
                  <p>Roupas limpas e dobradas</p>
                </div>
              </div>

            </div>

          </div>

          <div className="hero-image">

            <div className="customer-badge">
              <strong>+10 mil</strong>
              <span>clientes satisfeitos</span>
            </div>

            <div className="laundry-image">
              🧺
            </div>

          </div>
        </section>

        <section className="section" id="servicos">

          <div className="section-title">
            <h2>Nossos serviços</h2>
            <div className="line"></div>
          </div>

          <div className="services">

            {servicos.map((servico) => (

              <div className="service" key={servico.id}>

                <div className="service-icon">
                  🧺
                </div>

                <h3>
                  {servico.nome}
                </h3>

                <p>
                  {servico.descricao}
                </p>

                <span className="price">
                  R$ {Number(servico.preco).toFixed(2).replace(".", ",")}
                </span>

              </div>

            ))}

          </div>

        </section>
        <section className="section" id="como-funciona">

          <div className="section-title">
            <h2>Como funciona?</h2>
            <div className="line"></div>
          </div>

          <div className="how">

            <div className="step">
              <div className="step-icon">📅</div>

              <h3>1. Agende</h3>

              <p>
                Escolha o serviço, data e horário da coleta.
              </p>
            </div>

            <div className="step">
              <div className="step-icon">🚚</div>

              <h3>2. Coletamos</h3>

              <p>
                Buscamos suas roupas no endereço escolhido.
              </p>
            </div>

            <div className="step">
              <div className="step-icon">🧺</div>

              <h3>3. Lavamos</h3>

              <p>
                Cuidamos de tudo com produtos de qualidade.
              </p>
            </div>

            <div className="step">
              <div className="step-icon">🏠</div>

              <h3>4. Entregamos</h3>

              <p>
                Entregamos suas roupas limpas e dobradas.
              </p>
            </div>

          </div>

        </section>


        {/* ACOMPANHAMENTO */}
        <section
          className="tracking-section"
          id="acompanhamento"
        >

          <div className="tracking">

            <div className="tracking-header">

              <div>
                <h2>Acompanhe seu pedido</h2>
                <p>Pedido #1024</p>
              </div>

              <a href="#">
                Ver detalhes →
              </a>

            </div>


            <div className="timeline">

              <div className="status active">

                <div className="status-circle">
                  ✓
                </div>

                <strong>Coletado</strong>

                <span>
                  22/08 - 10:00
                </span>

              </div>


              <div className="status active">

                <div className="status-circle">
                  🧺
                </div>

                <strong>Lavando</strong>

                <span>
                  22/08 - 11:30e
                </span>

              </div>


              <div className="status">

                <div className="status-circle">
                  👔
                </div>

                <strong>Passando</strong>

                <span>
                  Aguardando
                </span>

              </div>


              <div className="status">

                <div className="status-circle">
                  🚚
                </div>

                <strong>A caminho</strong>

                <span>
                  Aguardando
                </span>

              </div>


              <div className="status">

                <div className="status-circle">
                  🏠
                </div>

                <strong>Entregue</strong>

                <span>
                  Aguardando
                </span>

              </div>

            </div>


            <div className="current-status">

              <strong>Status atual:</strong>

              Suas roupas estão sendo lavadas com muito carinho!

            </div>


            <p className="delivery">

              Previsão de entrega:

              <strong>
                Hoje, 18:30
              </strong>

            </p>

          </div>

        </section>


        {/* SOBRE */}
        <section className="about" id="sobre">

          <div>

            <span className="tag">
              Sobre a Lavô+
            </span>

            <h2>
              Cuidamos das suas roupas como se fossem nossas.
            </h2>

            <p>
              Nossa missão é tornar sua rotina mais prática,
              oferecendo lavagem, passadoria, coleta e entrega
              com qualidade e segurança.
            </p>

            <Link to={"/sobrenos"}><button className="primary-btn">
              Conheça nossa história
            </button></Link>

          </div>

        </section>

      </main>

      <Footer />
    </>
  );
}

export default Principal;