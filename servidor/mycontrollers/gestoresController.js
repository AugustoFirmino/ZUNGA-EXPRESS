
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/database.js";
import cloudinary from "../config/cloudinary.js";

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

const validarId = (valor) => {
    const id = Number(valor);

    if (!Number.isInteger(id) || id <= 0) {
        return null;
    }

    return id;
};

// =====================================================
// VALIDAR EMAIL
// =====================================================

const validarEmail = (email) => {
    if (!email) {
        return false;
    }

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return regex.test(email);
};

// =====================================================
// CONVERTER PERMISSÃO
// =====================================================

const converterPermissao = (valor) => {
    if (
        valor === true ||
        valor === "true" ||
        valor === "1" ||
        valor === 1 ||
        valor === "on" ||
        valor === "sim"
    ) {
        return 1;
    }

    return 0;
};

// =====================================================
// VALIDAR ESTADO
// =====================================================

const estadoValido = (valor) => {
    return (
        valor === 0 ||
        valor === 1 ||
        valor === "0" ||
        valor === "1" ||
        valor === true ||
        valor === false ||
        valor === "true" ||
        valor === "false"
    );
};

// =====================================================
// CONVERTER ESTADO
// =====================================================

const converterEstado = (valor) => {
    if (
        valor === 1 ||
        valor === "1" ||
        valor === true ||
        valor === "true"
    ) {
        return 1;
    }

    return 0;
};

// =====================================================
// RESPOSTA DE ERRO
// =====================================================

const erroResposta = (erro) => {
    if (!erro) {
        return "Erro desconhecido.";
    }

    if (process.env.NODE_ENV === "production") {
        return "Não foi possível processar a operação.";
    }

    return erro.message || "Erro desconhecido.";
};

// =====================================================
// GERAR TOKEN JWT DO GESTOR
// =====================================================

const gerarTokenGestor = (gestor) => {
    const segredo = process.env.JWT_SECRET;

    if (!segredo) {
        throw new Error("JWT_SECRET não configurado no servidor.");
    }

    return jwt.sign(
        {
            id: gestor.id,
            nome: gestor.nome,
            email: gestor.email,
            cargo: gestor.cargo,
            tipo: "gestor"
        },
        segredo,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "8h"
        }
    );
};

// =====================================================
// SELECT PADRÃO
// =====================================================

const SELECT_GESTOR = `
    SELECT
        id,
        nome,
        email,
        telefone,
        cargo,

        cloudinary_id,
        cloudinary_url,

        permissao_dashboard,
        permissao_clientes,
        permissao_categorias,
        permissao_produtos,
        permissao_pedidos,
        permissao_vendas,
        permissao_pagamentos,
        permissao_relatorios,

        ativo,

        criado_em,
        atualizado_em

    FROM gestores
`;

// =====================================================
// UPLOAD BUFFER PARA CLOUDINARY
// =====================================================

const uploadBufferCloudinary = (
    buffer,
    folder = "gestores"
) => {
    return new Promise((resolve, reject) => {

        if (
            !buffer ||
            !Buffer.isBuffer(buffer)
        ) {
            reject(
                new Error(
                    "Buffer da imagem inválido."
                )
            );

            return;
        }

        const uploadStream =
            cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: "image"
                },

                (erro, resultado) => {

                    if (erro) {
                        reject(erro);
                        return;
                    }

                    if (!resultado) {
                        reject(
                            new Error(
                                "O Cloudinary não retornou resultado."
                            )
                        );

                        return;
                    }

                    resolve(resultado);
                }
            );

        uploadStream.end(buffer);
    });
};

// =====================================================
// ELIMINAR IMAGEM DO CLOUDINARY
// =====================================================

const eliminarImagemCloudinary = async (
    publicId
) => {

    if (!publicId) {
        return;
    }

    try {

        const resultado =
            await cloudinary.uploader.destroy(
                publicId,
                {
                    resource_type: "image"
                }
            );

        console.log(
            "Imagem removida do Cloudinary:",
            publicId
        );

        console.log(
            "Resultado:",
            resultado
        );

    } catch (erro) {

        console.error(
            "Erro ao remover imagem do Cloudinary:",
            erro.message
        );
    }
};

