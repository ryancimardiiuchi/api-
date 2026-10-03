import { Routes, Route } from "react-router-dom";
import Cadastro from "../pages/Cadastro";
import VerificarEmail from "../pages/Verificacao";
import Login from "../pages/Login";
import Principal from "../pages/Home";
import Carrinho from "../pages/Cart";
import Sobre from "../pages/SobreNos";
import ComoFunciona from "../pages/ComoFunciona";
import Contato from "../pages/Contato";
import Precos from "../pages/Serviços";
import NovaSenha from "../pages/NovaSenha";
import Admin from "../pages/Administração";
import AdminNovoServico from "../pages/NovoServico";
import EsqueceuSenha from "../pages/EsqueceuSenha";
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Principal />} />

      <Route path="/cadastro" element={<Cadastro />} />

      <Route path="/verificar-email" element={<VerificarEmail />} />

      <Route path="/login" element={<Login />} />

      <Route path="/principal" element={<Principal />} />

      <Route path="/servicos" element={<Precos />} />

      <Route path="/carrinho" element={<Carrinho />} />

      <Route path="/sobrenos" element={<Sobre />} />

      <Route path="/comofunciona" element={<ComoFunciona />} />

      <Route path="/contato" element={<Contato />} />
      <Route path="/novasenha" element={<NovaSenha />} />
      <Route path="/admin" element={<Admin />} />
       <Route path="/novoservico" element={<AdminNovoServico />} />
       <Route path="/esqueceusenha" element={<EsqueceuSenha />} />
    </Routes>
  );
}

export default AppRoutes;
