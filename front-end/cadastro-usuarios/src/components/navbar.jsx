import { useState } from "react";
import "./navbar.css";
import { Link } from "react-router-dom";
function Navbar() {
  const [logado, setLogado] = useState(false);
  return (
    <>
      <header>
        <nav className="navbar">
          <Link to="/principal" className="logo">
            <div className="logo-icon">🧺</div>

            <div className="logo-text">
              <h2>Lavô+</h2>
              <span>Lavanderia Online</span>
            </div>
          </Link>
          <Link className="links" to={"/principal"}>
            Inicio
          </Link>
          <Link className="links" to={"/servicos"}>
            Serviços
          </Link>
          <Link className="links" to={"/comofunciona"}>
            Como funciona
          </Link>
          <Link className="links" to={"/sobrenos"}>
            Sobre Nós
          </Link>
          <Link className="links" to={"/contato"}>
            Contato
          </Link>
          {logado ? (
            <div className="perfil-navbar">
              <div className="perfil-foto">R</div>

              <span>Ryan</span>
            </div>
          ) : (
            <Link to={"/login"}>
              <button className="btn-login">Entrar</button>
            </Link>
          )}
          <Link to={"/carrinho"}>
            <button className="btn-carrinho">🛒Carrinho</button>
          </Link>
        </nav>
      </header>
    </>
  );
}
export default Navbar;