// =====================================================
// LOCALIZAR IMAGEM
// =====================================================

const obterArquivoImagem = (req) => {

    // multer.single("imagem")
    if (
        req.file &&
        req.file.fieldname === "imagem"
    ) {
        return req.file;
    }

    // multer.array("imagem")
    if (
        Array.isArray(req.files)
    ) {

        const arquivo =
            req.files.find(
                (item) =>
                    item.fieldname === "imagem"
            );

        if (arquivo) {
            return arquivo;
        }
    }

    // multer.fields(...)
    if (
        req.files &&
        typeof req.files === "object" &&
        !Array.isArray(req.files)
    ) {

        if (
            Array.isArray(req.files.imagem) &&
            req.files.imagem.length > 0
        ) {
            return req.files.imagem[0];
        }
    }

    return null;
};

// =====================================================
// VALIDAR IMAGEM
// =====================================================

const validarImagem = (arquivo) => {

    if (!arquivo) {
        return {
            valido: true
        };
    }

    if (
        !arquivo.buffer ||
        !Buffer.isBuffer(arquivo.buffer)
    ) {
        return {
            valido: false,
            mensagem:
                "O arquivo da imagem não possui dados válidos."
        };
    }

    const tiposPermitidos = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ];

    if (
        !tiposPermitidos.includes(
            arquivo.mimetype
        )
    ) {
        return {
            valido: false,
            mensagem:
                "Formato de imagem não permitido. Use JPG, JPEG, PNG ou WEBP."
        };
    }

    const tamanhoMaximo =
        5 * 1024 * 1024;

    if (
        arquivo.size > tamanhoMaximo
    ) {
        return {
            valido: false,
            mensagem:
                "A imagem não pode ultrapassar 5 MB."
        };
    }

    return {
        valido: true
    };
};

// =====================================================
// CRIAR GESTOR
// =====================================================

