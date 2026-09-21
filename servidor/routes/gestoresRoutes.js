import express from "express";
import multer from "multer";

import {
    criarGestor,
    listarGestores,
    buscarGestor,
    atualizarGestor,
    alterarEstadoGestor,
    alterarSenhaGestor,
    eliminarGestor,
    loginGestor
} from "../mycontrollers/gestoresController.js";

const router = express.Router();

// =====================================================
// CONFIGURAÇÃO DO MULTER
// =====================================================
//
// memoryStorage()
// -----------------------------------------------------
// Os ficheiros ficam temporariamente em memória.
//
// upload.any()
// -----------------------------------------------------
// Permite receber:
// - campos normais do FormData
// - uma ou várias imagens
// - qualquer nome de campo para o ficheiro
//
// Isto é importante porque o frontend pode estar enviando,
// por exemplo:
//
// formData.append("imagem", arquivo);
//
// ou:
//
// formData.append("foto", arquivo);
//
// ou:
//
// formData.append("avatar", arquivo);
//
// Com upload.none(), qualquer ficheiro causaria erro.
// =====================================================

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        // Máximo de campos do FormData
        fields: 100,

        // Máximo de ficheiros
        files: 10,

        // Tamanho máximo de cada campo
        fieldSize: 2 * 1024 * 1024,

        // Tamanho máximo de cada ficheiro: 10 MB
        fileSize: 10 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        // =================================================
        // ACEITAR IMAGENS
        // =================================================

        if (!file.mimetype) {
            return cb(
                new Error("Tipo de ficheiro não informado.")
            );
        }

        const tiposPermitidos = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/gif"
        ];

        if (!tiposPermitidos.includes(file.mimetype)) {
            return cb(
                new Error(
                    "Formato de imagem não permitido. Use JPG, JPEG, PNG, WEBP ou GIF."
                )
            );
        }

        cb(null, true);
    }
});

// =====================================================
// MIDDLEWARE PARA FORM-DATA
// =====================================================
//
// Aceita:
//
// multipart/form-data
//
// com ou sem ficheiros.
//
// Depois do processamento:
//
// req.body
//
// terá os campos:
//
// req.body.nome
// req.body.email
// req.body.telefone
// req.body.cargo
// etc.
//
// E:
//
// req.files
//
// terá as imagens enviadas.
//
// =====================================================

const processarFormData = (req, res, next) => {

    const contentType =
        req.headers["content-type"] || "";

    // =================================================
    // SE FOR MULTIPART/FORM-DATA
    // =================================================

    if (
        contentType
            .toLowerCase()
            .startsWith("multipart/form-data")
    ) {

        upload.any()(req, res, (erro) => {

            if (erro) {

                console.error(
                    "======================================"
                );

                console.error(
                    "ERRO AO PROCESSAR FORM-DATA"
                );

                console.error(
                    "Mensagem:",
                    erro.message
                );

                console.error(
                    "Código:",
                    erro.code
                );

                console.error(
                    "Content-Type:",
                    contentType
                );

                console.error(
                    "======================================"
                );

                let mensagem =
                    "Não foi possível processar os dados enviados.";

                if (erro.code === "LIMIT_FILE_SIZE") {
                    mensagem =
                        "A imagem é demasiado grande. O tamanho máximo permitido é 10 MB.";
                }

                else if (erro.code === "LIMIT_FILE_COUNT") {
                    mensagem =
                        "Foi ultrapassado o número máximo de imagens permitido.";
                }

                else if (erro.code === "LIMIT_FIELD_COUNT") {
                    mensagem =
                        "Foi ultrapassado o número máximo de campos permitido.";
                }

                else if (
                    erro.message &&
                    erro.message.includes(
                        "Formato de imagem não permitido"
                    )
                ) {
                    mensagem =
                        erro.message;
                }

                return res.status(400).json({
                    sucesso: false,
                    mensagem,
                    erro:
                        process.env.NODE_ENV === "production"
                            ? undefined
                            : erro.message
                });
            }

            // =================================================
            // GARANTIR BODY
            // =================================================

            if (
                !req.body ||
                typeof req.body !== "object"
            ) {
                req.body = {};
            }

            // =================================================
            // GARANTIR FILES
            // =================================================

            if (!Array.isArray(req.files)) {
                req.files = [];
            }

            console.log(
                "======================================"
            );

            console.log(
                "FORM-DATA PROCESSADO"
            );

            console.log(
                "BODY:",
                req.body
            );

            console.log(
                "FILES:",
                req.files.map((file) => ({
                    fieldname: file.fieldname,
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size
                }))
            );

            console.log(
                "======================================"
            );

            return next();
        });

        return;
    }

    // =================================================
    // SE NÃO FOR FORM-DATA
    // =================================================
    //
    // JSON será processado pelo express.json()
    // configurado no server.js/app.js.
    //
    // Não executamos multer neste caso.
    // =================================================

    next();
};

