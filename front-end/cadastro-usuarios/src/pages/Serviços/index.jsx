import "./style.css";
import Navbar from "../../components/navbar";
import Footer from "../../components/footer";
import { useState, useEffect } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

function Precos() {
  const [servicos, setServicos] = useState([]);
  const navigate = useNavigate();
 const [isLoading, setIsLoading] = useState(false);

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
 async function adicionarAoCarrinho(servicoId) {
  setIsLoading(true);
  try {
    const resposta = await api.post("/carrinho/itens", {
      servicoId: servicoId,
      quantidade: 1
    });

    alert("Item adicionado ao carrinho!", resposta.data);
    navigate("/carrinho");

  } catch (error) {
    alert("Erro ao adicionar ao carrinho:", error.response?.data?.message || error.message);
  } finally {
    setIsLoading(false);
  }
}
  return (
    <>
      <Navbar />

      <main className="precos-page">

        <section className="precos-header">


          <h1>
            Serviços e preços
          </h1>

          <p>
            Escolha os serviços que você precisa para suas roupas.
          </p>

        </section>

        <section className="servicos-container">

          {servicos.map((servico) => (

            <div className="servico-card" key={servico.id}>

              <div className="servico-icon">
                🧺
              </div>

              <h2>
                {servico.nome}
              </h2>

              <p>
                {servico.descricao}
              </p>

              <div className="servico-preco">

                <strong>
                  R$ {servico.preco.toFixed(2).replace(".", ",")}
                </strong>

                <span>
                  /serviço
                </span>

              </div>

              <button className="adicionar-btn" onClick={() => adicionarAoCarrinho(servico.id)}
                disabled={isLoading}>
                {isLoading ? "Adicionando..." : "Adicionar ao carrinho"}
              </button>

            </div>

          ))}

        </section>

      </main>

      <Footer />
    </>
  );
}

export default Precos;