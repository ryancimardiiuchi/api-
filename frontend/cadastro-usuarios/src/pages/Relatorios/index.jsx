import "./style.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useEffect, useState } from "react";
import api from "../../services/api";
import { Link } from "react-router-dom";

function Relatorios() {
    const [financeiro, setFinanceiro] = useState({
        quantidadePedidos: 0,
        faturamentoTotal: 0,
        faturamentoPorMes: []
    });

    const [carregando, setCarregando] = useState(true);

     useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      if (payload.role !== "admin") {
        window.location.href = "/ch";
      }
    } catch (erro) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      console.log(erro)
    }
  }, []);
  
    useEffect(() => {
        async function carregarFinanceiro() {
            try {
                const resposta = await api.get("/financeiro");

                console.log("Dados financeiros:", resposta.data);

                setFinanceiro(resposta.data);

            } catch (erro) {
                console.error(
                    "Erro ao carregar relatório:",
                    erro
                );
            } finally {
                setCarregando(false);
            }
        }

        carregarFinanceiro();
    }, []);

    async function baixarExcel() {
        try {
            const resposta = await api.get("/financeiro/excel", {
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(
                new Blob([resposta.data])
            );
            const link = document.createElement("a");
            link.href = url;
            link.download = "financeiro.xlsx";
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        } catch (erro) {
            console.error("Erro ao baixar relatório financeiro:", erro);
            window.alert("Não foi possível baixar o relatório financeiro.");
        }
    }

    // Descobre o maior faturamento
    const maiorValor =
        financeiro.faturamentoPorMes.length > 0
            ? Math.max(
                ...financeiro.faturamentoPorMes.map(
                    (item) => item.valor
                )
            )
            : 0;

    return (
        <div className="relatorios-page">

            {/* CABEÇALHO */}
            <div className="relatorios-topo">

                <Link
                    to="/admin"
                    className="btn-voltar"
                    title="Voltar para o painel"
                >
                    <i className="bi bi-arrow-left"></i>
                </Link>

                <div>
                    <h1>Financeiro</h1>

                    <p>
                        Acompanhe o desempenho financeiro da Lavô+
                    </p>
                </div>

            </div>

            {carregando ? (

                <div className="carregando">
                    Carregando informações...
                </div>

            ) : (

                <>

                    {/* CARDS */}
                    <div className="financeiro-cards">

                        <div className="financeiro-card">

                            <div className="financeiro-icon">
                                <i className="bi bi-cash-stack"></i>
                            </div>

                            <div>
                                <span>Faturamento</span>

                                <h2>
                                    R${" "}
                                    {financeiro.faturamentoTotal.toFixed(2)}
                                </h2>
                            </div>

                        </div>


                        <div className="financeiro-card">

                            <div className="financeiro-icon">
                                <i className="bi bi-bag-check"></i>
                            </div>

                            <div>
                                <span>Pedidos</span>

                                <h2>
                                    {financeiro.quantidadePedidos}
                                </h2>
                            </div>

                        </div>


                        <div className="financeiro-card">

                            <div className="financeiro-icon">
                                <i className="bi bi-box-seam"></i>
                            </div>

                            <div>
                                <span>Serviços</span>

                                <h2>
                                    0
                                </h2>
                            </div>

                        </div>

                    </div>


                    {/* GRÁFICO */}
                    <div className="grafico-card">

                        <div className="grafico-header">

                            <div>

                                <h2>
                                    Faturamento por mês
                                </h2>

                                <p>
                                    Evolução do faturamento da Lavô+
                                </p>

                            </div>

                            <div className="grafico-legenda">

                                <span></span>

                                Faturamento

                            </div>

                        </div>


                        <div className="grafico">

                            {financeiro.faturamentoPorMes.length === 0 ? (

                                <div className="grafico-vazio">

                                    Ainda não existem dados
                                    suficientes para montar o gráfico.

                                </div>

                            ) : (

                                financeiro.faturamentoPorMes.map(
                                    (item) => {

                                        const altura =
                                            maiorValor > 0
                                                ? (item.valor / maiorValor) * 200
                                                : 10;

                                        return (

                                            <div
                                                className="grafico-coluna"
                                                key={`${item.ano}-${item.mes}`}
                                            >

                                                <div
                                                    className="barra-faturamento"
                                                    style={{
                                                        height: `${Math.max(
                                                            altura,
                                                            10
                                                        )}px`
                                                    }}
                                                    title={`R$ ${item.valor.toFixed(
                                                        2
                                                    )}`}
                                                >

                                                    <strong>
                                                        R${" "}
                                                        {item.valor.toFixed(0)}
                                                    </strong>

                                                </div>

                                                <span>
                                                    {item.mes}
                                                </span>

                                                <small>
                                                    {item.ano}
                                                </small>

                                            </div>

                                        );
                                    }
                                )

                            )}

                        </div>

                    </div>


                    {/* EXCEL */}
                    <div className="excel-area">

                        <button
                            className="btn-excel"
                            onClick={baixarExcel}
                            title="Baixar relatório Excel"
                        >
                            <i className="bi bi-file-earmark-excel"></i>
                        </button>

                    </div>

                </>

            )}

        </div>
    );
}

export default Relatorios;