import { GoogleGenAI } from "@google/genai";

async function gerarDescricao(req, res) {
  try {
    const { nome, preco } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({
        message: "Informe o nome do serviço"
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        message: "GEMINI_API_KEY não configurada no backend"
      });
    }

    const ia = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const prompt = `
Crie uma descrição curta, clara e objetiva para um serviço de lavanderia.

Serviço: ${nome.trim()}
Preço: ${preco ? `R$ ${preco}` : "não informado"}

Regras:
- Use no máximo 2 frases.
- Descreva apenas o serviço informado.
- Não invente características, benefícios, materiais, prazos ou qualquer informação que não tenha sido fornecida.
- Use linguagem simples, profissional e natural.
- Não mencione o preço na descrição.
- Retorne somente a descrição, sem título, aspas, listas ou explicações adicionais.
`;

    const resposta = await ia.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt
    });

    const descricao = resposta.text?.trim();

    if (!descricao) {
      return res.status(502).json({
        message: "A IA não retornou uma descrição"
      });
    }

    return res.json({
      descricao
    });

  } catch (error) {
    console.error("Erro na IA:", error);

    const status = error?.status || error?.statusCode || error?.code;
    const textoErro = `${error?.message || ""} ${error?.name || ""}`;

    if (
      Number(status) === 429 ||
      /429|RESOURCE_EXHAUSTED|quota/i.test(textoErro)
    ) {
      return res.status(429).json({
        codigo: 429,
        message:
          "Limite/cota da API Gemini atingido. Aguarde ou verifique sua cota."
      });
    }

    return res.status(500).json({
      codigo: 500,
      message: "Não foi possível gerar a descrição com IA"
    });
  }
}

export { gerarDescricao };