import pool from "../config/database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../config/cloudinary.js";

// =====================================================
// GERAR TOKEN JWT DO CLIENTE
// =====================================================

const gerarTokenCliente = (cliente) => {

    const segredo = process.env.JWT_SECRET;

    if (!segredo) {
        throw new Error(
            "JWT_SECRET não configurado no servidor."
        );
    }

    return jwt.sign(
        {
            id: cliente.id,
            nome: cliente.nome,
            email: cliente.email,
            tipo: "cliente"
        },
        segredo,
        {
            expiresIn:
                process.env.JWT_EXPIRES_IN || "8h"
        }
    );
};

// =====================================================
// UPLOAD PARA CLOUDINARY
// =====================================================

const enviarParaCloudinary = (buffer, nomeCliente) => {

    return new Promise((resolve, reject) => {

        if (!buffer) {

            return reject(
                new Error(
                    "Buffer da imagem não encontrado."
                )
            );
        }

        const nomeSeguro =
            String(nomeCliente || "cliente")
                .trim()
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/gi, "_")
                .replace(/^_+|_+$/g, "");

        const publicId =
            `${nomeSeguro || "cliente"}_${Date.now()}`;

        const uploadStream =
            cloudinary.uploader.upload_stream(
                {
                    folder:
                        "agenda_salao/clientes",

                    public_id:
                        publicId,

                    resource_type:
                        "image",

                    transformation: [
                        {
                            width: 800,
                            height: 800,
                            crop: "limit"
                        }
                    ],

                    quality: "auto",

                    fetch_format: "auto"
                },

                (erro, resultado) => {

                    if (erro) {
                        return reject(erro);
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
    cloudinaryId
) => {

    if (!cloudinaryId) {
        return;
    }

    try {

        const resultado =
            await cloudinary.uploader.destroy(
                cloudinaryId,
                {
                    resource_type: "image"
                }
            );

        console.log(
            "Imagem removida do Cloudinary:",
            cloudinaryId
        );

        console.log(
            "Resultado:",
            resultado.result
        );

    } catch (erro) {

        console.error(
            "Erro ao eliminar imagem do Cloudinary:",
            erro.message
        );
    }
};

// =====================================================
// NORMALIZAR VALOR
// =====================================================

const normalizarValor = (
    valor,
    valorPadrao = null
) => {

    if (
        valor === undefined ||
        valor === null ||
        String(valor).trim() === ""
    ) {
        return valorPadrao;
    }

    const numero =
        Number(
            String(valor)
                .replace(",", ".")
        );

    if (
        !Number.isFinite(numero) ||
        numero < 0
    ) {
        return {
            erro: true
        };
    }

    return numero;
};

// =====================================================
// LISTAR CLIENTES
// GET /api/clientes
// =====================================================

export const listarClientes = async (
    req,
    res
) => {

    try {

        const [clientes] =
            await pool.query(
                `
                SELECT
                    id,
                    nome,
                    telefone,
                    email,
                    valor,
                    cloudinary_url,
                    cloudinary_id,
                    criado_em
                FROM clientes
                ORDER BY id DESC
                `
            );

        return res.status(200).json({

            sucesso: true,

            clientes

        });

    } catch (erro) {

        console.error(
            "Erro ao listar clientes:",
            erro
        );

        return res.status(500).json({

            sucesso: false,

            mensagem:
                "Erro ao carregar clientes."

        });
    }
};

// =====================================================
// BUSCAR CLIENTE
// GET /api/clientes/:id
// =====================================================

export const buscarCliente = async (
    req,
    res
) => {

    try {

        const { id } =
            req.params;

        if (!id) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "ID do cliente é obrigatório."

            });
        }

        const [clientes] =
            await pool.query(
                `
                SELECT
                    id,
                    nome,
                    telefone,
                    email,
                    valor,
                    cloudinary_url,
                    cloudinary_id,
                    criado_em
                FROM clientes
                WHERE id = ?
                LIMIT 1
                `,
                [id]
            );

        if (clientes.length === 0) {

            return res.status(404).json({

                sucesso: false,

                mensagem:
                    "Cliente não encontrado."

            });
        }

        return res.status(200).json({

            sucesso: true,

            cliente:
                clientes[0]

        });

    } catch (erro) {

        console.error(
            "Erro ao buscar cliente:",
            erro
        );

        return res.status(500).json({

            sucesso: false,

            mensagem:
                "Erro ao buscar cliente."

        });
    }
};

// =====================================================
// CRIAR CLIENTE
// POST /api/clientes
// =====================================================

export const criarCliente = async (
    req,
    res
) => {

    let imagemCloudinary = null;

    try {

        console.log(
            "======================================"
        );

        console.log(
            "CRIAR CLIENTE"
        );

        console.log(
            "BODY:",
            req.body
        );

        console.log(
            "FILE:",
            req.file
                ? {
                    originalname:
                        req.file.originalname,

                    mimetype:
                        req.file.mimetype,

                    size:
                        req.file.size
                }
                : null
        );

        console.log(
            "======================================"
        );

        const body =
            req.body || {};

        const nome =
            body.nome !== undefined
                ? String(body.nome).trim()
                : "";

        const telefone =
            body.telefone !== undefined
                ? String(body.telefone).trim()
                : "";

        const email =
            body.email !== undefined
                ? String(body.email)
                    .trim()
                    .toLowerCase()
                : "";

        const senha =
            body.senha !== undefined
                ? String(body.senha)
                : "";

        const valor =
            body.valor !== undefined
                ? body.valor
                : null;

        // =================================================
        // VALIDAR NOME
        // =================================================

        if (!nome) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "O nome é obrigatório."

            });
        }

        if (nome.length < 3) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "O nome deve ter pelo menos 3 caracteres."

            });
        }

        // =================================================
        // VALIDAR TELEFONE
        // =================================================

        if (!telefone) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "O telefone é obrigatório."

            });
        }

        // =================================================
        // VALIDAR SENHA
        // =================================================

        if (!senha) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "A senha é obrigatória."

            });
        }

        if (senha.length < 6) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "A senha deve ter pelo menos 6 caracteres."

            });
        }

        // =================================================
        // EMAIL
        // =================================================

        const emailNormalizado =
            email || null;

        // =================================================
        // VERIFICAR EMAIL
        // =================================================

        if (emailNormalizado) {

            const [existente] =
                await pool.query(
                    `
                    SELECT id
                    FROM clientes
                    WHERE LOWER(email) = ?
                    LIMIT 1
                    `,
                    [
                        emailNormalizado
                    ]
                );

            if (existente.length > 0) {

                return res.status(409).json({

                    sucesso: false,

                    mensagem:
                        "Este email já está cadastrado."

                });
            }
        }

        // =================================================
        // VALOR
        // =================================================

        const valorNormalizado =
            normalizarValor(
                valor,
                null
            );

        if (
            valorNormalizado &&
            valorNormalizado.erro
        ) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "O valor informado é inválido."

            });
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
        // CLOUDINARY
        // =================================================

        let cloudinary_url = null;
        let cloudinary_id = null;

        if (req.file) {

            if (
                !req.file.mimetype ||
                !req.file.mimetype
                    .startsWith("image/")
            ) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "O arquivo enviado deve ser uma imagem."

                });
            }

            imagemCloudinary =
                await enviarParaCloudinary(
                    req.file.buffer,
                    nome
                );

            cloudinary_url =
                imagemCloudinary.secure_url;

            cloudinary_id =
                imagemCloudinary.public_id;
        }

        // =================================================
        // INSERIR MYSQL
        // =================================================

        const [resultado] =
            await pool.query(
                `
                INSERT INTO clientes
                (
                    nome,
                    telefone,
                    email,
                    senha,
                    valor,
                    cloudinary_url,
                    cloudinary_id
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    nome,
                    telefone,
                    emailNormalizado,
                    senhaHash,
                    valorNormalizado,
                    cloudinary_url,
                    cloudinary_id
                ]
            );

        // =================================================
        // BUSCAR CLIENTE CRIADO
        // =================================================

        const [clientes] =
            await pool.query(
                `
                SELECT
                    id,
                    nome,
                    telefone,
                    email,
                    valor,
                    cloudinary_url,
                    cloudinary_id,
                    criado_em
                FROM clientes
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
                "Cliente cadastrado com sucesso.",

            cliente:
                clientes[0]

        });

    } catch (erro) {

        console.error(
            "Erro ao criar cliente:",
            erro
        );

        if (
            imagemCloudinary &&
            imagemCloudinary.public_id
        ) {

            await eliminarImagemCloudinary(
                imagemCloudinary.public_id
            );
        }

        if (
            erro.code === "ER_DUP_ENTRY"
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
                "Erro ao cadastrar cliente.",

            erro:
                process.env.NODE_ENV === "production"
                    ? undefined
                    : erro.message

        });
    }
};

