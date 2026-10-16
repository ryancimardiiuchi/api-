import { PrismaClient } from "./generated/prisma/index.js";

const prisma = new PrismaClient();

export async function salvarEnderecoColeta(req, res) {
    const texto = (valor) => typeof valor === "string" ? valor.trim() : "";
    const enderecoCompleto = texto(req.body?.endereco);
    const coordenadasInformadas =
        req.body?.lat !== undefined &&
        req.body?.lat !== null &&
        req.body?.lat !== "" &&
        req.body?.lng !== undefined &&
        req.body?.lng !== null &&
        req.body?.lng !== "";
    const latitude = coordenadasInformadas ? Number(req.body.lat) : null;
    const longitude = coordenadasInformadas ? Number(req.body.lng) : null;

    if (
        !enderecoCompleto ||
        (coordenadasInformadas &&
            (!Number.isFinite(latitude) ||
                latitude < -90 ||
                latitude > 90 ||
                !Number.isFinite(longitude) ||
                longitude < -180 ||
                longitude > 180)) ||
        ((req.body?.lat == null) !== (req.body?.lng == null))
    ) {
        return res.status(400).json({
            erro: "Informe um endereço válido antes de continuar."
        });
    }

    try {
        const existente = await prisma.endereco.findFirst({
            where: {
                UserId: req.usuario.id,
                rua: enderecoCompleto,
            },
        });

        if (existente) {
            return res.status(200).json({
                ...existente,
                enderecoCompleto,
                endereco: enderecoCompleto,
                ...(coordenadasInformadas ? { lat: latitude, lng: longitude } : {}),
            });
        }

        const endereco = await prisma.endereco.create({
            data: {
                UserId: req.usuario.id,
                rua: enderecoCompleto,
                numero: texto(req.body.numero) || "S/N",
                bairro: texto(req.body.bairro),
                cep: texto(req.body.cep),
            },
        });

        return res.status(201).json({
            ...endereco,
            enderecoCompleto,
            endereco: enderecoCompleto,
            ...(coordenadasInformadas ? { lat: latitude, lng: longitude } : {}),
        });
    } catch (error) {
        console.error("Erro ao salvar endereço de coleta:", error);
        return res.status(500).json({
            erro: "Não foi possível salvar o endereço de coleta."
        });
    }
}
