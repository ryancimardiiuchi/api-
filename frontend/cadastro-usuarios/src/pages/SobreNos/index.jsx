import "./style.css";
import Footer from "../../components/footer";
import Navbar from "../../components/navbar";
import { Link } from "react-router-dom";
function SobreNos() {
  return (
    <>
    <Navbar/>
    <section className="sobre">

      <div className="sobre-container">

        <div className="sobre-content">

          <span className="sobre-tag">
            Sobre a Lavô+
          </span>

          <h1>
            Cuidamos das suas roupas
            <span> como se fossem nossas.</span>
          </h1>

          <p className="sobre-intro">
            A Lavô+ nasceu para tornar o cuidado com as roupas
            mais simples, rápido e prático para você.
          </p>

          <p>
            Oferecemos serviços de lavagem, passadoria e cuidados
            especiais, com coleta e entrega diretamente na sua casa.
            Assim, você economiza tempo e pode deixar o cuidado
            das suas roupas com quem entende.
          </p>

          <p>
            Nosso objetivo é oferecer praticidade, qualidade e
            segurança em cada etapa do serviço.
          </p>

          <Link to={"/servicos"}><button className="sobre-btn">
            Conheça nossos serviços
          </button></Link>

        </div>

        <div className="sobre-image">

          <div className="sobre-card">

            <div className="sobre-icon">
              🧺
            </div>

            <h3>
              Lavô+
            </h3>

            <p>
              Cuidado e praticidade para suas roupas.
            </p>

          </div>

        </div>

      </div>


      {/* DIFERENCIAIS */}
      <div className="diferenciais">

        <div className="diferenciais-header">

          <span className="sobre-tag">
            Por que escolher a Lavô+?
          </span>

          <h2>
            Mais praticidade para sua rotina
          </h2>

        </div>


        <div className="diferenciais-grid">

          <div className="diferencial">

            <div className="diferencial-icon">
              🧺
            </div>

            <h3>
              Qualidade
            </h3>

            <p>
              Cuidamos de cada peça utilizando processos
              adequados para cada tipo de roupa.
            </p>

          </div>


          <div className="diferencial">

            <div className="diferencial-icon">
              🚚
            </div>

            <h3>
              Coleta e entrega
            </h3>

            <p>
              Buscamos suas roupas e entregamos tudo
              diretamente na sua casa.
            </p>

          </div>


          <div className="diferencial">

            <div className="diferencial-icon">
              ⏰
            </div>

            <h3>
              Praticidade
            </h3>

            <p>
              Você escolhe o serviço e agenda a coleta
              sem precisar sair de casa.
            </p>

          </div>


          <div className="diferencial">

            <div className="diferencial-icon">
              ❤️
            </div>

            <h3>
              Cuidado
            </h3>

            <p>
              Tratamos suas roupas com atenção em
              todas as etapas do processo.
            </p>

          </div>

        </div>

      </div>

    </section>
    <Footer/>
    </>
  );
}

export default SobreNos;