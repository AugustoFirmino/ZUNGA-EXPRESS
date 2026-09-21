import express from "express";

import {
    criarKilape,
    listarMeusKilapes,
    buscarMeuKilape,
    cancelarKilape,

    listarKilapes,
    buscarKilape,

    editarKilape,
    eliminarKilape,

    aprovarKilape,
    recusarKilape,
    pagarKilape
} from "../mycontrollers/kilapesController.js";

const router = express.Router();


// =====================================================
// CLIENTE - LISTAR OS SEUS KILAPES
// =====================================================
//
// Exemplo:
// GET /api/kilapes/meus?cliente_id=1
//

router.get(
    "/meus",
    listarMeusKilapes
);


// =====================================================
// CLIENTE - BUSCAR UM DOS SEUS KILAPES
// =====================================================
//
// Exemplo:
// GET /api/kilapes/meus/15?cliente_id=1
//

router.get(
    "/meus/:id",
    buscarMeuKilape
);


// =====================================================
// CLIENTE - CANCELAR KILAPE
// =====================================================
//
// Exemplo:
// DELETE /api/kilapes/meus/15
//
// Body:
// {
//     "cliente_id": 1
// }
//

router.delete(
    "/meus/:id",
    cancelarKilape
);


// =====================================================
// ADMIN - CRIAR KILAPE
// =====================================================
//
// Exemplo:
// POST /api/kilapes
//
// Body:
// {
//     "cliente_id": 1,
//     "valor": 50000,
//     "observacao": "Solicitação de Kilape"
// }
//

router.post(
    "/",
    criarKilape
);


// =====================================================
// ADMIN - LISTAR TODOS OS KILAPES
// =====================================================
//
// GET /api/kilapes
//

router.get(
    "/",
    listarKilapes
);


// =====================================================
// ADMIN - BUSCAR KILAPE
// =====================================================
//
// GET /api/kilapes/:id
//

router.get(
    "/:id",
    buscarKilape
);


// =====================================================
// ADMIN - EDITAR KILAPE
// =====================================================
//
// PUT /api/kilapes/:id
//
// Body exemplo:
// {
//     "cliente_id": 1,
//     "valor": 75000,
//     "observacao": "Valor atualizado"
// }
//

router.put(
    "/:id",
    editarKilape
);


// =====================================================
// ADMIN - ELIMINAR KILAPE
// =====================================================
//
// DELETE /api/kilapes/:id
//

router.delete(
    "/:id",
    eliminarKilape
);


// =====================================================
// ADMIN - APROVAR KILAPE
// =====================================================
//
// PUT /api/kilapes/:id/aprovar
//

router.put(
    "/:id/aprovar",
    aprovarKilape
);


// =====================================================
// ADMIN - RECUSAR KILAPE
// =====================================================
//
// PUT /api/kilapes/:id/recusar
//
// Body:
// {
//     "observacao": "Solicitação recusada."
// }
//

router.put(
    "/:id/recusar",
    recusarKilape
);


// =====================================================
// ADMIN - REGISTRAR PAGAMENTO
// =====================================================
//
// PUT /api/kilapes/:id/pagar
//

router.put(
    "/:id/pagar",
    pagarKilape
);


export default router;