
import pool from "../config/database.js";
import cloudinary from "../config/cloudinary.js";

// =====================================================
// NORMALIZAR ID
// =====================================================

const validarId = (id) => {
    const numero = Number(id);

    if (!Number.isInteger(numero) || numero <= 0) {
        return null;
    }

    return numero;
};

// =====================================================
// CONVERTER VALOR NUMÉRICO
// =====================================================

const converterNumero = (valor) => {
    if (
        valor === undefined ||
        valor === null ||
        valor === ""
    ) {
        return null;
    }

    const numero = Number(
        String(valor).replace(",", ".")
    );

    return Number.isFinite(numero)
        ? numero
        : null;
};

// =====================================================
// CONVERTER INTEIRO
// =====================================================

const converterInteiro = (valor) => {
    if (
        valor === undefined ||
        valor === null ||
        valor === ""
    ) {
        return null;
    }

    const numero = Number(valor);

    return Number.isInteger(numero)
        ? numero
        : null;
};

// =====================================================
// OBTER BODY
// =====================================================

const obterBody = (req) => {
    if (
        req.body &&
        typeof req.body === "object"
    ) {
        return req.body;
    }

    return {};
};

// =====================================================
// NORMALIZAR TEXTO
// =====================================================

const normalizarTexto = (valor) => {
    if (
        valor === undefined ||
        valor === null
    ) {
        return "";
    }

    return String(valor).trim();
};

// =====================================================
// BUSCAR PRODUTO POR ID
// =====================================================

const buscarProdutoPorId = async (id) => {
    const [produtos] = await pool.query(
        `
        SELECT
            p.id,
            p.nome,
            p.descricao,
            p.preco,
            p.estoque,
            p.cloudinary_url,
            p.cloudinary_id,
            p.categoria_id,
            p.criado_em,
            p.atualizado_em,

            c.nome AS categoria,
            c.descricao AS categoria_descricao

        FROM produtos p

        LEFT JOIN categorias c
            ON c.id = p.categoria_id

        WHERE p.id = ?

        LIMIT 1
        `,
        [id]
    );

    return produtos.length > 0
        ? produtos[0]
        : null;
};

// =====================================================
// VALIDAR CATEGORIA
// =====================================================

const validarCategoria = async (categoria_id) => {
    if (
        categoria_id === null ||
        categoria_id === undefined
    ) {
        return true;
    }

    const [categorias] = await pool.query(
        `
        SELECT id
        FROM categorias
        WHERE id = ?
        LIMIT 1
        `,
        [categoria_id]
    );

    return categorias.length > 0;
};

// =====================================================
// ENVIAR BUFFER PARA CLOUDINARY
// =====================================================

const enviarParaCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        if (!buffer) {
            return reject(
                new Error(
                    "Buffer da imagem não encontrado."
                )
            );
        }

        const uploadStream =
            cloudinary.uploader.upload_stream(
                {
                    folder: "produtos",

                    resource_type: "image",

                    transformation: [
                        {
                            width: 1200,
                            height: 1200,
                            crop: "limit",
                            quality: "auto",
                            fetch_format: "auto",
                        },
                    ],
                },
                (erro, resultado) => {
                    if (erro) {
                        return reject(erro);
                    }

                    if (!resultado) {
                        return reject(
                            new Error(
                                "Cloudinary não retornou o resultado do upload."
                            )
                        );
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
        await cloudinary.uploader.destroy(
            publicId,
            {
                resource_type: "image",
            }
        );

        console.log(
            "Imagem removida do Cloudinary:",
            publicId
        );
    } catch (erro) {
        console.error(
            "Erro ao remover imagem do Cloudinary:",
            erro
        );
    }
};

// =====================================================
// LISTAR PRODUTOS
// GET /api/produtos
// =====================================================

const listarProdutos = async (req, res) => {
    try {
        const [produtos] = await pool.query(
            `
            SELECT
                p.id,
                p.nome,
                p.descricao,
                p.preco,
                p.estoque,
                p.cloudinary_url,
                p.cloudinary_id,
                p.categoria_id,
                p.criado_em,
                p.atualizado_em,

                c.nome AS categoria,
                c.descricao AS categoria_descricao

            FROM produtos p

            LEFT JOIN categorias c
                ON c.id = p.categoria_id

            ORDER BY p.id DESC
            `
        );

        return res.status(200).json({
            sucesso: true,
            produtos,
        });

    } catch (erro) {
        console.error(
            "Erro ao listar produtos:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao carregar produtos.",
            erro:
                process.env.NODE_ENV === "production"
                    ? undefined
                    : erro.message,
        });
    }
};

