const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
router.use(bodyParser.json());

const jwt = require("jsonwebtoken");

const bcrypt = require("bcrypt");
const saltRounds = 10;

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const horaLocal = { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" };

router.post("/sign-up", async (req, res) => {
    const { nome, email, senha, telefones } = req.body;
  
    if (!nome || !email || !senha || !telefones) {
        return res.status(400).json({ message: "Por favor, forneça todos os campos necessários" });
    }
  
    const usuarioExistente = await prisma.user.findUnique({
        where: {
            email: email
        }
    });
  
    if (usuarioExistente) {
        return res.status(400).json({ message: "E-mail já existente" });
    }
  
    const id = Math.random().toString(16).slice(2);
    const data_criacao = new Date().toISOString();
    const data_atualizacao = new Date().toISOString();
    const ultimo_login = new Date().toISOString();
    const hashedSenha = await bcrypt.hash(senha, saltRounds);
  
    const token = jwt.sign({nome: nome} , process.env.JWT, { expiresIn: "1800s" });
  
    try {
        const user = await prisma.user.create({
            data: {
                id: id,
                nome: nome,
                email: email,
                senha: hashedSenha,
                telefones: telefones,
                data_criacao: data_criacao,
                data_atualizacao: data_atualizacao,
                ultimo_login: ultimo_login,
            }
        });
      
        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 1800 
        });
      
        const usuarioCriado = {
            id: user.id,
            data_criacao: new Date(user.data_criacao).toLocaleString("pt-BR", horaLocal).replace(/\//g, "-"),
            data_atualizacao: new Date(user.data_atualizacao).toLocaleString("pt-BR", horaLocal).replace(/\//g, "-"),
            ultimo_login: new Date(user.ultimo_login).toLocaleString("pt-BR", horaLocal).replace(/\//g, "-"),
            token: token
        };
        
      
        res.status(200).json(usuarioCriado);
    } catch (error) {
        res.status(500).json({ message: "Ocorreu um erro ao criar o usuário", error: error.toString() });
    }
      
});
  
router.post("/sign-in", async function(req, res){
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ message: "Por favor, forneça todos os campos necessários" });
        }

        const usuarioExistente = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if (!usuarioExistente) {
            return res.status(400).json({ message: "Usuário e/ou senha inválidos" });
        }

        const isPasswordCorrect = await bcrypt.compare(senha, usuarioExistente.senha);
        if(!isPasswordCorrect){
            return res.status(401).json({message: "Usuário e/ou senha inválidos"});
        }

        const ultimo_login = new Date().toISOString();
        await prisma.user.update({
            where: {
                email: email
            },
            data: {
                ultimo_login: ultimo_login
            }
        });

        const token = jwt.sign({nome: usuarioExistente.nome} , process.env.JWT, { expiresIn: "1800s" });

        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 1800 
        });

        const usuarioCriado = {
            id: usuarioExistente.id,
            data_criacao: usuarioExistente.data_criacao.toLocaleString("pt-BR", horaLocal).replace(/\//g, "-"),
            data_atualizacao: new Date(usuarioExistente.data_atualizacao).toLocaleString("pt-BR", horaLocal).replace(/\//g, "-"),
            ultimo_login: new Date(usuarioExistente.ultimo_login).toLocaleString("pt-BR", horaLocal).replace(/\//g, "-"),
            token: token
        };

        res.status(200).json(usuarioCriado);
    } catch (error) {
        res.status(500).json({ message: "Ocorreu um erro ao tentar fazer login", error: error.toString() });
    }
});

module.exports = router;