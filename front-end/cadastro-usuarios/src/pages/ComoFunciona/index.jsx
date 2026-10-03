import "./style.css";
import Footer  from "../../components/footer";
import Navbar from "../../components/navbar";

function ComoFunciona() {
  return (
    <>
    <Navbar/>
    <section className="como-funciona">

      <div className="como-header">
        <span className="tag">Como funciona?</span>

        <h2>
          Simples, rápido e sem complicação
        </h2>

        <p>
          Cuidamos de todo o processo para você não precisar se preocupar.
        </p>
      </div>

      <div className="etapas">

        <div className="etapa">
          <div className="etapa-numero">1</div>

          <div className="etapa-icon">📅</div>

          <h3>Agende a coleta</h3>

          <p>
            Escolha os serviços que deseja e agende o melhor dia e horário
            para buscarmos suas roupas.
          </p>
        </div>


        <div className="etapa">
          <div className="etapa-numero">2</div>

          <div className="etapa-icon">🚚</div>

          <h3>Coletamos suas roupas</h3>

          <p>
            Nossa equipe vai até o endereço informado para retirar suas
            roupas com segurança.
          </p>
        </div>


        <div className="etapa">
          <div className="etapa-numero">3</div>

          <div className="etapa-icon">🧺</div>

          <h3>Lavamos e cuidamos</h3>

          <p>
            Suas roupas passam pelo processo adequado de lavagem e cuidado
            conforme o serviço escolhido.
          </p>
        </div>


        <div className="etapa">
          <div className="etapa-numero">4</div>

          <div className="etapa-icon">🏠</div>

          <h3>Entregamos na sua casa</h3>

          <p>
            Depois de prontas, suas roupas são dobradas e entregues
            diretamente no endereço cadastrado.
          </p>
        </div>

      </div>

    </section>
    <Footer/>
    </>
  );
}

export default ComoFunciona;