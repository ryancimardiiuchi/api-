import jwt from  "jsonwebtoken"   
export  function verificarToken(req,res,next){
    const authHeader = req.headers.authorization
    if(!authHeader?.startsWith("Bearer")){
        return res.status(401).json({
            message:"Token não informado"
        })

    }
    const token = authHeader.split(" ")[1]
    try {
        const payload = jwt.verify(token,process.env.JWT_SECRET)
        req.usuario = payload
        next()
    } catch (erro) {
        console.error(erro)
        return res.status(401).json({
            message:"Token invalido ou expirado"
        })
    }
}