// =====================================================
// BUSCAR PRODUTO
// GET /api/produtos/:id
// =====================================================

const buscarProduto = async (req, res) => {
    try {
        const id = validarId(
            req.params.id
        );

        if (!id) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID do produto inválido.",
            });
        }

        const produto =
            await buscarProdutoPorId(id);

        if (!produto) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Produto não encontrado.",
            });
        }

        return res.status(200).json({
            sucesso: true,
            produto,
        });

    } catch (erro) {
        console.error(
            "Erro ao buscar produto:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao buscar produto.",
            erro:
                process.env.NODE_ENV === "production"
                    ? undefined
                    : erro.message,
        });
    }
};

// =====================================================
// CRIAR PRODUTO
// POST /api/produtos
// =====================================================

const criarProduto = async (req, res) => {
    let imagemCloudinaryNova = null;

    try {
        console.log(
            "======================================"
        );

        console.log(
            "CRIAR PRODUTO"
        );

        console.log(
            "Content-Type:",
            req.headers["content-type"]
        );

        console.log(
            "BODY:",
            req.body
        );

        console.log(
            "ARQUIVO:",
            req.file
                ? {
                    originalname:
                        req.file.originalname,
                    mimetype:
                        req.file.mimetype,
                    size:
                        req.file.size,
                }
                : null
        );

        console.log(
            "======================================"
        );

        const body = obterBody(req);

        // =================================================
        // NOME
        // =================================================

        const nomeRecebido =
            body.nome ??
            body.nomeProduto ??
            body.productName ??
            "";

        const nome =
            normalizarTexto(
                nomeRecebido
            );

        if (!nome) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O nome do produto é obrigatório.",
                campo: "nome",
            });
        }

        // =================================================
        // DESCRIÇÃO
        // =================================================

        const descricaoRecebida =
            body.descricao ??
            body.description ??
            "";

        const descricao =
            normalizarTexto(
                descricaoRecebida
            );

        // =================================================
        // PREÇO
        // =================================================

        const precoRecebido =
            body.preco ??
            body.precoProduto ??
            body.price ??
            "";

        const preco =
            converterNumero(
                precoRecebido
            );

        if (
            preco === null ||
            preco < 0
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Informe um preço válido.",
                campo: "preco",
            });
        }

        // =================================================
        // ESTOQUE
        // =================================================

        const estoqueRecebido =
            body.estoque ??
            body.quantidade ??
            body.stock ??
            body.quantity ??
            "";

        const estoque =
            converterInteiro(
                estoqueRecebido
            );

        if (
            estoque === null ||
            estoque < 0
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Informe uma quantidade de estoque válida.",
                campo: "estoque",
            });
        }

        // =================================================
        // CATEGORIA
        // =================================================

        const categoriaRecebida =
            body.categoria_id ??
            body.categoriaId ??
            "";

        let categoria_id = null;

        if (
            categoriaRecebida !== undefined &&
            categoriaRecebida !== null &&
            String(
                categoriaRecebida
            ).trim() !== ""
        ) {
            categoria_id =
                converterInteiro(
                    categoriaRecebida
                );

            if (
                categoria_id === null ||
                categoria_id <= 0
            ) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem:
                        "Categoria inválida.",
                    campo:
                        "categoria_id",
                });
            }

            const categoriaExiste =
                await validarCategoria(
                    categoria_id
                );

            if (!categoriaExiste) {
                return res.status(404).json({
                    sucesso: false,
                    mensagem:
                        "A categoria selecionada não existe.",
                });
            }
        }

        // =================================================
        // CLOUDINARY
        // =================================================

        let cloudinary_id = null;
        let cloudinary_url = null;

        if (req.file) {
            console.log(
                "Enviando imagem para Cloudinary..."
            );

            const resultadoCloudinary =
                await enviarParaCloudinary(
                    req.file.buffer
                );

            cloudinary_id =
                resultadoCloudinary.public_id;

            cloudinary_url =
                resultadoCloudinary.secure_url;

            imagemCloudinaryNova =
                cloudinary_id;

            console.log(
                "Imagem enviada com sucesso."
            );

            console.log(
                "Cloudinary ID:",
                cloudinary_id
            );

            console.log(
                "Cloudinary URL:",
                cloudinary_url
            );
        }

        // =================================================
        // INSERIR NO MYSQL
        // =================================================

        const [resultado] =
            await pool.query(
                `
                INSERT INTO produtos
                (
                    nome,
                    descricao,
                    preco,
                    estoque,
                    categoria_id,
                    cloudinary_url,
                    cloudinary_id
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    nome,
                    descricao || null,
                    preco,
                    estoque,
                    categoria_id,
                    cloudinary_url,
                    cloudinary_id,
                ]
            );

        // =================================================
        // BUSCAR PRODUTO CRIADO
        // =================================================

        const produtoCriado =
            await buscarProdutoPorId(
                resultado.insertId
            );

        imagemCloudinaryNova = null;

        return res.status(201).json({
            sucesso: true,

            mensagem:
                "Produto cadastrado com sucesso.",

            produto:
                produtoCriado,
        });

    } catch (erro) {
        console.error(
            "======================================"
        );

        console.error(
            "ERRO AO CADASTRAR PRODUTO"
        );

        console.error(erro);

        console.error(
            "======================================"
        );

        // =================================================
        // SE O MYSQL FALHAR DEPOIS DO UPLOAD,
        // REMOVER A IMAGEM NOVA DO CLOUDINARY
        // =================================================

        if (imagemCloudinaryNova) {
            await eliminarImagemCloudinary(
                imagemCloudinaryNova
            );
        }

        // =================================================
        // DUPLICIDADE
        // =================================================

        if (
            erro.code ===
            "ER_DUP_ENTRY"
        ) {
            return res.status(409).json({
                sucesso: false,
                mensagem:
                    "Já existe um produto com esses dados.",
            });
        }

        // =================================================
        // CHAVE ESTRANGEIRA
        // =================================================

        if (
            erro.code ===
                "ER_NO_REFERENCED_ROW_2" ||
            erro.code ===
                "ER_NO_REFERENCED_ROW"
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "A categoria selecionada não existe.",
            });
        }

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao cadastrar produto.",
            erro:
                process.env.NODE_ENV ===
                "production"
                    ? undefined
                    : erro.message,
        });
    }
};

// =====================================================
// ATUALIZAR PRODUTO
// PUT /api/produtos/:id
// =====================================================

const atualizarProduto = async (
    req,
    res
) => {
    let novaImagemCloudinary = null;

    try {
        const id = validarId(
            req.params.id
        );

        if (!id) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID do produto inválido.",
            });
        }

        // =================================================
        // BUSCAR PRODUTO ATUAL
        // =================================================

        const produtoAtual =
            await buscarProdutoPorId(id);

        if (!produtoAtual) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Produto não encontrado.",
            });
        }

        const body =
            obterBody(req);

        // =================================================
        // NOME
        // =================================================

        const nomeRecebido =
            body.nome ??
            body.nomeProduto ??
            body.productName ??
            produtoAtual.nome;

        const nome =
            normalizarTexto(
                nomeRecebido
            );

        if (!nome) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O nome do produto é obrigatório.",
                campo: "nome",
            });
        }

        // =================================================
        // DESCRIÇÃO
        // =================================================

        const descricaoRecebida =
            body.descricao ??
            body.description ??
            produtoAtual.descricao ??
            "";

        const descricao =
            normalizarTexto(
                descricaoRecebida
            );

        // =================================================
        // PREÇO
        // =================================================

        const precoRecebido =
            body.preco ??
            body.precoProduto ??
            body.price ??
            produtoAtual.preco;

        const preco =
            converterNumero(
                precoRecebido
            );

        if (
            preco === null ||
            preco < 0
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Informe um preço válido.",
                campo: "preco",
            });
        }

        // =================================================
        // ESTOQUE
        // =================================================

        const estoqueRecebido =
            body.estoque ??
            body.quantidade ??
            body.stock ??
            body.quantity ??
            produtoAtual.estoque;

        const estoque =
            converterInteiro(
                estoqueRecebido
            );

        if (
            estoque === null ||
            estoque < 0
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Informe uma quantidade de estoque válida.",
                campo: "estoque",
            });
        }

        // =================================================
        // CATEGORIA
        // =================================================

        let categoria_id =
            produtoAtual.categoria_id ??
            null;

        const categoriaFoiEnviada =
            body.categoria_id !==
                undefined ||
            body.categoriaId !==
                undefined;

        if (categoriaFoiEnviada) {
            const categoriaRecebida =
                body.categoria_id ??
                body.categoriaId;

            if (
                categoriaRecebida === null ||
                String(
                    categoriaRecebida
                ).trim() === ""
            ) {
                categoria_id = null;

            } else {
                categoria_id =
                    converterInteiro(
                        categoriaRecebida
                    );

                if (
                    categoria_id === null ||
                    categoria_id <= 0
                ) {
                    return res.status(400).json({
                        sucesso: false,
                        mensagem:
                            "Categoria inválida.",
                        campo:
                            "categoria_id",
                    });
                }

                const categoriaExiste =
                    await validarCategoria(
                        categoria_id
                    );

                if (!categoriaExiste) {
                    return res.status(404).json({
                        sucesso: false,
                        mensagem:
                            "A categoria selecionada não existe.",
                    });
                }
            }
        }

        // =================================================
        // IMAGEM ATUAL
        // =================================================

        let cloudinary_id =
            produtoAtual.cloudinary_id ??
            null;

        let cloudinary_url =
            produtoAtual.cloudinary_url ??
            null;

        const imagemAntigaId =
            cloudinary_id;

        // =================================================
        // NOVA IMAGEM
        // =================================================

        if (req.file) {
            console.log(
                "Nova imagem recebida."
            );

            console.log(
                "Enviando nova imagem para Cloudinary..."
            );

            const resultadoCloudinary =
                await enviarParaCloudinary(
                    req.file.buffer
                );

            cloudinary_id =
                resultadoCloudinary.public_id;

            cloudinary_url =
                resultadoCloudinary.secure_url;

            novaImagemCloudinary =
                cloudinary_id;

            console.log(
                "Nova imagem enviada:"
            );

            console.log(
                cloudinary_id
            );

            // =================================================
            // ATUALIZAR MYSQL PRIMEIRO
            // =================================================

            await pool.query(
                `
                UPDATE produtos

                SET
                    nome = ?,
                    descricao = ?,
                    preco = ?,
                    estoque = ?,
                    categoria_id = ?,
                    cloudinary_url = ?,
                    cloudinary_id = ?

                WHERE id = ?
                `,
                [
                    nome,
                    descricao || null,
                    preco,
                    estoque,
                    categoria_id,
                    cloudinary_url,
                    cloudinary_id,
                    id,
                ]
            );

            novaImagemCloudinary = null;

            // =================================================
            // REMOVER IMAGEM ANTIGA
            // =================================================

            if (
                imagemAntigaId &&
                imagemAntigaId !==
                    cloudinary_id
            ) {
                await eliminarImagemCloudinary(
                    imagemAntigaId
                );
            }

        } else {
            // =================================================
            // ATUALIZAR SEM ALTERAR IMAGEM
            // =================================================

            await pool.query(
                `
                UPDATE produtos

                SET
                    nome = ?,
                    descricao = ?,
                    preco = ?,
                    estoque = ?,
                    categoria_id = ?,
                    cloudinary_url = ?,
                    cloudinary_id = ?

                WHERE id = ?
                `,
                [
                    nome,
                    descricao || null,
                    preco,
                    estoque,
                    categoria_id,
                    cloudinary_url,
                    cloudinary_id,
                    id,
                ]
            );
        }

        // =================================================
        // BUSCAR ATUALIZADO
        // =================================================

        const produtoAtualizado =
            await buscarProdutoPorId(id);

        return res.status(200).json({
            sucesso: true,
            mensagem:
                "Produto atualizado com sucesso.",
            produto:
                produtoAtualizado,
        });

    } catch (erro) {
        console.error(
            "Erro ao atualizar produto:",
            erro
        );

        // =================================================
        // SE A ATUALIZAÇÃO FALHAR,
        // REMOVER A NOVA IMAGEM
        // =================================================

        if (novaImagemCloudinary) {
            await eliminarImagemCloudinary(
                novaImagemCloudinary
            );
        }

        // =================================================
        // ERRO DE DUPLICIDADE
        // =================================================

        if (
            erro.code ===
            "ER_DUP_ENTRY"
        ) {
            return res.status(409).json({
                sucesso: false,
                mensagem:
                    "Já existe um produto com esses dados.",
            });
        }

        // =================================================
        // ERRO DE CHAVE ESTRANGEIRA
        // =================================================

        if (
            erro.code ===
                "ER_NO_REFERENCED_ROW_2" ||
            erro.code ===
                "ER_NO_REFERENCED_ROW"
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "A categoria selecionada não existe.",
            });
        }

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao atualizar produto.",
            erro:
                process.env.NODE_ENV ===
                "production"
                    ? undefined
                    : erro.message,
        });
    }
};

// =====================================================
// ELIMINAR PRODUTO
// DELETE /api/produtos/:id
// =====================================================

const eliminarProduto = async (
    req,
    res
) => {
    try {
        const id = validarId(
            req.params.id
        );

        if (!id) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID do produto inválido.",
            });
        }

        // =================================================
        // BUSCAR PRODUTO
        // =================================================

        const produto =
            await buscarProdutoPorId(id);

        if (!produto) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Produto não encontrado.",
            });
        }

        // =================================================
        // APAGAR DO MYSQL
        // =================================================

        await pool.query(
            `
            DELETE FROM produtos
            WHERE id = ?
            `,
            [id]
        );

        // =================================================
        // APAGAR IMAGEM DO CLOUDINARY
        // =================================================

        if (
            produto.cloudinary_id
        ) {
            await eliminarImagemCloudinary(
                produto.cloudinary_id
            );
        }

        return res.status(200).json({
            sucesso: true,

            mensagem:
                "Produto eliminado com sucesso.",

            id,

            imagem: {
                cloudinary_id:
                    produto.cloudinary_id ||
                    null,

                cloudinary_url:
                    produto.cloudinary_url ||
                    null,
            },
        });

    } catch (erro) {
        console.error(
            "Erro ao eliminar produto:",
            erro
        );

        // =================================================
        // RESTRIÇÃO DE CHAVE ESTRANGEIRA
        // =================================================

        if (
            erro.code ===
            "ER_ROW_IS_REFERENCED_2"
        ) {
            return res.status(409).json({
                sucesso: false,
                mensagem:
                    "Não é possível eliminar este produto porque ele está associado a outros registos.",
            });
        }

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao eliminar produto.",
            erro:
                process.env.NODE_ENV ===
                "production"
                    ? undefined
                    : erro.message,
        });
    }
};

// =====================================================
// EXPORTAR FUNÇÕES
// =====================================================

export {
    listarProdutos,
    buscarProduto,
    criarProduto,
    atualizarProduto,
    eliminarProduto,
};

export default {
    listarProdutos,
    buscarProduto,
    criarProduto,
    atualizarProduto,
    eliminarProduto,
};
