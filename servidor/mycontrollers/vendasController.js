// =====================================================
// controllers/vendasController.js
// =====================================================

import pool from "../config/database.js";

// =====================================================
// CONFIGURAÇÕES
// =====================================================

const STATUS_PEDIDO_PERMITIDOS = [
    "pendente",
    "confirmado",
    "processando",
    "concluido",
    "cancelado"
];

const STATUS_PAGAMENTO_PERMITIDOS = [
    "Pendente",
    "Pago",
    "Falhou",
    "Cancelado"
];

// =====================================================
// VALIDAR ID
// =====================================================

const validarId = (valor) => {
    const id = Number(valor);

    if (!Number.isInteger(id) || id <= 0) {
        return null;
    }

    return id;
};

// =====================================================
// NORMALIZAR STATUS DO PEDIDO
// =====================================================

const normalizarStatusPedido = (valor) => {
    if (
        valor === undefined ||
        valor === null ||
        String(valor).trim() === ""
    ) {
        return null;
    }

    const status = String(valor)
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
// NORMALIZAR STATUS PAGAMENTO
// =====================================================

const normalizarStatusPagamento = (valor) => {
    if (
        valor === undefined ||
        valor === null ||
        String(valor).trim() === ""
    ) {
        return null;
    }

    const status = String(valor)
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
// RESPOSTA DE ERRO
// =====================================================

const erroResposta = (erro) => {
    if (!erro) {
        return "Erro desconhecido.";
    }

    if (process.env.NODE_ENV === "production") {
        return "Não foi possível processar a operação.";
    }

    return erro.message;
};

// =====================================================
// SELECT DOS ITENS
// =====================================================

const SELECT_ITENS_VENDA = `
    SELECT
        pi.id,
        pi.pedido_id,
        pi.produto_id,

        pr.nome AS produto_nome,
        pr.descricao AS produto_descricao,

        pr.cloudinary_url AS produto_imagem,
        pr.cloudinary_id AS produto_cloudinary_id,

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
`;

// =====================================================
// SELECT PRINCIPAL
// =====================================================

const SELECT_VENDA = `
    SELECT
        pe.id,
        pe.cliente_id,

        c.nome AS cliente_nome,
        c.telefone AS cliente_telefone,
        c.email AS cliente_email,

        pe.total,

        pe.status,
        pe.status_pagamento,

        pe.criado_em,
        pe.atualizado_em,

        c.valor AS cliente_valor,

        c.cloudinary_url AS cliente_cloudinary_url,
        c.cloudinary_id AS cliente_cloudinary_id,

        c.cloudinary_url AS cliente_imagem_url,
        c.cloudinary_id AS cliente_imagem_public_id

    FROM pedidos pe

    INNER JOIN clientes c
        ON c.id = pe.cliente_id
`;

// =====================================================
// ADICIONAR ITENS
// =====================================================

const adicionarItens = async (vendas) => {
    for (const venda of vendas) {
        const [itens] = await pool.query(
            SELECT_ITENS_VENDA,
            [venda.id]
        );

        venda.itens = itens;

        venda.quantidade_itens = itens.reduce(
            (total, item) => {
                return total + Number(item.quantidade || 0);
            },
            0
        );
    }

    return vendas;
};

// =====================================================
// LISTAR VENDAS
//
// IMPORTANTE:
//
// A página VENDAS NÃO USA pe.status.
//
// Ela mostra somente pedidos cujo pagamento seja:
//
// Pago
// Pendente
//
// Portanto:
//
// ?status=concluido
//
// será IGNORADO.
//
// =====================================================

export const listarVendas = async (req, res) => {
    try {
        console.log("======================================");
        console.log("LISTAR VENDAS");
        console.log("QUERY:", req.query);
        console.log("======================================");

        const {
            busca,
            status_pagamento,
            cliente_id,
            data_inicio,
            data_fim
        } = req.query;

        // =================================================
        // QUERY BASE
        //
        // NÃO colocar:
        //
        // AND pe.status = ?
        //
        // =================================================

        let sql = `
            ${SELECT_VENDA}

            WHERE pe.status_pagamento
                IN ('Pago', 'Pendente')
        `;

        const parametros = [];

        // =================================================
        // PESQUISA
        // =================================================

        if (
            busca &&
            String(busca).trim() !== ""
        ) {
            const pesquisa = String(busca).trim();

            const termo = `%${pesquisa}%`;

            sql += `
                AND (
                    CAST(pe.id AS CHAR) LIKE ?

                    OR c.nome LIKE ?

                    OR c.email LIKE ?

                    OR c.telefone LIKE ?
                )
            `;

            parametros.push(
                termo,
                termo,
                termo,
                termo
            );
        }

        // =================================================
        // FILTRO DE PAGAMENTO
        //
        // Somente:
        //
        // Pago
        // Pendente
        //
        // =================================================

        if (
            status_pagamento &&
            String(status_pagamento).trim() !== ""
        ) {
            const pagamento =
                normalizarStatusPagamento(
                    status_pagamento
                );

            if (!pagamento) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem:
                        "Status de pagamento inválido.",
                    statusPagamentoPermitidos:
                        STATUS_PAGAMENTO_PERMITIDOS
                });
            }

            if (
                pagamento !== "Pago" &&
                pagamento !== "Pendente"
            ) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem:
                        "A página de vendas permite apenas pagamentos Pago ou Pendente."
                });
            }

            sql += `
                AND pe.status_pagamento = ?
            `;

            parametros.push(pagamento);
        }

        // =================================================
        // FILTRO CLIENTE
        // =================================================

        if (
            cliente_id !== undefined &&
            cliente_id !== null &&
            String(cliente_id).trim() !== ""
        ) {
            const clienteId =
                validarId(cliente_id);

            if (!clienteId) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem:
                        "ID do cliente inválido."
                });
            }

            sql += `
                AND pe.cliente_id = ?
            `;

            parametros.push(clienteId);
        }

        // =================================================
        // DATA INICIAL
        // =================================================

        if (
            data_inicio &&
            String(data_inicio).trim() !== ""
        ) {
            sql += `
                AND DATE(pe.criado_em) >= ?
            `;

            parametros.push(
                String(data_inicio).trim()
            );
        }

        // =================================================
        // DATA FINAL
        // =================================================

        if (
            data_fim &&
            String(data_fim).trim() !== ""
        ) {
            sql += `
                AND DATE(pe.criado_em) <= ?
            `;

            parametros.push(
                String(data_fim).trim()
            );
        }

        // =================================================
        // ORDENAR
        // =================================================

        sql += `
            ORDER BY pe.id DESC
        `;

        console.log("SQL LISTAR VENDAS:");
        console.log(sql);

        console.log(
            "PARAMETROS:",
            parametros
        );

        // =================================================
        // EXECUTAR
        // =================================================

        const [vendas] = await pool.query(
            sql,
            parametros
        );

        // =================================================
        // ADICIONAR ITENS
        // =================================================

        await adicionarItens(vendas);

        console.log(
            "VENDAS ENCONTRADAS:",
            vendas.length
        );

        console.log("======================================");

        return res.status(200).json({
            sucesso: true,

            total: vendas.length,

            vendas
        });

    } catch (erro) {
        console.error("======================================");
        console.error("ERRO AO LISTAR VENDAS");
        console.error(erro);
        console.error("======================================");

        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao listar vendas.",
            erro: erroResposta(erro)
        });
    }
};

