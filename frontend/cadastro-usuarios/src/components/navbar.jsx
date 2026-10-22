import { useEffect, useState } from "react";
import "./navbar.css";
import { Link } from "react-router-dom";
import Lavo from "../assets/img/logo.png";
import Cart from "../assets/icon/cart.png"
import logout from "../assets/icon/sair.png"
function Navbar() {
  const [usuario, setUsuario] = useState(null);
  const [Sair, setSair] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUsuario(null);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      setUsuario(payload);
    } catch (erro) {
      console.error("Token inválido:", erro);
      setUsuario(null);
    }
  }, []);
  function sair() {
    localStorage.removeItem("token");
    window.location.href = "/";
  }
  return (
    <>
      <header className="site-header">
        <nav className="navbar">
          <Link to="/principal" className="logo">
            <div className="logo-icon">
              <img src={Lavo} alt="Lavô+" />
            </div>

            <div className="logo-text">
              <h2>Lavô+</h2>
              <span>Lavanderia Online</span>
            </div>
          </Link>

          <Link className="links" to="/">
            Inicio
          </Link>

          <Link className="links" to="/servicos">
            Serviços
          </Link>

          <Link className="links" to="/comofunciona">
            Como funciona
          </Link>

          <Link className="links" to="/sobrenos">
            Sobre Nós
          </Link>

          <Link className="links" to="/contato">
            Contato
          </Link>

        {usuario ? (
  <div
    className="perfil-navbar"
    onClick={() => setSair(!Sair)}
  >
    <div className="perfil-foto">
      {usuario.name?.charAt(0).toUpperCase()}
    </div>

    <span>{usuario.name}</span>

    {Sair && (
      <div className="perfil-menu">
        <button className="btn-perfil"onClick={sair}>
          <img src={logout} alt="Sair" /> 
        </button>
      </div>
    )}
  </div>
          ) : (
            <Link to="/login">
              <button className="btn-login">Entrar</button>
            </Link>
          )}

          <Link to="/carrinho">
            <button className="btn-carrinho">
              <img src={Cart} alt="Cart" />Carrinho</button>
          </Link>
        </nav>
      </header>
    </>
  );
}

export default Navbar;