export const criarGestor = async (
    req,
    res
) => {

    let novaImagem = null;

    try {

        console.log(
            "======================================"
        );

        console.log(
            "CRIAR GESTOR"
        );

        console.log(
            "BODY:",
            req.body
        );

        console.log(
            "FILE:",
            req.file
        );

        console.log(
            "FILES:",
            req.files
        );

        console.log(
            "======================================"
        );

        const body = req.body || {};

        // =================================================
        // DADOS
        // =================================================

        const nome =
            String(
                body.nome || ""
            ).trim();

        const email =
            String(
                body.email || ""
            )
                .trim()
                .toLowerCase();

        const telefone =
            String(
                body.telefone || ""
            ).trim();

        const cargo =
            String(
                body.cargo || ""
            ).trim();

        const senha =
            String(
                body.senha || ""
            );

        // =================================================
        // VALIDAÇÕES
        // =================================================

        if (!nome) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O nome é obrigatório."
            });
        }

        if (nome.length > 150) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O nome não pode ultrapassar 150 caracteres."
            });
        }

        if (!email) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O email é obrigatório."
            });
        }

        if (!validarEmail(email)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Informe um email válido."
            });
        }

        if (email.length > 150) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O email não pode ultrapassar 150 caracteres."
            });
        }

        if (!senha || senha.length < 6) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "A senha deve possuir pelo menos 6 caracteres."
            });
        }

        if (!cargo) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O cargo é obrigatório."
            });
        }

        if (cargo.length > 100) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O cargo não pode ultrapassar 100 caracteres."
            });
        }

        if (telefone.length > 30) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O telefone não pode ultrapassar 30 caracteres."
            });
        }

        // =================================================
        // EMAIL DUPLICADO
        // =================================================

        const [
            emailExistente
        ] = await pool.query(
            `
                SELECT id
                FROM gestores
                WHERE email = ?
                LIMIT 1
            `,
            [email]
        );

        if (
            emailExistente.length > 0
        ) {
            return res.status(409).json({
                sucesso: false,
                mensagem:
                    "Este email já está cadastrado."
            });
        }

        // =================================================
        // PERMISSÕES
        // =================================================

        const permissao_dashboard =
            converterPermissao(
                body.permissao_dashboard
            );

        const permissao_clientes =
            converterPermissao(
                body.permissao_clientes
            );

        const permissao_categorias =
            converterPermissao(
                body.permissao_categorias
            );

        const permissao_produtos =
            converterPermissao(
                body.permissao_produtos
            );

        const permissao_pedidos =
            converterPermissao(
                body.permissao_pedidos
            );

        const permissao_vendas =
            converterPermissao(
                body.permissao_vendas
            );

        const permissao_pagamentos =
            converterPermissao(
                body.permissao_pagamentos
            );

        const permissao_relatorios =
            converterPermissao(
                body.permissao_relatorios
            );

        // =================================================
        // ESTADO
        // =================================================

        let ativo = 1;

        if (
            body.ativo !== undefined &&
            body.ativo !== null &&
            body.ativo !== ""
        ) {

            if (
                !estadoValido(
                    body.ativo
                )
            ) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem:
                        "O campo ativo deve ser 0 ou 1."
                });
            }

            ativo =
                converterEstado(
                    body.ativo
                );
        }

        // =================================================
        // IMAGEM
        // =================================================

        const arquivoImagem =
            obterArquivoImagem(req);

        let cloudinary_id = null;
        let cloudinary_url = null;

        if (arquivoImagem) {

            const validacao =
                validarImagem(
                    arquivoImagem
                );

            if (!validacao.valido) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem:
                        validacao.mensagem
                });
            }

            console.log(
                "Enviando imagem do gestor para Cloudinary..."
            );

            novaImagem =
                await uploadBufferCloudinary(
                    arquivoImagem.buffer,
                    "gestores"
                );

            if (
                !novaImagem ||
                !novaImagem.public_id ||
                !novaImagem.secure_url
            ) {
                throw new Error(
                    "O Cloudinary não retornou public_id ou secure_url."
                );
            }

            cloudinary_id =
                String(
                    novaImagem.public_id
                ).trim();

            cloudinary_url =
                String(
                    novaImagem.secure_url
                ).trim();
        }

        // =================================================
        // VALIDAR DADOS CLOUDINARY
        // =================================================

        if (
            cloudinary_id &&
            cloudinary_id.length > 255
        ) {
            throw new Error(
                "O cloudinary_id não pode ultrapassar 255 caracteres."
            );
        }

        if (
            cloudinary_url &&
            cloudinary_url.length > 500
        ) {
            throw new Error(
                "A cloudinary_url não pode ultrapassar 500 caracteres."
            );
        }

        // =================================================
        // HASH DA SENHA
        // =================================================

        const senhaHash =
            await bcrypt.hash(
                senha,
                12
            );

        // =================================================
        // INSERIR
        // =================================================

        const [
            resultado
        ] = await pool.query(
            `
                INSERT INTO gestores (
                    nome,
                    email,
                    telefone,
                    senha,
                    cargo,

                    cloudinary_id,
                    cloudinary_url,

                    permissao_dashboard,
                    permissao_clientes,
                    permissao_categorias,
                    permissao_produtos,
                    permissao_pedidos,
                    permissao_vendas,
                    permissao_pagamentos,
                    permissao_relatorios,

                    ativo,

                    criado_em,
                    atualizado_em
                )

                VALUES (
                    ?, ?, ?, ?, ?,
                    ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?,
                    ?,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                )
            `,
            [
                nome,
                email,
                telefone || null,
                senhaHash,
                cargo,

                cloudinary_id,
                cloudinary_url,

                permissao_dashboard,
                permissao_clientes,
                permissao_categorias,
                permissao_produtos,
                permissao_pedidos,
                permissao_vendas,
                permissao_pagamentos,
                permissao_relatorios,

                ativo
            ]
        );

        // =================================================
        // BUSCAR NOVO GESTOR
        // =================================================

        const [
            gestores
        ] = await pool.query(
            `
                ${SELECT_GESTOR}
                WHERE id = ?
                LIMIT 1
            `,
            [
                resultado.insertId
            ]
        );

        return res.status(201).json({
            sucesso: true,
            mensagem:
                "Gestor cadastrado com sucesso.",
            gestor:
                gestores[0]
        });

    } catch (erro) {

        console.error(
            "ERRO AO CRIAR GESTOR:",
            erro
        );

        // Remover imagem se o MySQL falhar
        if (
            novaImagem &&
            novaImagem.public_id
        ) {
            await eliminarImagemCloudinary(
                novaImagem.public_id
            );
        }

        if (
            erro.code ===
            "ER_DUP_ENTRY"
        ) {
            return res.status(409).json({
                sucesso: false,
                mensagem:
                    "Este email já está cadastrado."
            });
        }

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao cadastrar gestor.",
            erro:
                erroResposta(erro)
        });
    }
};

