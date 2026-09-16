import express from "express";

import {
    login,
    loginAdmin,
    verificarAdmin,
    criarAdmin,
    obterAdmin,
    actualizarDadosAdmin,
    actualizarSenhaAdmin,
    resetarSenhaAdmin
} from "../controllers/adminController.js";

import {
    verificarTokenAdmin
} from "../middleware/authMiddleware.js";

const router = express.Router();


// =====================================================
// LOGIN GERAL
// POST /api/admin/login-geral
// =====================================================
//
// Permite o login geral da plataforma.
// Não exige autenticação.
//

router.post(
    "/login-geral",
    login
);


// =====================================================
// LOGIN DO ADMINISTRADOR
// POST /api/admin/login
// =====================================================
//
// Login exclusivo do administrador.
// Não exige token porque o token é criado aqui.
//

router.post(
    "/login",
    loginAdmin
);


// =====================================================
// VERIFICAR SE EXISTE ADMINISTRADOR
// GET /api/admin/verificar
// =====================================================
//
// Esta rota é pública.
//
// O frontend utiliza esta rota para saber:
//
// total = 0
//     -> mostrar página criar conta
//
// total >= 1
//     -> mostrar página de login
//
// Não exige token.
//

router.get(
    "/verificar",
    verificarAdmin
);


// =====================================================
// STATUS DO ADMINISTRADOR
// GET /api/admin/status
// =====================================================
//
// Alias de /verificar.
//
// Pode ser utilizado pelo frontend caso prefiras:
//
// GET /api/admin/status
//
// Também é público.
//

router.get(
    "/status",
    verificarAdmin
);


// =====================================================
// CRIAR PRIMEIRO ADMINISTRADOR
// POST /api/admin/criar
// =====================================================
//
// IMPORTANTE:
//
// Esta rota NÃO utiliza verificarTokenAdmin.
//
// O motivo é simples:
//
// Se ainda não existir nenhum administrador,
// ninguém possui token para acessar uma rota protegida.
//
// Porém, a função criarAdmin DEVE obrigatoriamente
// verificar no banco de dados se já existe administrador.
//
// Assim:
//
// 0 admins -> permite criar
//
// 1 admin -> bloqueia
//
// 2 admins -> nunca deve acontecer
//

router.post(
    "/criar",
    criarAdmin
);


// =====================================================
// OBTER ADMINISTRADOR AUTENTICADO
// GET /api/admin/me
// =====================================================
//
// Somente o administrador autenticado pode acessar.
//

router.get(
    "/me",
    verificarTokenAdmin,
    obterAdmin
);


// =====================================================
// ACTUALIZAR DADOS DO ADMINISTRADOR
// PUT /api/admin/dados
// =====================================================
//
// Exemplo:
//
// {
//     "nome": "Augusto",
//     "email": "admin@email.com",
//     "telefone": "900000000"
// }
//
// Somente administrador autenticado.
//

router.put(
    "/dados",
    verificarTokenAdmin,
    actualizarDadosAdmin
);


// =====================================================
// ACTUALIZAR PERFIL DO ADMINISTRADOR
// PUT /api/admin/perfil
// =====================================================
//
// Esta rota existe para manter compatibilidade com
// o frontend.
//
// O frontend utiliza:
//
// PUT /api/admin/perfil
//
// Internamente utiliza a mesma função:
//
// actualizarDadosAdmin
//
// Somente administrador autenticado.
//

router.put(
    "/perfil",
    verificarTokenAdmin,
    actualizarDadosAdmin
);


// =====================================================
// ALTERAR SENHA DO ADMINISTRADOR
// PUT /api/admin/senha
// =====================================================
//
// Exemplo:
//
// {
//     "senhaAtual": "123456",
//     "novaSenha": "12345678"
// }
//
// Somente administrador autenticado.
//

router.put(
    "/senha",
    verificarTokenAdmin,
    actualizarSenhaAdmin
);


// =====================================================
// RESETAR SENHA DO ADMINISTRADOR
// POST /api/admin/resetar-senha
// =====================================================
//
// Esta rota é pública.
//
// Exemplo:
//
// {
//     "email": "admin@email.com",
//     "novaSenha": "12345678"
// }
//
// ATENÇÃO:
//
// Em produção, o ideal é utilizar um sistema de
// recuperação por código/token enviado por email ou SMS.
//
// Mesmo sendo pública, a função resetarSenhaAdmin
// deve validar corretamente os dados.
//

router.post(
    "/resetar-senha",
    resetarSenhaAdmin
);


// =====================================================
// EXPORTAR ROUTER
// =====================================================

export default router;