// =====================================================
// LOGIN CLIENTE
// POST /api/clientes/login
//
// AGORA COM JWT
// =====================================================

export const loginCliente = async (
    req,
    res
) => {

    try {

        const body =
            req.body || {};

        const email =
            body.email !== undefined
                ? String(body.email)
                    .trim()
                    .toLowerCase()
                : "";

        const senha =
            body.senha !== undefined
                ? String(body.senha)
                : "";

        // =================================================
        // VALIDAR
        // =================================================

        if (!email) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "O email é obrigatório."

            });
        }

        if (!senha) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "A senha é obrigatória."

            });
        }

        // =================================================
        // BUSCAR CLIENTE
        // =================================================

        const [clientes] =
            await pool.query(
                `
                SELECT
                    id,
                    nome,
                    telefone,
                    email,
                    senha,
                    valor,
                    cloudinary_url,
                    cloudinary_id,
                    criado_em
                FROM clientes
                WHERE LOWER(email) = ?
                LIMIT 1
                `,
                [
                    email
                ]
            );

        if (clientes.length === 0) {

            return res.status(401).json({

                sucesso: false,

                mensagem:
                    "Email ou senha incorretos."

            });
        }

        const clienteBD =
            clientes[0];

        // =================================================
        // VERIFICAR SENHA
        // =================================================

        if (!clienteBD.senha) {

            return res.status(401).json({

                sucesso: false,

                mensagem:
                    "Este cliente não possui uma senha válida."

            });
        }

        const senhaValida =
            await bcrypt.compare(
                senha,
                clienteBD.senha
            );

        if (!senhaValida) {

            return res.status(401).json({

                sucesso: false,

                mensagem:
                    "Email ou senha incorretos."

            });
        }

        // =================================================
        // GERAR TOKEN
        // =================================================

        const token =
            gerarTokenCliente(
                clienteBD
            );

        // =================================================
        // DADOS DO CLIENTE
        // =================================================

        const cliente = {

            id:
                clienteBD.id,

            nome:
                clienteBD.nome,

            telefone:
                clienteBD.telefone,

            email:
                clienteBD.email,

            valor:
                clienteBD.valor,

            cloudinary_url:
                clienteBD.cloudinary_url,

            cloudinary_id:
                clienteBD.cloudinary_id,

            criado_em:
                clienteBD.criado_em,

            tipo:
                "cliente"

        };

        // =================================================
        // RESPOSTA
        // =================================================

        return res.status(200).json({

            sucesso: true,

            mensagem:
                "Login de cliente realizado com sucesso.",

            token,

            usuario:
                cliente,

            cliente,

            tipo:
                "cliente",

            redirecionar:
                "/cliente"

        });

    } catch (erro) {

        console.error(
            "Erro no login do cliente:",
            erro
        );

        return res.status(500).json({

            sucesso: false,

            mensagem:
                "Erro ao realizar login.",

            erro:
                process.env.NODE_ENV === "production"
                    ? undefined
                    : erro.message

        });
    }
};

