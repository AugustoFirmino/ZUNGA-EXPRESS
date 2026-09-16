import express from "express";

import {
    criarPedido,
    listarPedidos,
    listarPedidosCliente,
    buscarPedido,
    atualizarStatusPedido,
    cancelarPedido,
    eliminarPedido,
    alterarPagamento,
    consultarPagamento
} from "../controllers/pedidosController.js";

const router = express.Router();


// =====================================================
// CRIAR PEDIDO
// POST /api/pedidos
// =====================================================

router.post(
    "/",
    criarPedido
);


// =====================================================
// LISTAR TODOS OS PEDIDOS
// GET /api/pedidos
// =====================================================

router.get(
    "/",
    listarPedidos
);


// =====================================================
// LISTAR PEDIDOS DO CLIENTE
// GET /api/pedidos/cliente/:clienteId
// =====================================================

router.get(
    "/cliente/:clienteId",
    listarPedidosCliente
);


// =====================================================
// CONSULTAR PAGAMENTO DO PEDIDO
// GET /api/pedidos/:id/pagamento
// =====================================================

router.get(
    "/:id/pagamento",
    consultarPagamento
);


// =====================================================
// ALTERAR PAGAMENTO
// PUT /api/pedidos/:id/pagamento
//
// Exemplo:
// PUT http://localhost:5000/api/pedidos/10/pagamento
//
// Body:
// {
//     "status_pagamento": "pago"
// }
// =====================================================

router.put(
    "/:id/pagamento",
    alterarPagamento
);


// =====================================================
// ALTERAR PAGAMENTO - PATCH
// PATCH /api/pedidos/:id/pagamento
//
// Mantido para compatibilidade caso o frontend
// esteja utilizando PATCH.
// =====================================================

router.patch(
    "/:id/pagamento",
    alterarPagamento
);


// =====================================================
// BUSCAR PEDIDO
// GET /api/pedidos/:id
// =====================================================

router.get(
    "/:id",
    buscarPedido
);


// =====================================================
// ATUALIZAR STATUS DO PEDIDO
// PUT /api/pedidos/:id/status
// =====================================================

router.put(
    "/:id/status",
    atualizarStatusPedido
);


// =====================================================
// CANCELAR PEDIDO
// PUT /api/pedidos/:id/cancelar
// =====================================================

router.put(
    "/:id/cancelar",
    cancelarPedido
);


// =====================================================
// ELIMINAR PEDIDO
// DELETE /api/pedidos/:id
// =====================================================

router.delete(
    "/:id",
    eliminarPedido
);


export default router;