// =====================================================
// LISTAR GESTORES
// =====================================================

export const listarGestores = async (
    req,
    res
) => {

    try {

        const [
            gestores
        ] = await pool.query(
            `
                ${SELECT_GESTOR}
                ORDER BY id DESC
            `
        );

        return res.status(200).json({
            sucesso: true,
            gestores
        });

    } catch (erro) {

        console.error(
            "ERRO AO LISTAR GESTORES:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao listar gestores.",
            erro:
                erroResposta(erro)
        });
    }
};

// =====================================================
// BUSCAR GESTOR
// =====================================================

export const buscarGestor = async (
    req,
    res
) => {

    try {

        const id =
            validarId(
                req.params.id
            );

        if (!id) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID do gestor inválido."
            });
        }

        const [
            gestores
        ] = await pool.query(
            `
                ${SELECT_GESTOR}
                WHERE id = ?
                LIMIT 1
            `,
            [id]
        );

        if (
            gestores.length === 0
        ) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Gestor não encontrado."
            });
        }

        return res.status(200).json({
            sucesso: true,
            gestor:
                gestores[0]
        });

    } catch (erro) {

        console.error(
            "ERRO AO BUSCAR GESTOR:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao buscar gestor.",
            erro:
                erroResposta(erro)
        });
    }
};

// =====================================================
// ATUALIZAR GESTOR
// =====================================================