// =====================================================
// LOGIN DO GESTOR
// =====================================================
//
// POST /api/gestores/login
//
// Content-Type:
//
// application/json
//
// Body:
//
// {
//     "email": "joao@gmail.com",
//     "senha": "123456"
// }
// =====================================================

router.post(
    "/login",
    loginGestor
);

// =====================================================
// CRIAR GESTOR
// =====================================================
//
// POST /api/gestores
//
// Aceita:
//
// multipart/form-data
//
// Campos:
//
// nome
// email
// telefone
// senha
// cargo
//
// permissao_dashboard
// permissao_clientes
// permissao_categorias
// permissao_produtos
// permissao_pedidos
// permissao_vendas
// permissao_pagamentos
// permissao_relatorios
//
// ativo
//
// cloudinary_id
// cloudinary_url
//
// imagem
//
// =====================================================

router.post(
    "/",
    processarFormData,
    criarGestor
);

// =====================================================
// LISTAR TODOS OS GESTORES
// =====================================================
//
// GET /api/gestores
// =====================================================

router.get(
    "/",
    listarGestores
);

// =====================================================
// ALTERAR ESTADO DO GESTOR
// =====================================================
//
// PUT /api/gestores/:id/estado
//
// Aceita:
//
// multipart/form-data
//
// ou JSON.
//
// FormData:
//
// formData.append("ativo", "1");
//
// ou:
//
// formData.append("ativo", "0");
// =====================================================

router.put(
    "/:id/estado",
    processarFormData,
    alterarEstadoGestor
);

// =====================================================
// ALTERAR SENHA
// =====================================================
//
// PUT /api/gestores/:id/senha
//
// Aceita:
//
// multipart/form-data
//
// Exemplo:
//
// formData.append("senha", "123456");
// =====================================================

router.put(
    "/:id/senha",
    processarFormData,
    alterarSenhaGestor
);

// =====================================================
// BUSCAR GESTOR
// =====================================================
//
// GET /api/gestores/:id
// =====================================================

router.get(
    "/:id",
    buscarGestor
);

// =====================================================
// ATUALIZAR GESTOR
// =====================================================
//
// PUT /api/gestores/:id
//
// Aceita:
//
// multipart/form-data
//
// Campos:
//
// nome
// email
// telefone
// senha
// cargo
//
// cloudinary_id
// cloudinary_url
//
// permissao_dashboard
// permissao_clientes
// permissao_categorias
// permissao_produtos
// permissao_pedidos
// permissao_vendas
// permissao_pagamentos
// permissao_relatorios
//
// ativo
//
// imagem
//
// =====================================================

router.put(
    "/:id",
    processarFormData,
    atualizarGestor
);

// =====================================================
// ELIMINAR GESTOR
// =====================================================
//
// DELETE /api/gestores/:id
// =====================================================

router.delete(
    "/:id",
    eliminarGestor
);

// =====================================================
// EXPORTAR ROUTER
// =====================================================

export default router;