// =====================================================
// BUSCAR VENDA POR ID
//
// SOMENTE Pago/Pendente
// =====================================================

export const buscarVenda = async (req, res) => {
    try {
        const id = validarId(
            req.params.id
        );

        if (!id) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID da venda inválido."
            });
        }

        const [vendas] = await pool.query(
            `
            ${SELECT_VENDA}

            WHERE pe.id = ?

            AND pe.status_pagamento
                IN ('Pago', 'Pendente')

            LIMIT 1
            `,
            [id]
        );

        if (vendas.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Venda não encontrada ou pagamento não permitido."
            });
        }

        const venda = vendas[0];

        const [itens] = await pool.query(
            SELECT_ITENS_VENDA,
            [id]
        );

        venda.itens = itens;

        venda.quantidade_itens =
            itens.reduce(
                (total, item) => {
                    return total +
                        Number(
                            item.quantidade || 0
                        );
                },
                0
            );

        return res.status(200).json({
            sucesso: true,
            venda
        });

    } catch (erro) {
        console.error(
            "ERRO AO BUSCAR VENDA:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao buscar venda.",
            erro:
                erroResposta(erro)
        });
    }
};

// =====================================================
// ESTATÍSTICAS
//
// SOMENTE Pago/Pendente
// =====================================================