// =====================================================
// ATUALIZAR CLIENTE
// PUT /api/clientes/:id
// =====================================================

export const atualizarCliente = async (
    req,
    res
) => {

    let novaImagemCloudinary = null;

    try {

        const { id } =
            req.params;

        if (!id) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "ID do cliente é obrigatório."

            });
        }

        // =================================================
        // BUSCAR CLIENTE
        // =================================================

        const [clientes] =
            await pool.query(
                `
                SELECT
                    id,
                    nome,
                    telefone,
                    email,
                    senha,
                    valor,
                    cloudinary_url,
                    cloudinary_id,
                    criado_em
                FROM clientes
                WHERE id = ?
                LIMIT 1
                `,
                [
                    id
                ]
            );

        if (clientes.length === 0) {

            return res.status(404).json({

                sucesso: false,

                mensagem:
                    "Cliente não encontrado."

            });
        }

        const clienteAtual =
            clientes[0];

        const body =
            req.body || {};

        // =================================================
        // NOME
        // =================================================

        const nomeFinal =
            body.nome !== undefined
                ? String(body.nome).trim()
                : clienteAtual.nome;

        if (!nomeFinal) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "O nome é obrigatório."

            });
        }

        // =================================================
        // TELEFONE
        // =================================================

        const telefoneFinal =
            body.telefone !== undefined
                ? String(body.telefone).trim()
                : clienteAtual.telefone;

        if (!telefoneFinal) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "O telefone é obrigatório."

            });
        }

        // =================================================
        // EMAIL
        // =================================================

        let emailFinal;

        if (body.email !== undefined) {

            const emailRecebido =
                String(body.email).trim();

            emailFinal =
                emailRecebido
                    ? emailRecebido.toLowerCase()
                    : null;

        } else {

            emailFinal =
                clienteAtual.email;
        }

        // =================================================
        // VERIFICAR EMAIL
        // =================================================

        if (
            emailFinal &&
            emailFinal !== clienteAtual.email
        ) {

            const [existente] =
                await pool.query(
                    `
                    SELECT id
                    FROM clientes
                    WHERE LOWER(email) = ?
                    AND id <> ?
                    LIMIT 1
                    `,
                    [
                        emailFinal,
                        id
                    ]
                );

            if (existente.length > 0) {

                return res.status(409).json({

                    sucesso: false,

                    mensagem:
                        "Este email já está cadastrado."

                });
            }
        }

        // =================================================
        // VALOR
        // =================================================

        let valorFinal =
            clienteAtual.valor;

        if (
            body.valor !== undefined
        ) {

            const valorNormalizado =
                normalizarValor(
                    body.valor,
                    null
                );

            if (
                valorNormalizado &&
                valorNormalizado.erro
            ) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "O valor informado é inválido."

                });
            }

            valorFinal =
                valorNormalizado;
        }

        // =================================================
        // SENHA
        // =================================================

        let senhaFinal =
            clienteAtual.senha;

        if (
            body.senha !== undefined &&
            String(body.senha).trim() !== ""
        ) {

            const novaSenha =
                String(body.senha);

            if (novaSenha.length < 6) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "A senha deve ter pelo menos 6 caracteres."

                });
            }

            senhaFinal =
                await bcrypt.hash(
                    novaSenha,
                    12
                );
        }

        // =================================================
        // IMAGEM
        // =================================================

        let cloudinary_url =
            clienteAtual.cloudinary_url;

        let cloudinary_id =
            clienteAtual.cloudinary_id;

        if (req.file) {

            if (
                !req.file.mimetype ||
                !req.file.mimetype
                    .startsWith("image/")
            ) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "O arquivo enviado deve ser uma imagem."

                });
            }

            novaImagemCloudinary =
                await enviarParaCloudinary(
                    req.file.buffer,
                    nomeFinal
                );

            cloudinary_url =
                novaImagemCloudinary.secure_url;

            cloudinary_id =
                novaImagemCloudinary.public_id;
        }

        // =================================================
        // ATUALIZAR MYSQL
        // =================================================

        await pool.query(
            `
            UPDATE clientes
            SET
                nome = ?,
                telefone = ?,
                email = ?,
                senha = ?,
                valor = ?,
                cloudinary_url = ?,
                cloudinary_id = ?
            WHERE id = ?
            `,
            [
                nomeFinal,
                telefoneFinal,
                emailFinal,
                senhaFinal,
                valorFinal,
                cloudinary_url,
                cloudinary_id,
                id
            ]
        );

        // =================================================
        // APAGAR IMAGEM ANTIGA
        // =================================================

        if (
            req.file &&
            clienteAtual.cloudinary_id &&
            clienteAtual.cloudinary_id !== cloudinary_id
        ) {

            await eliminarImagemCloudinary(
                clienteAtual.cloudinary_id
            );
        }

        // =================================================
        // BUSCAR CLIENTE ATUALIZADO
        // =================================================

        const [clientesAtualizados] =
            await pool.query(
                `
                SELECT
                    id,
                    nome,
                    telefone,
                    email,
                    valor,
                    cloudinary_url,
                    cloudinary_id,
                    criado_em
                FROM clientes
                WHERE id = ?
                LIMIT 1
                `,
                [
                    id
                ]
            );

        return res.status(200).json({

            sucesso: true,

            mensagem:
                "Cliente atualizado com sucesso.",

            cliente:
                clientesAtualizados[0]

        });

    } catch (erro) {

        console.error(
            "Erro ao atualizar cliente:",
            erro
        );

        if (
            novaImagemCloudinary &&
            novaImagemCloudinary.public_id
        ) {

            await eliminarImagemCloudinary(
                novaImagemCloudinary.public_id
            );
        }

        if (
            erro.code === "ER_DUP_ENTRY"
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
                "Erro ao atualizar cliente.",

            erro:
                process.env.NODE_ENV === "production"
                    ? undefined
                    : erro.message

        });
    }
};

