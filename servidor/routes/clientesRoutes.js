import express from "express";

import {
    listarClientes,
    buscarCliente,
    criarCliente,
    loginCliente,
    atualizarCliente,
    eliminarCliente,
    meuPerfil
} from "../controllers/clientesController.js";

import upload from "../middleware/uploadCloudinary.js";

const router = express.Router();

// =====================================================
// LOGIN
// =====================================================

router.post(
    "/login",
    loginCliente
);

// =====================================================
// MEU PERFIL
// =====================================================

router.get(
    "/perfil/:id",
    meuPerfil
);

// =====================================================
// LISTAR
// =====================================================

router.get(
    "/",
    listarClientes
);

// =====================================================
// CADASTRAR
// =====================================================

router.post(
    "/",
    upload.single("imagem"),
    criarCliente
);

// =====================================================
// BUSCAR
// =====================================================

router.get(
    "/:id",
    buscarCliente
);

// =====================================================
// ATUALIZAR
// =====================================================

router.put(
    "/:id",
    upload.single("imagem"),
    atualizarCliente
);

// =====================================================
// ELIMINAR
// =====================================================

router.delete(
    "/:id",
    eliminarCliente
);

export default router;