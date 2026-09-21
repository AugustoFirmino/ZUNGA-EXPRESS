import express from "express";

import {
    listarProdutos,
    buscarProduto,
    criarProduto,
    atualizarProduto,
    eliminarProduto,
} from "../mycontrollers/produtosController.js";

import uploadCloudinary from "../middleware/uploadCloudinary.js";

const router = express.Router();

router.get(
    "/",
    listarProdutos
);

router.get(
    "/:id",
    buscarProduto
);

router.post(
    "/",
    uploadCloudinary.single("imagem"),
    criarProduto
);

router.put(
    "/:id",
    uploadCloudinary.single("imagem"),
    atualizarProduto
);

router.delete(
    "/:id",
    eliminarProduto
);

export default router;