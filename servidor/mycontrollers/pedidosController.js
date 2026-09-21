
import pool from "../config/database.js";

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

const validarId = (valor) => {
    const numero = Number(valor);

    if (!Number.isInteger(numero) || numero <= 0) {
        return null;
    }

    return numero;
};

const erroResposta = (erro) => {
    return process.env.NODE_ENV === "production"
        ? undefined
        : erro?.message;
};

// =====================================================
// NORMALIZAR STATUS DO PEDIDO
// =====================================================

const normalizarStatusPedido = (valor) => {
    const status = String(valor ?? "")
        .trim()
        .toLowerCase();

    const mapa = {
        pendente: "pendente",

        confirmado: "confirmado",

        processando: "processando",
        "em preparação": "processando",
        "em preparacao": "processando",

        concluido: "concluido",
        concluído: "concluido",

        cancelado: "cancelado"
    };

    return mapa[status] || null;
};

// =====================================================
// NORMALIZAR STATUS DE PAGAMENTO
// =====================================================

const normalizarStatusPagamento = (valor) => {
    const status = String(valor ?? "")
        .trim()
        .toLowerCase();

    const mapa = {
        pendente: "Pendente",
        pago: "Pago",
        falhou: "Falhou",
        cancelado: "Cancelado"
    };

    return mapa[status] || null;
};

// =====================================================
// BUSCAR PEDIDO COMPLETO POR ID
// =====================================================

const buscarPedidoCompletoPorId = async (
    pedidoId,
    connection = pool
) => {
    const [pedidos] = await connection.query(
        `
        SELECT
            p.id,
            p.cliente_id,

            c.nome AS cliente_nome,
            c.telefone AS cliente_telefone,
            c.email AS cliente_email,

            p.total,
            p.status,
            p.status_pagamento,

            p.criado_em,
            p.atualizado_em

        FROM pedidos p

        INNER JOIN clientes c
            ON c.id = p.cliente_id

        WHERE p.id = ?

        LIMIT 1
        `,
        [pedidoId]
    );

    if (pedidos.length === 0) {
        return null;
    }

    const [itens] = await connection.query(
        `
        SELECT
            pi.id,
            pi.pedido_id,
            pi.produto_id,

            pr.nome AS produto_nome,
            pr.descricao AS produto_descricao,
            pr.cloudinary_url,

            pi.quantidade,
            pi.preco,

            CASE
                WHEN pi.subtotal IS NOT NULL
                THEN pi.subtotal
                ELSE ROUND(pi.quantidade * pi.preco, 2)
            END AS subtotal,

            pi.criado_em

        FROM pedido_itens pi

        INNER JOIN produtos pr
            ON pr.id = pi.produto_id

        WHERE pi.pedido_id = ?

        ORDER BY pi.id ASC
        `,
        [pedidoId]
    );

    return {
        ...pedidos[0],
        itens
    };
};

// =====================================================
// CRIAR PEDIDO
// POST /api/pedidos
// =====================================================