export const estatisticasVendas = async (
    req,
    res
) => {
    try {
        const {
            data_inicio,
            data_fim
        } = req.query;

        let filtro = `
            WHERE status_pagamento
                IN ('Pago', 'Pendente')
        `;

        const parametros = [];

        // =================================================
        // DATA INICIAL
        // =================================================

        if (
            data_inicio &&
            String(data_inicio).trim() !== ""
        ) {
            filtro += `
                AND DATE(criado_em) >= ?
            `;

            parametros.push(
                String(data_inicio).trim()
            );
        }

        // =================================================
        // DATA FINAL
        // =================================================

        if (
            data_fim &&
            String(data_fim).trim() !== ""
        ) {
            filtro += `
                AND DATE(criado_em) <= ?
            `;

            parametros.push(
                String(data_fim).trim()
            );
        }

        // =================================================
        // RESUMO
        // =================================================

        const [totalGeral] =
            await pool.query(
                `
                SELECT

                    COUNT(*) AS total_vendas,

                    COALESCE(
                        SUM(total),
                        0
                    ) AS valor_total,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN status_pagamento = 'Pago'
                                THEN 1
                                ELSE 0
                            END
                        ),
                        0
                    ) AS vendas_pagas,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN status_pagamento = 'Pendente'
                                THEN 1
                                ELSE 0
                            END
                        ),
                        0
                    ) AS vendas_pendentes,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN status_pagamento = 'Pago'
                                THEN total
                                ELSE 0
                            END
                        ),
                        0
                    ) AS valor_pago,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN status_pagamento = 'Pendente'
                                THEN total
                                ELSE 0
                            END
                        ),
                        0
                    ) AS valor_pendente

                FROM pedidos

                ${filtro}
                `,
                parametros
            );

        // =================================================
        // POR STATUS DO PEDIDO
        // =================================================

        const [porStatus] =
            await pool.query(
                `
                SELECT
                    status,

                    COUNT(*) AS quantidade,

                    COALESCE(
                        SUM(total),
                        0
                    ) AS valor

                FROM pedidos

                ${filtro}

                GROUP BY status

                ORDER BY quantidade DESC
                `,
                parametros
            );

        // =================================================
        // POR PAGAMENTO
        // =================================================

        const [porPagamento] =
            await pool.query(
                `
                SELECT
                    status_pagamento,

                    COUNT(*) AS quantidade,

                    COALESCE(
                        SUM(total),
                        0
                    ) AS valor

                FROM pedidos

                ${filtro}

                GROUP BY status_pagamento

                ORDER BY quantidade DESC
                `,
                parametros
            );

        const resumo =
            totalGeral[0] || {};

        return res.status(200).json({
            sucesso: true,

            resumo: {
                total_vendas:
                    Number(
                        resumo.total_vendas || 0
                    ),

                valor_total:
                    Number(
                        resumo.valor_total || 0
                    ),

                vendas_pagas:
                    Number(
                        resumo.vendas_pagas || 0
                    ),

                vendas_pendentes:
                    Number(
                        resumo.vendas_pendentes || 0
                    ),

                valor_pago:
                    Number(
                        resumo.valor_pago || 0
                    ),

                valor_pendente:
                    Number(
                        resumo.valor_pendente || 0
                    )
            },

            por_status: porStatus,

            por_pagamento: porPagamento
        });

    } catch (erro) {
        console.error(
            "ERRO AO BUSCAR ESTATÍSTICAS:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao buscar estatísticas das vendas.",
            erro:
                erroResposta(erro)
        });
    }
};

// =====================================================
// ALTERAR STATUS DA VENDA
//
// A venda precisa ter pagamento Pago/Pendente.
// =====================================================

export const alterarStatusVenda = async (
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
                    "ID da venda inválido."
            });
        }

        const status =
            normalizarStatusPedido(
                req.body?.status
            );

        if (!status) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Status do pedido inválido.",
                statusPermitidos:
                    STATUS_PEDIDO_PERMITIDOS
            });
        }

        // =================================================
        // VERIFICAR VENDA
        // =================================================

        const [vendas] =
            await pool.query(
                `
                SELECT
                    id,
                    status,
                    status_pagamento

                FROM pedidos

                WHERE id = ?

                AND status_pagamento
                    IN ('Pago', 'Pendente')

                LIMIT 1
                `,
                [id]
            );

        if (vendas.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Venda não encontrada ou não possui pagamento Pago/Pendente."
            });
        }

        const statusAnterior =
            vendas[0].status;

        // =================================================
        // ATUALIZAR
        // =================================================

        await pool.query(
            `
            UPDATE pedidos

            SET
                status = ?,
                atualizado_em =
                    CURRENT_TIMESTAMP

            WHERE id = ?

            AND status_pagamento
                IN ('Pago', 'Pendente')
            `,
            [
                status,
                id
            ]
        );

        // =================================================
        // BUSCAR ATUALIZADA
        // =================================================

        const [
            vendasAtualizadas
        ] = await pool.query(
            `
            ${SELECT_VENDA}

            WHERE pe.id = ?

            AND pe.status_pagamento
                IN ('Pago', 'Pendente')

            LIMIT 1
            `,
            [id]
        );

        if (
            vendasAtualizadas.length === 0
        ) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Venda não encontrada após atualização."
            });
        }

        const venda =
            vendasAtualizadas[0];

        const [itens] =
            await pool.query(
                SELECT_ITENS_VENDA,
                [id]
            );

        venda.itens = itens;

        venda.quantidade_itens =
            itens.reduce(
                (total, item) => {
                    return total +
                        Number(
                            item.quantidade || 0
                        );
                },
                0
            );

        return res.status(200).json({
            sucesso: true,

            mensagem:
                "Status da venda alterado com sucesso.",

            status_anterior:
                statusAnterior,

            status_novo:
                status,

            venda
        });

    } catch (erro) {
        console.error(
            "ERRO AO ALTERAR STATUS:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao alterar status da venda.",
            erro:
                erroResposta(erro)
        });
    }
};