export const atualizarGestor = async (
    req,
    res
) => {

    let novaImagemCloudinary = null;

    try {

        console.log(
            "======================================"
        );

        console.log(
            "ATUALIZAR GESTOR"
        );

        console.log(
            "PARAMS:",
            req.params
        );

        console.log(
            "BODY:",
            req.body
        );

        console.log(
            "FILE:",
            req.file
        );

        console.log(
            "FILES:",
            req.files
        );

        console.log(
            "CONTENT-TYPE:",
            req.headers["content-type"]
        );

        console.log(
            "======================================"
        );

        // =================================================
        // ID
        // =================================================

        const id =
            validarId(
                req.params.id
            );

        if (!id) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID do gestor inválido."
            });
        }

        const body =
            req.body || {};

        // =================================================
        // BUSCAR GESTOR ATUAL
        // =================================================

        const [
            gestoresExistentes
        ] = await pool.query(
            `
                SELECT
                    id,
                    nome,
                    email,
                    telefone,
                    senha,
                    cargo,

                    cloudinary_id,
                    cloudinary_url,

                    permissao_dashboard,
                    permissao_clientes,
                    permissao_categorias,
                    permissao_produtos,
                    permissao_pedidos,
                    permissao_vendas,
                    permissao_pagamentos,
                    permissao_relatorios,

                    ativo

                FROM gestores

                WHERE id = ?

                LIMIT 1
            `,
            [id]
        );

        if (
            gestoresExistentes.length === 0
        ) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Gestor não encontrado."
            });
        }

        const gestorAtual =
            gestoresExistentes[0];

        // =================================================
        // NOME
        // =================================================

        const nome =
            body.nome !== undefined
                ? String(
                    body.nome
                ).trim()
                : String(
                    gestorAtual.nome || ""
                ).trim();

        if (!nome) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O nome é obrigatório."
            });
        }

        if (nome.length > 150) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O nome não pode ultrapassar 150 caracteres."
            });
        }

        // =================================================
        // EMAIL
        // =================================================

        const email =
            body.email !== undefined
                ? String(
                    body.email
                )
                    .trim()
                    .toLowerCase()
                : String(
                    gestorAtual.email || ""
                )
                    .trim()
                    .toLowerCase();

        if (!email) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O email é obrigatório."
            });
        }

        if (!validarEmail(email)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Informe um email válido."
            });
        }

        if (email.length > 150) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O email não pode ultrapassar 150 caracteres."
            });
        }

        // =================================================
        // TELEFONE
        // =================================================

        const telefone =
            body.telefone !== undefined
                ? String(
                    body.telefone
                ).trim()
                : String(
                    gestorAtual.telefone || ""
                ).trim();

        if (telefone.length > 30) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O telefone não pode ultrapassar 30 caracteres."
            });
        }

        // =================================================
        // CARGO
        // =================================================

        const cargo =
            body.cargo !== undefined
                ? String(
                    body.cargo
                ).trim()
                : String(
                    gestorAtual.cargo || ""
                ).trim();

        if (!cargo) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O cargo é obrigatório."
            });
        }

        if (cargo.length > 100) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O cargo não pode ultrapassar 100 caracteres."
            });
        }

        // =================================================
        // EMAIL DUPLICADO
        // =================================================

        const [
            emailExistente
        ] = await pool.query(
            `
                SELECT id
                FROM gestores
                WHERE email = ?
                AND id <> ?
                LIMIT 1
            `,
            [
                email,
                id
            ]
        );

        if (
            emailExistente.length > 0
        ) {
            return res.status(409).json({
                sucesso: false,
                mensagem:
                    "Este email já pertence a outro gestor."
            });
        }

        // =================================================
        // PERMISSÕES
        // =================================================

        const permissoes = [
            "dashboard",
            "clientes",
            "categorias",
            "produtos",
            "pedidos",
            "vendas",
            "pagamentos",
            "relatorios"
        ];

        const valoresPermissoes = {};

        for (
            const permissao
            of permissoes
        ) {

            const campo =
                `permissao_${permissao}`;

            valoresPermissoes[campo] =
                body[campo] !== undefined
                    ? converterPermissao(
                        body[campo]
                    )
                    : Number(
                        gestorAtual[campo]
                    ) === 1
                        ? 1
                        : 0;
        }

        // =================================================
        // ESTADO
        // =================================================

        let ativo;

        if (
            body.ativo !== undefined &&
            body.ativo !== null &&
            body.ativo !== ""
        ) {

            if (
                !estadoValido(
                    body.ativo
                )
            ) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem:
                        "O campo ativo deve ser 0 ou 1."
                });
            }

            ativo =
                converterEstado(
                    body.ativo
                );

        } else {

            ativo =
                Number(
                    gestorAtual.ativo
                ) === 1
                    ? 1
                    : 0;
        }

        // =================================================
        // SENHA OPCIONAL
        // =================================================

        const senha =
            body.senha !== undefined &&
            body.senha !== null
                ? String(
                    body.senha
                )
                : "";

        if (
            senha.length > 0 &&
            senha.length < 6
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "A nova senha deve possuir pelo menos 6 caracteres."
            });
        }

        // =================================================
        // CLOUDINARY ATUAL
        // =================================================

        let cloudinary_id =
            gestorAtual.cloudinary_id
                ? String(
                    gestorAtual.cloudinary_id
                ).trim()
                : null;

        let cloudinary_url =
            gestorAtual.cloudinary_url
                ? String(
                    gestorAtual.cloudinary_url
                ).trim()
                : null;

        const cloudinaryIdAntigo =
            cloudinary_id;

        // =================================================
        // NOVA IMAGEM
        // =================================================

        const arquivoImagem =
            obterArquivoImagem(req);

        if (arquivoImagem) {

            const validacao =
                validarImagem(
                    arquivoImagem
                );

            if (!validacao.valido) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem:
                        validacao.mensagem
                });
            }

            console.log(
                "Enviando nova imagem para Cloudinary..."
            );

            novaImagemCloudinary =
                await uploadBufferCloudinary(
                    arquivoImagem.buffer,
                    "gestores"
                );

            if (
                !novaImagemCloudinary ||
                !novaImagemCloudinary.public_id ||
                !novaImagemCloudinary.secure_url
            ) {
                throw new Error(
                    "O Cloudinary não retornou public_id ou secure_url."
                );
            }

            cloudinary_id =
                String(
                    novaImagemCloudinary.public_id
                ).trim();

            cloudinary_url =
                String(
                    novaImagemCloudinary.secure_url
                ).trim();
        }

        // =================================================
        // VALIDAR CLOUDINARY
        // =================================================

        if (
            cloudinary_id &&
            cloudinary_id.length > 255
        ) {
            throw new Error(
                "O cloudinary_id não pode ultrapassar 255 caracteres."
            );
        }

        if (
            cloudinary_url &&
            cloudinary_url.length > 500
        ) {
            throw new Error(
                "A cloudinary_url não pode ultrapassar 500 caracteres."
            );
        }

        // =================================================
        // UPDATE
        // =================================================

        const [
            resultadoUpdate
        ] = await pool.query(
            `
                UPDATE gestores

                SET
                    nome = ?,
                    email = ?,
                    telefone = ?,
                    cargo = ?,

                    cloudinary_id = ?,
                    cloudinary_url = ?,

                    permissao_dashboard = ?,
                    permissao_clientes = ?,
                    permissao_categorias = ?,
                    permissao_produtos = ?,
                    permissao_pedidos = ?,
                    permissao_vendas = ?,
                    permissao_pagamentos = ?,
                    permissao_relatorios = ?,

                    ativo = ?,

                    atualizado_em =
                        CURRENT_TIMESTAMP

                WHERE id = ?
            `,
            [
                nome,
                email,
                telefone || null,
                cargo,

                cloudinary_id || null,
                cloudinary_url || null,

                valoresPermissoes.permissao_dashboard,
                valoresPermissoes.permissao_clientes,
                valoresPermissoes.permissao_categorias,
                valoresPermissoes.permissao_produtos,
                valoresPermissoes.permissao_pedidos,
                valoresPermissoes.permissao_vendas,
                valoresPermissoes.permissao_pagamentos,
                valoresPermissoes.permissao_relatorios,

                ativo,

                id
            ]
        );

        console.log(
            "RESULTADO UPDATE:",
            resultadoUpdate
        );

        // =================================================
        // SENHA
        // =================================================

        if (
            senha.length > 0
        ) {

            const senhaHash =
                await bcrypt.hash(
                    senha,
                    12
                );

            await pool.query(
                `
                    UPDATE gestores

                    SET
                        senha = ?,
                        atualizado_em =
                            CURRENT_TIMESTAMP

                    WHERE id = ?
                `,
                [
                    senhaHash,
                    id
                ]
            );
        }

        // =================================================
        // CONFIRMAR MYSQL
        // =================================================

        const [
            confirmacao
        ] = await pool.query(
            `
                ${SELECT_GESTOR}
                WHERE id = ?
                LIMIT 1
            `,
            [id]
        );

        if (
            confirmacao.length === 0
        ) {
            throw new Error(
                "Gestor não encontrado após atualização."
            );
        }

        const gestorConfirmado =
            confirmacao[0];

        // =================================================
        // CONFIRMAR CLOUDINARY
        // =================================================

        if (arquivoImagem) {

            if (
                !gestorConfirmado.cloudinary_id
            ) {
                throw new Error(
                    "O cloudinary_id não foi salvo no banco de dados."
                );
            }

            if (
                !gestorConfirmado.cloudinary_url
            ) {
                throw new Error(
                    "O cloudinary_url não foi salvo no banco de dados."
                );
            }

            if (
                gestorConfirmado.cloudinary_id !==
                cloudinary_id
            ) {
                throw new Error(
                    "O cloudinary_id salvo no MySQL é diferente do Cloudinary."
                );
            }

            if (
                gestorConfirmado.cloudinary_url !==
                cloudinary_url
            ) {
                throw new Error(
                    "O cloudinary_url salvo no MySQL é diferente do Cloudinary."
                );
            }
        }

        // =================================================
        // REMOVER IMAGEM ANTIGA
        // =================================================

        if (
            arquivoImagem &&
            novaImagemCloudinary &&
            cloudinaryIdAntigo &&
            cloudinaryIdAntigo !==
                cloudinary_id
        ) {

            await eliminarImagemCloudinary(
                cloudinaryIdAntigo
            );
        }

        // =================================================
        // RESPOSTA
        // =================================================

        return res.status(200).json({
            sucesso: true,
            mensagem:
                "Gestor atualizado com sucesso.",
            gestor:
                gestorConfirmado
        });

    } catch (erro) {

        console.error(
            "======================================"
        );

        console.error(
            "ERRO AO ATUALIZAR GESTOR"
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
            "SQL:",
            erro.sql
        );

        console.error(
            "SQL Message:",
            erro.sqlMessage
        );

        console.error(
            "Stack:",
            erro.stack
        );

        console.error(
            "======================================"
        );

        // Remover nova imagem caso a atualização falhe
        if (
            novaImagemCloudinary &&
            novaImagemCloudinary.public_id
        ) {

            await eliminarImagemCloudinary(
                novaImagemCloudinary.public_id
            );
        }

        if (
            erro.code ===
            "ER_DUP_ENTRY"
        ) {
            return res.status(409).json({
                sucesso: false,
                mensagem:
                    "Este email já está cadastrado."
            });
        }

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao atualizar gestor.",
            erro:
                erroResposta(erro)
        });
    }
};