export const criarPedido = async (req, res) => {
    let connection = null;
    let transacaoIniciada = false;

    try {
        console.log("======================================");
        console.log("CRIAR PEDIDO");
        console.log("BODY RECEBIDO:", req.body);
        console.log("======================================");

        const body = req.body || {};

        const cliente_id = body.cliente_id;

        const produtosRecebidos =
            body.produtos ??
            body.itens;

        // =====================================================
        // VALIDAR CLIENTE
        // =====================================================

        const clienteId = validarId(cliente_id);

        if (!clienteId) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O cliente_id é obrigatório e deve ser válido."
            });
        }

        // =====================================================
        // VALIDAR PRODUTOS
        // =====================================================

        if (!Array.isArray(produtosRecebidos)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Os produtos devem ser enviados como uma lista."
            });
        }

        if (produtosRecebidos.length === 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Selecione pelo menos um produto."
            });
        }

        // =====================================================
        // VERIFICAR CLIENTE
        // =====================================================

        const [clientes] = await pool.query(
            `
            SELECT
                id,
                nome,
                telefone,
                email

            FROM clientes

            WHERE id = ?

            LIMIT 1
            `,
            [clienteId]
        );

        if (clientes.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Cliente não encontrado."
            });
        }

        // =====================================================
        // NORMALIZAR PRODUTOS
        // =====================================================

        const mapaProdutos = new Map();

        for (const item of produtosRecebidos) {
            if (!item || typeof item !== "object") {
                return res.status(400).json({
                    sucesso: false,
                    mensagem:
                        "Um dos itens do pedido é inválido."
                });
            }

            const produtoId = validarId(
                item.produto_id ??
                item.produtoId ??
                item.id
            );

            const quantidade = Number(
                item.quantidade ??
                item.qtd ??
                0
            );

            if (!produtoId) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem:
                        "Um dos produtos possui um ID inválido."
                });
            }

            if (
                !Number.isInteger(quantidade) ||
                quantidade <= 0
            ) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem:
                        `A quantidade do produto ${produtoId} deve ser maior que zero.`
                });
            }

            if (mapaProdutos.has(produtoId)) {
                mapaProdutos.set(
                    produtoId,
                    mapaProdutos.get(produtoId) + quantidade
                );
            } else {
                mapaProdutos.set(
                    produtoId,
                    quantidade
                );
            }
        }

        const produtosAgrupados =
            Array.from(mapaProdutos.entries())
                .map(([produto_id, quantidade]) => ({
                    produto_id,
                    quantidade
                }));

        if (produtosAgrupados.length === 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Nenhum produto foi selecionado."
            });
        }

        // =====================================================
        // INICIAR TRANSAÇÃO
        // =====================================================

        connection = await pool.getConnection();

        await connection.beginTransaction();

        transacaoIniciada = true;

        // =====================================================
        // BUSCAR PRODUTOS COM BLOQUEIO
        // =====================================================

        const idsProdutos =
            produtosAgrupados.map(
                item => item.produto_id
            );

        const placeholders =
            idsProdutos.map(() => "?").join(",");

        const [produtosBD] =
            await connection.query(
                `
                SELECT
                    id,
                    nome,
                    descricao,
                    preco,
                    estoque,
                    categoria_id,
                    cloudinary_url,
                    cloudinary_id,
                    criado_em,
                    atualizado_em

                FROM produtos

                WHERE id IN (${placeholders})

                FOR UPDATE
                `,
                idsProdutos
            );

        // =====================================================
        // MAPEAR PRODUTOS
        // =====================================================

        const mapaProdutosBD = new Map();

        for (const produto of produtosBD) {
            mapaProdutosBD.set(
                Number(produto.id),
                produto
            );
        }

        // =====================================================
        // VERIFICAR PRODUTOS
        // =====================================================

        for (const item of produtosAgrupados) {
            const produtoId = item.produto_id;

            if (!mapaProdutosBD.has(produtoId)) {
                throw new Error(
                    `O produto com ID ${produtoId} não foi encontrado.`
                );
            }
        }

        // =====================================================
        // CALCULAR TOTAL
        // =====================================================

        let total = 0;

        const itensPedido = [];

        for (const item of produtosAgrupados) {
            const produtoId = item.produto_id;
            const quantidade = item.quantidade;

            const produto =
                mapaProdutosBD.get(produtoId);

            const preco = Number(produto.preco);
            const estoque = Number(produto.estoque);

            if (
                !Number.isFinite(preco) ||
                preco < 0
            ) {
                throw new Error(
                    `O preço do produto "${produto.nome}" é inválido.`
                );
            }

            if (
                !Number.isFinite(estoque) ||
                estoque < 0
            ) {
                throw new Error(
                    `O estoque do produto "${produto.nome}" é inválido.`
                );
            }

            if (quantidade > estoque) {
                throw new Error(
                    `Stock insuficiente para o produto "${produto.nome}". Stock disponível: ${estoque}.`
                );
            }

            const subtotal = Number(
                (preco * quantidade).toFixed(2)
            );

            total += subtotal;

            itensPedido.push({
                produto_id: produtoId,
                quantidade,
                preco,
                subtotal
            });
        }

        total = Number(
            total.toFixed(2)
        );

        // =====================================================
        // CRIAR PEDIDO
        // =====================================================

        const [resultadoPedido] =
            await connection.query(
                `
                INSERT INTO pedidos
                (
                    cliente_id,
                    total,
                    status,
                    status_pagamento
                )

                VALUES (?, ?, ?, ?)
                `,
                [
                    clienteId,
                    total,
                    "pendente",
                    "Pendente"
                ]
            );

        const pedidoId =
            resultadoPedido.insertId;

        // =====================================================
        // INSERIR ITENS
        // =====================================================
        //
        // IMPORTANTE:
        //
        // A coluna "subtotal" da tabela pedido_itens
        // é GENERATED pelo MySQL.
        //
        // Portanto NÃO enviamos subtotal no INSERT.
        //
        // O MySQL calcula:
        //
        // subtotal = quantidade * preco
        //
        // =====================================================

        for (const item of itensPedido) {
            await connection.query(
                `
                INSERT INTO pedido_itens
                (
                    pedido_id,
                    produto_id,
                    quantidade,
                    preco
                )

                VALUES (?, ?, ?, ?)
                `,
                [
                    pedidoId,
                    item.produto_id,
                    item.quantidade,
                    item.preco
                ]
            );
        }

        // =====================================================
        // ATUALIZAR ESTOQUE
        // =====================================================

        for (const item of itensPedido) {
            const [resultadoEstoque] =
                await connection.query(
                    `
                    UPDATE produtos

                    SET estoque = estoque - ?

                    WHERE id = ?

                    AND estoque >= ?
                    `,
                    [
                        item.quantidade,
                        item.produto_id,
                        item.quantidade
                    ]
                );

            if (
                resultadoEstoque.affectedRows === 0
            ) {
                throw new Error(
                    `Não foi possível atualizar o estoque do produto ID ${item.produto_id}.`
                );
            }
        }

        // =====================================================
        // COMMIT
        // =====================================================

        await connection.commit();

        transacaoIniciada = false;

        connection.release();
        connection = null;

        // =====================================================
        // BUSCAR PEDIDO CRIADO
        // =====================================================

        const pedido =
            await buscarPedidoCompletoPorId(
                pedidoId
            );

        return res.status(201).json({
            sucesso: true,
            mensagem:
                "Pedido criado com sucesso.",
            pedido
        });

    } catch (erro) {
        console.error(
            "======================================"
        );

        console.error(
            "ERRO AO CRIAR PEDIDO"
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
            "======================================"
        );

        if (
            connection &&
            transacaoIniciada
        ) {
            try {
                await connection.rollback();
            } catch (rollbackErro) {
                console.error(
                    "Erro no rollback:",
                    rollbackErro
                );
            }
        }

        if (connection) {
            connection.release();
            connection = null;
        }

        if (
            erro.code ===
            "ER_NO_REFERENCED_ROW_2"
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O cliente ou produto informado não existe."
            });
        }

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao criar pedido.",
            erro: erroResposta(erro)
        });
    }
};

