import "./style.css";
import { useState } from "react";

function AdminNovoServico() {

    const [servico, setServico] = useState({
        nome: "",
        preco: "",
        descricao: ""
    });

    const [gerandoDescricao, setGerandoDescricao] = useState(false);

    function alterarCampo(event) {

        const { name, value } = event.target;

        setServico({
            ...servico,
            [name]: value
        });
    }

    function gerarDescricaoIA() {

        if (!servico.nome) {
            return;
        }

        setGerandoDescricao(true);

        // SIMULAÇÃO DO GEMINI
        // Depois colocaremos sua função real aqui.

        setTimeout(() => {

            setServico({
                ...servico,
                descricao:
                    `Serviço de ${servico.nome.toLowerCase()} realizado com cuidado e produtos de alta qualidade, garantindo um excelente resultado e o cuidado especial que suas peças merecem.`
            });

            setGerandoDescricao(false);

        }, 1000);
    }

    function cadastrarServico(event) {

        event.preventDefault();

        console.log("Serviço cadastrado:");
        console.log(servico);

        // Depois:
        // api.post("/servicos", servico)

        alert("Serviço cadastrado com sucesso!");

        setServico({
            nome: "",
            preco: "",
            descricao: ""
        });
    }

    function cancelar() {

        setServico({
            nome: "",
            preco: "",
            descricao: ""
        });
    }

    return (

        <div className="admin-page">

            {/* =========================
                SIDEBAR
            ========================= */}

            <aside className="sidebar">

                <div className="logo">

                    <div className="logo-icon">
                        ♧
                    </div>

                    <div>
                        <strong>
                            Lavô<span>+</span>
                        </strong>

                        <small>
                            Lavanderia inteligente
                        </small>
                    </div>

                </div>

                <nav>

                    <button className="menu-item">
                        📊
                        Dashboard
                    </button>

                    <button className="menu-item">
                        📦
                        Pedidos
                    </button>

                    <button className="menu-item active">
                        🧺
                        Serviços
                    </button>

                    <button className="menu-item">
                        👥
                        Clientes
                    </button>

                    <button className="menu-item">
                        💬
                        Mensagens

                        <span className="notification">
                            3
                        </span>
                    </button>

                    <div className="menu-separator"></div>

                    <button className="menu-item">
                        📈
                        Relatórios
                    </button>

                    <button className="menu-item">
                        ⚙️
                        Configurações
                    </button>

                </nav>

                <div className="sidebar-bottom">

                    <div className="admin-user">

                        <div className="admin-avatar">
                            R
                        </div>

                        <div>
                            <strong>
                                Ryan Cimardi
                            </strong>

                            <span>
                                Administrador
                            </span>
                        </div>

                    </div>

                    <button className="logout">
                        ⇥ Sair
                    </button>

                </div>

            </aside>


            {/* =========================
                CONTEÚDO
            ========================= */}

            <main className="admin-content">

                {/* TOPBAR */}

                <header className="topbar">

                    <button className="mobile-menu">
                        ☰
                    </button>

                    <div className="search">

                        🔎

                        <input
                            placeholder="Buscar por pedidos, clientes ou serviços..."
                        />

                    </div>

                    <div className="topbar-right">

                        <button className="notification-button">
                            🔔
                            <span>3</span>
                        </button>

                        <div className="profile">

                            <div className="profile-avatar">
                                R
                            </div>

                            <div>
                                <strong>
                                    Ryan Cimardi
                                </strong>

                                <small>
                                    Administrador
                                </small>
                            </div>

                            <span>
                                ⌄
                            </span>

                        </div>

                    </div>

                </header>


                {/* =========================
                    CONTEÚDO DA PÁGINA
                ========================= */}

                <section className="page-container">

                    {/* CAMINHO */}

                    <div className="breadcrumb">

                        <span>
                            Serviços
                        </span>

                        <b>
                            /
                        </b>

                        <strong>
                            Novo serviço
                        </strong>

                    </div>


                    {/* TÍTULO */}

                    <div className="page-title">

                        <div>

                            <h1>
                                Cadastrar novo serviço
                            </h1>

                            <p>
                                Adicione um novo serviço que estará disponível para seus clientes.
                            </p>

                        </div>

                    </div>


                    {/* =========================
                        FORMULÁRIO
                    ========================= */}

                    <div className="form-layout">


                        {/* CARD PRINCIPAL */}

                        <form
                            className="service-form"
                            onSubmit={cadastrarServico}
                        >

                            <div className="form-header">

                                <div className="form-icon">
                                    🧺
                                </div>

                                <div>

                                    <h2>
                                        Informações do serviço
                                    </h2>

                                    <p>
                                        Preencha os dados abaixo.
                                    </p>

                                </div>

                            </div>


                            {/* NOME */}

                            <div className="form-group">

                                <label>
                                    Nome do serviço
                                </label>

                                <span className="field-description">
                                    Como o serviço será exibido para o cliente.
                                </span>

                                <input
                                    type="text"
                                    name="nome"
                                    value={servico.nome}
                                    onChange={alterarCampo}
                                    placeholder="Ex: Lavagem de roupas"
                                    required
                                />

                            </div>


                            {/* PREÇO */}

                            <div className="form-group">

                                <label>
                                    Preço
                                </label>

                                <span className="field-description">
                                    Informe o valor cobrado pelo serviço.
                                </span>

                                <div className="price-input">

                                    <span>
                                        R$
                                    </span>

                                    <input
                                        type="number"
                                        name="preco"
                                        value={servico.preco}
                                        onChange={alterarCampo}
                                        placeholder="15,00"
                                        step="0.01"
                                        min="0"
                                        required
                                    />

                                </div>

                            </div>


                            {/* DESCRIÇÃO */}

                            <div className="form-group">

                                <div className="description-header">

                                    <div>

                                        <label>
                                            Descrição
                                        </label>

                                        <span className="field-description">
                                            Explique para o cliente o que está incluso.
                                        </span>

                                    </div>

                                    <button
                                        type="button"
                                        className="gemini-button"
                                        onClick={gerarDescricaoIA}
                                        disabled={
                                            gerandoDescricao ||
                                            !servico.nome
                                        }
                                    >

                                        <span className="gemini-icon">
                                            ✦
                                        </span>

                                        {gerandoDescricao
                                            ? "Gerando..."
                                            : "Gerar com IA"
                                        }

                                    </button>

                                </div>


                                <div className="textarea-wrapper">

                                    <textarea
                                        name="descricao"
                                        value={servico.descricao}
                                        onChange={alterarCampo}
                                        placeholder="Digite uma descrição para o serviço ou utilize a IA para gerar uma automaticamente..."
                                        maxLength="300"
                                        required
                                    />

                                    <span className="character-count">
                                        {servico.descricao.length}/300
                                    </span>

                                </div>

                                <div className="ai-tip">

                                    <span>
                                        ✦
                                    </span>

                                    <p>
                                        <strong>
                                            Dica:
                                        </strong>{" "}
                                        informe o nome do serviço primeiro e clique em
                                        <strong> Gerar com IA</strong> para criar uma descrição automaticamente.
                                    </p>

                                </div>

                            </div>


                            {/* PREVISUALIZAÇÃO */}

                            <div className="preview">

                                <div className="preview-header">

                                    <span>
                                        Pré-visualização
                                    </span>

                                    <small>
                                        Como o cliente verá
                                    </small>

                                </div>

                                <div className="preview-card">

                                    <div className="preview-image">
                                        🧺
                                    </div>

                                    <div className="preview-content">

                                        <h3>
                                            {servico.nome ||
                                                "Nome do serviço"}
                                        </h3>

                                        <p>
                                            {servico.descricao ||
                                                "A descrição do serviço aparecerá aqui."}
                                        </p>

                                        <strong>
                                            R$ {servico.preco
                                                ? Number(servico.preco)
                                                    .toFixed(2)
                                                    .replace(".", ",")
                                                : "0,00"}
                                        </strong>

                                    </div>

                                </div>

                            </div>


                            {/* BOTÕES */}

                            <div className="form-actions">

                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={cancelar}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="save-button"
                                >
                                    ✓ Cadastrar serviço
                                </button>

                            </div>

                        </form>


                        {/* =========================
                            LADO DIREITO
                        ========================= */}

                        <aside className="side-info">


                            {/* CARD IA */}

                            <div className="ai-card">

                                <div className="ai-card-icon">
                                    ✦
                                </div>

                                <h3>
                                    Crie com inteligência
                                </h3>

                                <p>
                                    Deixe a IA criar uma descrição profissional
                                    para o seu serviço em poucos segundos.
                                </p>

                                <div className="ai-example">

                                    <span>
                                        ✦
                                    </span>

                                    <div>

                                        <strong>
                                            Exemplo
                                        </strong>

                                        <p>
                                            "Lavagem completa com produtos
                                            de alta qualidade para deixar
                                            suas roupas limpas e cuidadas."
                                        </p>

                                    </div>

                                </div>

                            </div>


                            {/* DICAS */}

                            <div className="tips-card">

                                <h3>
                                    💡 Dicas
                                </h3>

                                <div className="tip">

                                    <span>
                                        01
                                    </span>

                                    <p>
                                        Use um nome simples e fácil de entender.
                                    </p>

                                </div>

                                <div className="tip">

                                    <span>
                                        02
                                    </span>

                                    <p>
                                        Informe claramente o que está incluso no serviço.
                                    </p>

                                </div>

                                <div className="tip">

                                    <span>
                                        03
                                    </span>

                                    <p>
                                        Você pode editar a descrição gerada pela IA.
                                    </p>

                                </div>

                            </div>


                            {/* SEGURANÇA */}

                            <div className="security-card">

                                <span>
                                    🔒
                                </span>

                                <div>

                                    <strong>
                                        Seus dados estão seguros
                                    </strong>

                                    <p>
                                        As informações serão salvas somente
                                        após você confirmar o cadastro.
                                    </p>

                                </div>

                            </div>

                        </aside>

                    </div>

                </section>

            </main>

        </div>
    );
}

export default AdminNovoServico;