// =====================================================
// ALTERAR ESTADO DO GESTOR
// =====================================================

export const alterarEstadoGestor = async (
    req,
    res
) => {

    try {

        const id =
            validarId(
                req.params.id
            );

        if (!id) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID do gestor inválido."
            });
        }

        const body =
            req.body || {};

        if (
            body.ativo === undefined
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O campo ativo é obrigatório."
            });
        }

        if (
            !estadoValido(
                body.ativo
            )
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O campo ativo deve ser 0 ou 1."
            });
        }

        const ativo =
            converterEstado(
                body.ativo
            );

        const [
            resultado
        ] = await pool.query(
            `
                UPDATE gestores

                SET
                    ativo = ?,
                    atualizado_em =
                        CURRENT_TIMESTAMP

                WHERE id = ?
            `,
            [
                ativo,
                id
            ]
        );

        if (
            resultado.affectedRows === 0
        ) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Gestor não encontrado."
            });
        }

        const [
            gestores
        ] = await pool.query(
            `
                ${SELECT_GESTOR}
                WHERE id = ?
                LIMIT 1
            `,
            [id]
        );

        return res.status(200).json({
            sucesso: true,
            mensagem:
                ativo === 1
                    ? "Gestor ativado com sucesso."
                    : "Gestor desativado com sucesso.",
            gestor:
                gestores[0]
        });

    } catch (erro) {

        console.error(
            "ERRO AO ALTERAR ESTADO:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao alterar estado do gestor.",
            erro:
                erroResposta(erro)
        });
    }
};