// =====================================================
// LISTAR TODOS OS PEDIDOS
// GET /api/pedidos
// =====================================================

export const listarPedidos = async (req, res) => {
    try {
        const [pedidos] =
            await pool.query(
                `
                SELECT
                    p.id,
                    p.cliente_id,

                    c.nome AS cliente_nome,
                    c.telefone AS cliente_telefone,
                    c.email AS cliente_email,

                    p.total,
                    p.status,
                    p.status_pagamento,

                    p.criado_em,
                    p.atualizado_em

                FROM pedidos p

                INNER JOIN clientes c
                    ON c.id = p.cliente_id

                ORDER BY p.id DESC
                `
            );

        for (const pedido of pedidos) {
            const [itens] =
                await pool.query(
                    `
                    SELECT
                        pi.id,
                        pi.pedido_id,
                        pi.produto_id,

                        pr.nome AS produto_nome,
                        pr.descricao AS produto_descricao,
                        pr.cloudinary_url,

                        pi.quantidade,
                        pi.preco,

                        CASE
                            WHEN pi.subtotal IS NOT NULL
                            THEN pi.subtotal
                            ELSE ROUND(
                                pi.quantidade * pi.preco,
                                2
                            )
                        END AS subtotal,

                        pi.criado_em

                    FROM pedido_itens pi

                    INNER JOIN produtos pr
                        ON pr.id = pi.produto_id

                    WHERE pi.pedido_id = ?

                    ORDER BY pi.id ASC
                    `,
                    [pedido.id]
                );

            pedido.itens = itens;
        }

        return res.status(200).json({
            sucesso: true,
            pedidos
        });

    } catch (erro) {
        console.error(
            "Erro ao listar pedidos:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao carregar pedidos.",
            erro: erroResposta(erro)
        });
    }
};

