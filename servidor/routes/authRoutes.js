
import express from "express";

import {
    login,
    loginCliente
} from "../controllers/authController.js";

const router = express.Router();


// =====================================================
// LOGIN GERAL
// Procura primeiro em admin e depois em clientes
// =====================================================

router.post(
    "/login",
    login
);


// =====================================================
// LOGIN EXCLUSIVO DO CLIENTE
// Opcional
// =====================================================

router.post(
    "/clientes/login",
    loginCliente
);


export default router;