// =====================================================
// ELIMINAR CLIENTE
// DELETE /api/clientes/:id
// =====================================================

export const eliminarCliente = async (
    req,
    res
) => {

    try {

        const { id } =
            req.params;

        if (!id) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "ID do cliente é obrigatório."

            });
        }

        const [clientes] =
            await pool.query(
                `
                SELECT
                    id,
                    cloudinary_id
                FROM clientes
                WHERE id = ?
                LIMIT 1
                `,
                [
                    id
                ]
            );

        if (clientes.length === 0) {

            return res.status(404).json({

                sucesso: false,

                mensagem:
                    "Cliente não encontrado."

            });
        }

        const cliente =
            clientes[0];

        await pool.query(
            `
            DELETE FROM clientes
            WHERE id = ?
            `,
            [
                id
            ]
        );

        if (cliente.cloudinary_id) {

            await eliminarImagemCloudinary(
                cliente.cloudinary_id
            );
        }

        return res.status(200).json({

            sucesso: true,

            mensagem:
                "Cliente eliminado com sucesso.",

            id

        });

    } catch (erro) {

        console.error(
            "Erro ao eliminar cliente:",
            erro
        );

        return res.status(500).json({

            sucesso: false,

            mensagem:
                "Erro ao eliminar cliente.",

            erro:
                process.env.NODE_ENV === "production"
                    ? undefined
                    : erro.message

        });
    }
};