// =====================================================
// ALTERAR SENHA
// =====================================================

export const alterarSenhaGestor = async (
    req,
    res
) => {

    try {

        const id =
            validarId(
                req.params.id
            );

        if (!id) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID do gestor inválido."
            });
        }

        const senha =
            String(
                req.body?.senha || ""
            );

        if (
            !senha ||
            senha.length < 6
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "A senha deve possuir pelo menos 6 caracteres."
            });
        }

        const [
            gestores
        ] = await pool.query(
            `
                SELECT id
                FROM gestores
                WHERE id = ?
                LIMIT 1
            `,
            [id]
        );

        if (
            gestores.length === 0
        ) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Gestor não encontrado."
            });
        }

        const senhaHash =
            await bcrypt.hash(
                senha,
                12
            );

        await pool.query(
            `
                UPDATE gestores

                SET
                    senha = ?,
                    atualizado_em =
                        CURRENT_TIMESTAMP

                WHERE id = ?
            `,
            [
                senhaHash,
                id
            ]
        );

        return res.status(200).json({
            sucesso: true,
            mensagem:
                "Senha alterada com sucesso."
        });

    } catch (erro) {

        console.error(
            "ERRO AO ALTERAR SENHA:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao alterar senha.",
            erro:
                erroResposta(erro)
        });
    }
};

