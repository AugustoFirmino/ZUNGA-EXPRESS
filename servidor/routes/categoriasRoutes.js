import express from "express";
import categoriasController from "../controllers/categoriasController.js";

const router = express.Router();

router.get(
    "/",
    categoriasController.listarCategorias
);

router.get(
    "/:id",
    categoriasController.buscarCategoria
);

router.post(
    "/",
    categoriasController.criarCategoria
);

router.put(
    "/:id",
    categoriasController.atualizarCategoria
);

router.delete(
    "/:id",
    categoriasController.eliminarCategoria
);

export default router;