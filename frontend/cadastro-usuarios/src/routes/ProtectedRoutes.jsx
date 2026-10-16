import { Navigate } from "react-router-dom";

function ProtectedRoutes ({isAuth , carregando , children}){
    if(carregando){
        return <div>Verificando autenticação..</div>
    }
    if(!isAuth){
        return <Navigate to="/login" replace />
    }
    return children;
}
export default ProtectedRoutes