// =====================================================
// LISTAR PEDIDOS DO CLIENTE
// GET /api/pedidos/cliente/:clienteId
// =====================================================

export const listarPedidosCliente = async (
    req,
    res
) => {
    try {
        const clienteId =
            validarId(
                req.params.clienteId
            );

        if (!clienteId) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID do cliente inválido."
            });
        }

        const [pedidos] =
            await pool.query(
                `
                SELECT
                    p.id,
                    p.cliente_id,

                    c.nome AS cliente_nome,
                    c.telefone AS cliente_telefone,
                    c.email AS cliente_email,

                    p.total,
                    p.status,
                    p.status_pagamento,

                    p.criado_em,
                    p.atualizado_em

                FROM pedidos p

                INNER JOIN clientes c
                    ON c.id = p.cliente_id

                WHERE p.cliente_id = ?

                ORDER BY p.id DESC
                `,
                [clienteId]
            );

        for (const pedido of pedidos) {
            const [itens] =
                await pool.query(
                    `
                    SELECT
                        pi.id,
                        pi.pedido_id,
                        pi.produto_id,

                        pr.nome AS produto_nome,
                        pr.descricao AS produto_descricao,
                        pr.cloudinary_url,

                        pi.quantidade,
                        pi.preco,

                        CASE
                            WHEN pi.subtotal IS NOT NULL
                            THEN pi.subtotal
                            ELSE ROUND(
                                pi.quantidade * pi.preco,
                                2
                            )
                        END AS subtotal,

                        pi.criado_em

                    FROM pedido_itens pi

                    INNER JOIN produtos pr
                        ON pr.id = pi.produto_id

                    WHERE pi.pedido_id = ?

                    ORDER BY pi.id ASC
                    `,
                    [pedido.id]
                );

            pedido.itens = itens;
        }

        return res.status(200).json({
            sucesso: true,
            pedidos
        });

    } catch (erro) {
        console.error(
            "Erro ao listar pedidos do cliente:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao carregar pedidos do cliente.",
            erro: erroResposta(erro)
        });
    }
};

// =====================================================
// BUSCAR PEDIDO
// GET /api/pedidos/:id
// =====================================================

export const buscarPedido = async (
    req,
    res
) => {
    try {
        const pedidoId =
            validarId(
                req.params.id
            );

        if (!pedidoId) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID do pedido inválido."
            });
        }

        const pedido =
            await buscarPedidoCompletoPorId(
                pedidoId
            );

        if (!pedido) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Pedido não encontrado."
            });
        }

        return res.status(200).json({
            sucesso: true,
            pedido
        });

    } catch (erro) {
        console.error(
            "Erro ao buscar pedido:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao buscar pedido.",
            erro: erroResposta(erro)
        });
    }
};

// =====================================================
// ATUALIZAR STATUS DO PEDIDO
// PUT /api/pedidos/:id/status
// =====================================================

