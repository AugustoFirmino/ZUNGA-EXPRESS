// =====================================================
// routes/vendasRoutes.js
// =====================================================

import express from "express";

import {
    listarVendas,
    buscarVenda,
    estatisticasVendas,
    atualizarStatusVenda,
    vendasPorCliente,
    produtosMaisVendidos
} from "../controllers/vendasController.js";

const router = express.Router();

// =====================================================
// LISTAR VENDAS
// GET /api/vendas
//
// Para a página Vendas:
// GET /api/vendas?status=concluido
// =====================================================

router.get(
    "/",
    listarVendas
);

// =====================================================
// ESTATÍSTICAS DAS VENDAS
// GET /api/vendas/estatisticas
// =====================================================

router.get(
    "/estatisticas",
    estatisticasVendas
);

// =====================================================
// PRODUTOS MAIS VENDIDOS
// GET /api/vendas/produtos-mais-vendidos
// =====================================================

router.get(
    "/produtos-mais-vendidos",
    produtosMaisVendidos
);

// =====================================================
// VENDAS POR CLIENTE
// GET /api/vendas/cliente/:clienteId
// =====================================================

router.get(
    "/cliente/:clienteId",
    vendasPorCliente
);

// =====================================================
// BUSCAR UMA VENDA
// GET /api/vendas/:id
// =====================================================

router.get(
    "/:id",
    buscarVenda
);

// =====================================================
// ALTERAR STATUS DA VENDA
// PUT /api/vendas/:id/status
//
// Mantido porque existe no seu controller.
// =====================================================

router.put(
    "/:id/status",
    atualizarStatusVenda
);

// =====================================================
// EXPORTAÇÃO
// =====================================================

export default router;