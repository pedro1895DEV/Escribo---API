const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const horaLocal = { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" };

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ message: "Não autorizado" });

    jwt.verify(token, process.env.JWT, (err, user) => {
        if (err) return res.status(403).json({ message: "Sessão inválida" });
        req.user = user.nome;
        next();
    });
}

router.get("/:id", authenticateToken, async function (req, res) {
    try {
        const users = await prisma.user.findUnique({
            where: {
                id: req.params.id
            },
            select: {
                id: true,
                nome: true,
                email: true,
                telefones: true,
                data_criacao: true,
                data_atualizacao: true,
                ultimo_login: true
            }
        });

        users.data_criacao = new Date(users.data_criacao).toLocaleString("pt-BR", horaLocal).replace(/\//g, "-");
        users.data_atualizacao = new Date(users.data_atualizacao).toLocaleString("pt-BR", horaLocal).replace(/\//g, "-");
        users.ultimo_login = new Date(users.ultimo_login).toLocaleString("pt-BR", horaLocal).replace(/\//g, "-");

        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Ocorreu um erro ao buscar os usuários", error: error.toString() });
    }
});

module.exports = router;