export const atualizarStatusPedido = async (
    req,
    res
) => {
    try {
        const pedidoId =
            validarId(
                req.params.id
            );

        if (!pedidoId) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID do pedido inválido."
            });
        }

        const body = req.body || {};

        const statusRecebido =
            body.status ??
            body.status_pedido ??
            body.statusPedido;

        const status =
            normalizarStatusPedido(
                statusRecebido
            );

        const statusPermitidos = [
            "pendente",
            "confirmado",
            "processando",
            "concluido",
            "cancelado"
        ];

        if (!status) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Status do pedido inválido.",
                statusPermitidos
            });
        }

        const [resultado] =
            await pool.query(
                `
                UPDATE pedidos

                SET
                    status = ?,
                    atualizado_em =
                        CURRENT_TIMESTAMP

                WHERE id = ?
                `,
                [
                    status,
                    pedidoId
                ]
            );

        if (
            resultado.affectedRows === 0
        ) {
            const pedido =
                await buscarPedidoCompletoPorId(
                    pedidoId
                );

            if (!pedido) {
                return res.status(404).json({
                    sucesso: false,
                    mensagem:
                        "Pedido não encontrado."
                });
            }
        }

        const pedido =
            await buscarPedidoCompletoPorId(
                pedidoId
            );

        return res.status(200).json({
            sucesso: true,
            mensagem:
                "Status do pedido atualizado com sucesso.",
            pedido
        });

    } catch (erro) {
        console.error(
            "Erro ao atualizar status:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao atualizar status do pedido.",
            erro: erroResposta(erro)
        });
    }
};

// =====================================================
// CONSULTAR PAGAMENTO
// GET /api/pedidos/:id/pagamento
// =====================================================

export const consultarPagamento = async (
    req,
    res
) => {
    try {
        const pedidoId =
            validarId(
                req.params.id
            );

        if (!pedidoId) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID do pedido inválido."
            });
        }

        const [pedidos] =
            await pool.query(
                `
                SELECT
                    p.id AS pedido_id,
                    p.cliente_id,
                    p.total,
                    p.status,
                    p.status_pagamento,
                    p.criado_em,
                    p.atualizado_em

                FROM pedidos p

                WHERE p.id = ?

                LIMIT 1
                `,
                [pedidoId]
            );

        if (pedidos.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Pedido não encontrado."
            });
        }

        const pedido =
            pedidos[0];

        return res.status(200).json({
            sucesso: true,

            pagamento: {
                pedido_id:
                    pedido.pedido_id,

                total:
                    pedido.total,

                status_pedido:
                    pedido.status,

                status_pagamento:
                    pedido.status_pagamento,

                pago:
                    pedido.status_pagamento ===
                    "Pago"
            }
        });

    } catch (erro) {
        console.error(
            "Erro ao consultar pagamento:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao consultar pagamento.",
            erro: erroResposta(erro)
        });
    }
};

// =====================================================
// ALTERAR PAGAMENTO
// PUT /api/pedidos/:id/pagamento
// =====================================================

export const alterarPagamento = async (
    req,
    res
) => {
    try {
        const pedidoId =
            validarId(
                req.params.id
            );

        if (!pedidoId) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID do pedido inválido."
            });
        }

        const body = req.body || {};

        const statusRecebido =
            body.status_pagamento ??
            body.statusPagamento ??
            body.pagamento;

        const statusPagamento =
            normalizarStatusPagamento(
                statusRecebido
            );

        const statusPagamentoPermitidos = [
            "Pendente",
            "Pago",
            "Falhou",
            "Cancelado"
        ];

        // =================================================
        // VALIDAR STATUS
        // =================================================

        if (!statusPagamento) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Status de pagamento inválido.",
                statusPagamentoPermitidos
            });
        }

        // =================================================
        // VERIFICAR PEDIDO
        // =================================================

        const [pedidosExistentes] =
            await pool.query(
                `
                SELECT
                    id,
                    total,
                    status,
                    status_pagamento

                FROM pedidos

                WHERE id = ?

                LIMIT 1
                `,
                [pedidoId]
            );

        if (
            pedidosExistentes.length === 0
        ) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Pedido não encontrado."
            });
        }

        // =================================================
        // ATUALIZAR PAGAMENTO
        // =================================================

        await pool.query(
            `
            UPDATE pedidos

            SET
                status_pagamento = ?,
                atualizado_em =
                    CURRENT_TIMESTAMP

            WHERE id = ?
            `,
            [
                statusPagamento,
                pedidoId
            ]
        );

        // =================================================
        // BUSCAR PEDIDO ATUALIZADO
        // =================================================

        const pedido =
            await buscarPedidoCompletoPorId(
                pedidoId
            );

        return res.status(200).json({
            sucesso: true,

            mensagem:
                "Pagamento atualizado com sucesso.",

            pagamento: {
                pedido_id:
                    pedido.id,

                total:
                    pedido.total,

                status_pedido:
                    pedido.status,

                status_pagamento:
                    pedido.status_pagamento,

                pago:
                    pedido.status_pagamento ===
                    "Pago"
            },

            pedido
        });

    } catch (erro) {
        console.error(
            "Erro ao alterar pagamento:",
            erro
        );

        if (
            erro.code ===
            "WARN_DATA_TRUNCATED"
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O status de pagamento informado não é permitido pela base de dados.",

                statusPagamentoPermitidos: [
                    "Pendente",
                    "Pago",
                    "Falhou",
                    "Cancelado"
                ]
            });
        }

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao alterar pagamento.",
            erro: erroResposta(erro)
        });
    }
};