// =====================================================
// ALIAS
// =====================================================

export const atualizarStatusVenda =
    alterarStatusVenda;

// =====================================================
// VENDAS POR CLIENTE
//
// SOMENTE Pago/Pendente
// =====================================================

export const vendasPorCliente = async (
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

                    imagem_url,
                    imagem_public_id

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

        const cliente =
            clientes[0];

        // =================================================
        // VENDAS DO CLIENTE
        // =================================================

        const [vendas] =
            await pool.query(
                `
                ${SELECT_VENDA}

                WHERE pe.cliente_id = ?

                AND pe.status_pagamento
                    IN ('Pago', 'Pendente')

                ORDER BY pe.id DESC
                `,
                [clienteId]
            );

        await adicionarItens(vendas);

        // =================================================
        // VALORES
        // =================================================

        const valorTotal =
            vendas.reduce(
                (total, venda) => {
                    return total +
                        Number(
                            venda.total || 0
                        );
                },
                0
            );

        const valorPago =
            vendas
                .filter(
                    venda =>
                        venda.status_pagamento ===
                        "Pago"
                )
                .reduce(
                    (total, venda) => {
                        return total +
                            Number(
                                venda.total || 0
                            );
                    },
                    0
                );

        const valorPendente =
            vendas
                .filter(
                    venda =>
                        venda.status_pagamento ===
                        "Pendente"
                )
                .reduce(
                    (total, venda) => {
                        return total +
                            Number(
                                venda.total || 0
                            );
                    },
                    0
                );

        return res.status(200).json({
            sucesso: true,

            cliente,

            total_vendas:
                vendas.length,

            valor_total:
                valorTotal,

            valor_pago:
                valorPago,

            valor_pendente:
                valorPendente,

            vendas
        });

    } catch (erro) {
        console.error(
            "ERRO AO LISTAR VENDAS DO CLIENTE:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao listar vendas do cliente.",
            erro:
                erroResposta(erro)
        });
    }
};

// =====================================================
// PRODUTOS MAIS VENDIDOS
//
// SOMENTE Pago/Pendente
// =====================================================

export const produtosMaisVendidos = async (
    req,
    res
) => {
    try {
        const limiteRecebido =
            Number(
                req.query.limite || 10
            );

        const limite =
            Number.isInteger(
                limiteRecebido
            ) &&
            limiteRecebido > 0 &&
            limiteRecebido <= 100
                ? limiteRecebido
                : 10;

        const [produtos] =
            await pool.query(
                `
                SELECT

                    p.id,
                    p.nome,

                    p.cloudinary_url,
                    p.cloudinary_id,

                    COALESCE(
                        SUM(
                            pi.quantidade
                        ),
                        0
                    ) AS quantidade_vendida,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN pi.subtotal IS NOT NULL
                                THEN pi.subtotal

                                ELSE
                                    pi.quantidade *
                                    pi.preco
                            END
                        ),
                        0
                    ) AS valor_vendido

                FROM pedido_itens pi

                INNER JOIN pedidos pe
                    ON pe.id = pi.pedido_id

                INNER JOIN produtos p
                    ON p.id = pi.produto_id

                WHERE pe.status_pagamento
                    IN ('Pago', 'Pendente')

                GROUP BY
                    p.id,
                    p.nome,
                    p.cloudinary_url,
                    p.cloudinary_id

                ORDER BY
                    quantidade_vendida DESC

                LIMIT ${limite}
                `
            );

        return res.status(200).json({
            sucesso: true,
            produtos
        });

    } catch (erro) {
        console.error(
            "ERRO AO BUSCAR PRODUTOS MAIS VENDIDOS:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao buscar produtos mais vendidos.",
            erro:
                erroResposta(erro)
        });
    }
};

// =====================================================
// EXPORT DEFAULT
// =====================================================

export default {
    listarVendas,
    buscarVenda,
    estatisticasVendas,
    alterarStatusVenda,
    atualizarStatusVenda,
    vendasPorCliente,
    produtosMaisVendidos
};