// =====================================================
// ELIMINAR GESTOR
// =====================================================

export const eliminarGestor = async (
    req,
    res
) => {

    try {

        const id =
            validarId(
                req.params.id
            );

        if (!id) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID do gestor inválido."
            });
        }

        const [
            gestores
        ] = await pool.query(
            `
                SELECT
                    id,
                    cloudinary_id
                FROM gestores
                WHERE id = ?
                LIMIT 1
            `,
            [id]
        );

        if (
            gestores.length === 0
        ) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Gestor não encontrado."
            });
        }

        const gestor =
            gestores[0];

        await pool.query(
            `
                DELETE FROM gestores
                WHERE id = ?
            `,
            [id]
        );

        if (
            gestor.cloudinary_id
        ) {
            await eliminarImagemCloudinary(
                gestor.cloudinary_id
            );
        }

        return res.status(200).json({
            sucesso: true,
            mensagem:
                "Gestor eliminado com sucesso."
        });

    } catch (erro) {

        console.error(
            "ERRO AO ELIMINAR GESTOR:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao eliminar gestor.",
            erro:
                erroResposta(erro)
        });
    }
};

// =====================================================
// LOGIN
// =====================================================

export const loginGestor = async (
    req,
    res
) => {

    try {

        const email =
            String(
                req.body?.email || ""
            )
                .trim()
                .toLowerCase();

        const senha =
            String(
                req.body?.senha || ""
            );

        if (!email || !senha) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Email e senha são obrigatórios."
            });
        }

        if (!validarEmail(email)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Informe um email válido."
            });
        }

        const [
            gestores
        ] = await pool.query(
            `
                SELECT
                    id,
                    nome,
                    email,
                    telefone,
                    senha,
                    cargo,

                    cloudinary_id,
                    cloudinary_url,

                    permissao_dashboard,
                    permissao_clientes,
                    permissao_categorias,
                    permissao_produtos,
                    permissao_pedidos,
                    permissao_vendas,
                    permissao_pagamentos,
                    permissao_relatorios,

                    ativo,

                    criado_em,
                    atualizado_em

                FROM gestores

                WHERE email = ?

                LIMIT 1
            `,
            [email]
        );

        if (
            gestores.length === 0
        ) {
            return res.status(401).json({
                sucesso: false,
                mensagem:
                    "Email ou senha incorretos."
            });
        }

        const gestor =
            gestores[0];

        // =================================================
        // VERIFICAR ESTADO
        // =================================================

        if (
            Number(
                gestor.ativo
            ) !== 1
        ) {
            return res.status(403).json({
                sucesso: false,
                mensagem:
                    "Este gestor está desativado."
            });
        }

        // =================================================
        // COMPARAR SENHA
        // =================================================

        const senhaValida =
            await bcrypt.compare(
                senha,
                gestor.senha
            );

        if (!senhaValida) {
            return res.status(401).json({
                sucesso: false,
                mensagem:
                    "Email ou senha incorretos."
            });
        }

        // Nunca enviar a senha para o frontend
        delete gestor.senha;

        const token = gerarTokenGestor(gestor);

        return res.status(200).json({
            sucesso: true,
            mensagem:
                "Login realizado com sucesso.",
            token,
            gestor: {
                ...gestor,
                tipo: "gestor"
            }
        });

    } catch (erro) {

        console.error(
            "ERRO NO LOGIN DO GESTOR:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao realizar login.",
            erro:
                erroResposta(erro)
        });
    }
};