// =====================================================
// CANCELAR PEDIDO
// PUT /api/pedidos/:id/cancelar
// =====================================================

export const cancelarPedido = async (
    req,
    res
) => {
    let connection = null;
    let transacaoIniciada = false;

    try {
        const pedidoId =
            validarId(
                req.params.id
            );

        if (!pedidoId) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID do pedido inválido."
            });
        }

        connection =
            await pool.getConnection();

        await connection.beginTransaction();

        transacaoIniciada = true;

        // =================================================
        // BLOQUEAR PEDIDO
        // =================================================

        const [pedidos] =
            await connection.query(
                `
                SELECT
                    id,
                    status,
                    status_pagamento

                FROM pedidos

                WHERE id = ?

                LIMIT 1

                FOR UPDATE
                `,
                [pedidoId]
            );

        if (pedidos.length === 0) {
            await connection.rollback();

            transacaoIniciada = false;

            connection.release();
            connection = null;

            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Pedido não encontrado."
            });
        }

        const pedidoAtual =
            pedidos[0];

        // =================================================
        // VERIFICAR SE JÁ FOI CONCLUÍDO
        // =================================================

        if (
            pedidoAtual.status ===
            "concluido"
        ) {
            await connection.rollback();

            transacaoIniciada = false;

            connection.release();
            connection = null;

            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Um pedido concluído não pode ser cancelado."
            });
        }

        // =================================================
        // VERIFICAR SE JÁ FOI CANCELADO
        // =================================================

        if (
            pedidoAtual.status ===
            "cancelado"
        ) {
            await connection.rollback();

            transacaoIniciada = false;

            connection.release();
            connection = null;

            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Este pedido já está cancelado."
            });
        }

        // =================================================
        // BUSCAR ITENS
        // =================================================

        const [itens] =
            await connection.query(
                `
                SELECT
                    produto_id,
                    quantidade

                FROM pedido_itens

                WHERE pedido_id = ?
                `,
                [pedidoId]
            );

        // =================================================
        // DEVOLVER ESTOQUE
        // =================================================

        for (const item of itens) {
            await connection.query(
                `
                UPDATE produtos

                SET
                    estoque =
                        estoque + ?

                WHERE id = ?
                `,
                [
                    item.quantidade,
                    item.produto_id
                ]
            );
        }

        // =================================================
        // ATUALIZAR PEDIDO
        // =================================================

        await connection.query(
            `
            UPDATE pedidos

            SET
                status = ?,
                status_pagamento = ?,
                atualizado_em =
                    CURRENT_TIMESTAMP

            WHERE id = ?
            `,
            [
                "cancelado",
                "Cancelado",
                pedidoId
            ]
        );

        // =================================================
        // COMMIT
        // =================================================

        await connection.commit();

        transacaoIniciada = false;

        connection.release();
        connection = null;

        // =================================================
        // BUSCAR PEDIDO ATUALIZADO
        // =================================================

        const pedido =
            await buscarPedidoCompletoPorId(
                pedidoId
            );

        return res.status(200).json({
            sucesso: true,
            mensagem:
                "Pedido cancelado com sucesso.",
            pedido
        });

    } catch (erro) {
        console.error(
            "Erro ao cancelar pedido:",
            erro
        );

        if (
            connection &&
            transacaoIniciada
        ) {
            try {
                await connection.rollback();
            } catch (rollbackErro) {
                console.error(
                    "Erro no rollback:",
                    rollbackErro
                );
            }
        }

        if (connection) {
            connection.release();
            connection = null;
        }

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao cancelar pedido.",
            erro: erroResposta(erro)
        });
    }
};