// =====================================================
// MEU PERFIL
// GET /api/clientes/meu-perfil
//
// PROTEGIDO POR JWT
// =====================================================

export const meuPerfil = async (
    req,
    res
) => {

    try {

        // =================================================
        // ID VEM DO TOKEN
        // =================================================

        const clienteId =
            req.cliente?.id ||
            req.usuario?.id ||
            req.user?.id;

        if (!clienteId) {

            return res.status(401).json({

                sucesso: false,

                mensagem:
                    "Cliente não autenticado."

            });
        }

        // =================================================
        // BUSCAR CLIENTE
        // =================================================

        const [clientes] =
            await pool.query(
                `
                SELECT
                    id,
                    nome,
                    telefone,
                    email,
                    valor,
                    cloudinary_url,
                    cloudinary_id,
                    criado_em
                FROM clientes
                WHERE id = ?
                LIMIT 1
                `,
                [
                    clienteId
                ]
            );

        if (clientes.length === 0) {

            return res.status(404).json({

                sucesso: false,

                mensagem:
                    "Cliente não encontrado."

            });
        }

        return res.status(200).json({

            sucesso: true,

            cliente:
                clientes[0]

        });

    } catch (erro) {

        console.error(
            "Erro ao carregar perfil:",
            erro
        );

        return res.status(500).json({

            sucesso: false,

            mensagem:
                "Erro ao carregar perfil.",

            erro:
                process.env.NODE_ENV === "production"
                    ? undefined
                    : erro.message

        });
    }
};

// =====================================================
// EXPORT DEFAULT
// =====================================================

export default {

    listarClientes,

    buscarCliente,

    criarCliente,

    loginCliente,

    atualizarCliente,

    eliminarCliente,

    meuPerfil

};