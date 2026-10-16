
import "./style.css";
import Footer from "../../components/footer";
import Navbar from "../../components/navbar";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api.js";
import { useState, useEffect } from "react";

function Carrinho() {

    const navigate = useNavigate();

    const [carrinho, setCarrinho] = useState(null);
    const [pedidoAtual, setPedidoAtual] = useState(null);
    const [erroPedido, setErroPedido] = useState("");

    useEffect(() => {

        async function buscarCarrinho() {

            try {

                const token = localStorage.getItem("token");

                const resposta = await api.get("/carrinho", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                setCarrinho(resposta.data);

            } catch (error) {

                console.log("Erro ao buscar carrinho:");
                console.log(error);

            }

        }

        async function buscarPedidoAtual() {
            try {
                const resposta = await api.get("/api/pedidos/meu");
                setPedidoAtual(resposta.data.pedido);
            } catch (error) {
                if (error.response?.status !== 404) {
                    console.error("Erro ao buscar pedido para acompanhamento:", error);
                    setErroPedido(
                        error.response?.data?.erro ||
                        "Não foi possível verificar seus pedidos."
                    );
                }
            }
        }

        buscarCarrinho();
        buscarPedidoAtual();

    }, []);



    const itens = carrinho?.itens || [];


   
    const subtotal = itens.reduce((total, item) => {

        return total + (item.preco * item.quantidade);

    }, 0);

    const taxaColeta = 5;

    const total = subtotal + taxaColeta;


    function continuarPedido() {
        navigate("/agendarcoleta");
    }

    async function removerItem(itemId) {
        try {
            await api.delete(`/carrinho/itens/${itemId}`);
            setCarrinho((prevCarrinho) => ({
                ...prevCarrinho,
                itens: prevCarrinho.itens.filter((item) => item.id !== itemId),
            }));
        } catch (error) {
            alert("Erro ao remover item do carrinho:", error.response?.data?.message || error.message);
        }
    }


    return (
        <>
            <Navbar />

            <main className="cart-page">

                <div className="cart-container">

                    <div className="page-title">


                        <h1>
                            Meu pedido
                        </h1>

                        <p>
                            Confira os serviços escolhidos antes de continuar.
                        </p>

                    </div>


                  

                    <div className="cart-layout">


                      
                        <section className="cart-items">

                            <div className="cart-header">

                                <h2>
                                    Serviços selecionados
                                </h2>

                                <span>
                                    {itens.length}{" "}
                                    {itens.length === 1 ? "item" : "itens"}
                                </span>

                            </div>


                    

                            {itens.map((item) => (

                                <div
                                    className="cart-item"
                                    key={item.id}
                                >

                                    <div className="item-icon">
                                        🧺
                                    </div>


                                    <div className="item-info">

                                        <h3>
                                            {item.servico?.nome || "Serviço"}
                                        </h3>

                                        <p>
                                            {item.servico?.descricao || ""}
                                        </p>

                                        <span className="item-quantity">
                                            Quantidade: {item.quantidade}
                                        </span>

                                    </div>


                                    <div className="item-price">

                                        R${" "}
                                        {(item.preco * item.quantidade)
                                            .toFixed(2)
                                            .replace(".", ",")}

                                    </div>


                                    <button
                                        className="remove-btn"
                                        type="button"
                                        onClick={() => removerItem(item.id)}
                                    >
                                        ×
                                    </button>

                                </div>

                            ))}


                        

                            <Link
                                to="/servicos"
                                className="add-more"
                            >
                                + Adicionar outro serviço
                            </Link>

                        </section>


                   

                        <aside className="order-summary">

                            <h2>
                                Resumo do pedido
                            </h2>


                            <div className="summary-line">

                                <span>
                                    Subtotal
                                </span>

                                <strong>
                                    R${" "}
                                    {subtotal
                                        .toFixed(2)
                                        .replace(".", ",")}
                                </strong>

                            </div>


                            <div className="summary-line">

                                <span>
                                    Taxa de coleta
                                </span>

                                <strong>
                                    R${" "}
                                    {taxaColeta
                                        .toFixed(2)
                                        .replace(".", ",")}
                                </strong>

                            </div>


                            <div className="divider"></div>


                            <div className="total">

                                <span>
                                    Total
                                </span>

                                <strong>
                                    R${" "}
                                    {total
                                        .toFixed(2)
                                        .replace(".", ",")}
                                </strong>

                            </div>


                            <button
                                className="continue-btn"
                                onClick={continuarPedido}
                                disabled={itens.length === 0}
                            >
                                CONTINUAR
                                <span>→</span>
                            </button>


                            <p className="secure">
                                🔒 Pagamento seguro
                            </p>

                            {pedidoAtual && (
                                <button
                                    className="track-order-btn"
                                    type="button"
                                    onClick={() => navigate("/chatcliente")}
                                >
                                    Acompanhar pedido
                                    <span>→</span>
                                </button>
                            )}

                            {erroPedido && (
                                <p className="cart-order-error" role="alert">
                                    {erroPedido}
                                </p>
                            )}

                        </aside>

                    </div>


           

                    <div className="cart-benefits">

                        <div>

                            <span>
                                🚚
                            </span>

                            <div>

                                <strong>
                                    Coleta na sua casa
                                </strong>

                                <p>
                                    Escolha o melhor horário
                                </p>

                            </div>

                        </div>


                        <div>

                            <span>
                                🧺
                            </span>

                            <div>

                                <strong>
                                    Cuidado especial
                                </strong>

                                <p>
                                    Tratamos suas roupas com carinho
                                </p>

                            </div>

                        </div>


                        <div>

                            <span>
                                🏠
                            </span>

                            <div>

                                <strong>
                                    Entrega na sua porta
                                </strong>

                                <p>
                                    Receba tudo limpo e dobrado
                                </p>

                            </div>

                        </div>

                    </div>

                </div>

            </main>

            <Footer />
        </>
    );
}

export default Carrinho;