// =====================================================
// ELIMINAR PEDIDO
// DELETE /api/pedidos/:id
// =====================================================

export const eliminarPedido = async (
    req,
    res
) => {
    let connection = null;
    let transacaoIniciada = false;

    try {
        const pedidoId =
            validarId(
                req.params.id
            );

        if (!pedidoId) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID do pedido inválido."
            });
        }

        connection =
            await pool.getConnection();

        await connection.beginTransaction();

        transacaoIniciada = true;

        // =================================================
        // BUSCAR PEDIDO
        // =================================================

        const [pedidos] =
            await connection.query(
                `
                SELECT
                    id,
                    status

                FROM pedidos

                WHERE id = ?

                LIMIT 1

                FOR UPDATE
                `,
                [pedidoId]
            );

        if (pedidos.length === 0) {
            await connection.rollback();

            transacaoIniciada = false;

            connection.release();
            connection = null;

            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Pedido não encontrado."
            });
        }

        const status =
            pedidos[0].status;

        // =================================================
        // BUSCAR ITENS
        // =================================================

        const [itens] =
            await connection.query(
                `
                SELECT
                    produto_id,
                    quantidade

                FROM pedido_itens

                WHERE pedido_id = ?
                `,
                [pedidoId]
            );

        // =================================================
        // DEVOLVER ESTOQUE
        // =================================================

        /*
         * Só devolvemos estoque se o pedido
         * ainda não estiver cancelado.
         */

        if (
            status !==
            "cancelado"
        ) {
            for (const item of itens) {
                await connection.query(
                    `
                    UPDATE produtos

                    SET
                        estoque =
                            estoque + ?

                    WHERE id = ?
                    `,
                    [
                        item.quantidade,
                        item.produto_id
                    ]
                );
            }
        }

        // =================================================
        // ELIMINAR ITENS
        // =================================================

        await connection.query(
            `
            DELETE FROM pedido_itens

            WHERE pedido_id = ?
            `,
            [pedidoId]
        );

        // =================================================
        // ELIMINAR PEDIDO
        // =================================================

        const [resultado] =
            await connection.query(
                `
                DELETE FROM pedidos

                WHERE id = ?
                `,
                [pedidoId]
            );

        if (
            resultado.affectedRows === 0
        ) {
            throw new Error(
                "Não foi possível eliminar o pedido."
            );
        }

        // =================================================
        // COMMIT
        // =================================================

        await connection.commit();

        transacaoIniciada = false;

        connection.release();
        connection = null;

        return res.status(200).json({
            sucesso: true,
            mensagem:
                "Pedido eliminado com sucesso.",
            id: pedidoId
        });

    } catch (erro) {
        console.error(
            "Erro ao eliminar pedido:",
            erro
        );

        if (
            connection &&
            transacaoIniciada
        ) {
            try {
                await connection.rollback();
            } catch (rollbackErro) {
                console.error(
                    "Erro no rollback:",
                    rollbackErro
                );
            }
        }

        if (connection) {
            connection.release();
            connection = null;
        }

        if (
            erro.code ===
            "ER_ROW_IS_REFERENCED_2"
        ) {
            return res.status(409).json({
                sucesso: false,
                mensagem:
                    "Não é possível eliminar este pedido porque ele está associado a outros registos."
            });
        }

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao eliminar pedido.",
            erro: erroResposta(erro)
        });
    }
};

// =====================================================
// EXPORT DEFAULT
// =====================================================

export default {
    criarPedido,
    listarPedidos,
    listarPedidosCliente,
    buscarPedido,
    atualizarStatusPedido,
    consultarPagamento,
    alterarPagamento,
    cancelarPedido,
    eliminarPedido
};
