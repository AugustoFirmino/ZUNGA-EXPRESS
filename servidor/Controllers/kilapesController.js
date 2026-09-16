import pool from "../config/database.js";

// =====================================================
// CONFIGURAÇÕES
// =====================================================

const PRAZO_KILAPE_DIAS = 21;

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function numeroValido(valor) {
    const numero = Number(valor);

    return (
        Number.isFinite(numero) &&
        numero > 0
    );
}

function idValido(valor) {
    const numero = Number(valor);

    return (
        Number.isInteger(numero) &&
        numero > 0
    );
}

function limparTexto(valor) {
    if (
        valor === null ||
        valor === undefined
    ) {
        return null;
    }

    const texto = String(valor).trim();

    return texto || null;
}

// =====================================================
// CRIAR KILAPE
// SEM AUTENTICAÇÃO
// =====================================================

export async function criarKilape(req, res) {
    let connection;

    try {
        const {
            cliente_id,
            valor,
            observacao
        } = req.body || {};

        // =================================================
        // VALIDAR CLIENTE
        // =================================================

        if (!idValido(cliente_id)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Informe um cliente_id válido."
            });
        }

        const clienteId =
            Number(cliente_id);

        // =================================================
        // VALIDAR VALOR
        // =================================================

        if (!numeroValido(valor)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Informe um valor de Kilape válido."
            });
        }

        const valorNumerico =
            Number(valor);

        // =================================================
        // VERIFICAR CLIENTE
        // =================================================

        const [clientes] =
            await pool.execute(
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

        const cliente =
            clientes[0];

        // =================================================
        // VERIFICAR KILAPES PENDENTES/APROVADOS
        // =================================================

        const [kilapesExistentes] =
            await pool.execute(
                `
                SELECT
                    id,
                    valor,
                    status,
                    data_solicitacao,
                    data_vencimento
                FROM kilapes
                WHERE cliente_id = ?
                AND status IN ('pendente', 'aprovado')
                ORDER BY id DESC
                `,
                [clienteId]
            );

        if (
            kilapesExistentes.length > 0
        ) {
            return res.status(409).json({
                sucesso: false,
                mensagem:
                    "Este cliente já possui um Kilape pendente ou aprovado.",
                kilape:
                    kilapesExistentes[0]
            });
        }

        // =================================================
        // DATA DA SOLICITAÇÃO
        // =================================================

        const dataSolicitacao =
            new Date();

        // =================================================
        // DATA DE VENCIMENTO
        // 21 DIAS
        // =================================================

        const dataVencimento =
            new Date(
                dataSolicitacao
            );

        dataVencimento.setDate(
            dataVencimento.getDate() +
                PRAZO_KILAPE_DIAS
        );

        // =================================================
        // CONEXÃO
        // =================================================

        connection =
            await pool.getConnection();

        await connection.beginTransaction();

        // =================================================
        // INSERIR
        // =================================================

        const [resultado] =
            await connection.execute(
                `
                INSERT INTO kilapes (
                    cliente_id,
                    valor,
                    data_solicitacao,
                    data_vencimento,
                    status,
                    observacao
                )
                VALUES (?, ?, ?, ?, 'pendente', ?)
                `,
                [
                    clienteId,
                    valorNumerico,
                    dataSolicitacao,
                    dataVencimento,
                    limparTexto(observacao)
                ]
            );

        await connection.commit();

        // =================================================
        // RESPOSTA
        // =================================================

        return res.status(201).json({
            sucesso: true,
            mensagem:
                "Solicitação de Kilape criada com sucesso.",
            kilape: {
                id:
                    resultado.insertId,
                cliente_id:
                    clienteId,
                cliente_nome:
                    cliente.nome,
                cliente_telefone:
                    cliente.telefone,
                cliente_email:
                    cliente.email,
                valor:
                    valorNumerico,
                data_solicitacao:
                    dataSolicitacao,
                data_vencimento:
                    dataVencimento,
                prazo_dias:
                    PRAZO_KILAPE_DIAS,
                status:
                    "pendente",
                observacao:
                    limparTexto(observacao)
            }
        });

    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch {}
        }

        console.error(
            "Erro ao criar Kilape:",
            error
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro interno ao criar solicitação de Kilape.",
            erro:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// =====================================================
// LISTAR KILAPES DE UM CLIENTE
// SEM AUTENTICAÇÃO
// =====================================================

export async function listarMeusKilapes(
    req,
    res
) {
    try {
        const clienteId =
            Number(
                req.params.cliente_id ||
                req.query.cliente_id ||
                req.body?.cliente_id
            );

        if (!idValido(clienteId)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Informe um cliente_id válido."
            });
        }

        // =================================================
        // ATUALIZAR ATRASADOS
        // =================================================

        await pool.execute(
            `
            UPDATE kilapes
            SET status = 'atrasado'
            WHERE cliente_id = ?
            AND status = 'aprovado'
            AND data_vencimento < NOW()
            `,
            [clienteId]
        );

        // =================================================
        // BUSCAR
        // =================================================

        const [kilapes] =
            await pool.execute(
                `
                SELECT
                    k.id,
                    k.cliente_id,
                    k.valor,
                    k.data_solicitacao,
                    k.data_vencimento,
                    k.status,
                    k.observacao,
                    k.criado_em,
                    k.atualizado_em,

                    c.nome AS cliente_nome,
                    c.telefone AS cliente_telefone,
                    c.email AS cliente_email

                FROM kilapes k

                INNER JOIN clientes c
                    ON c.id = k.cliente_id

                WHERE k.cliente_id = ?

                ORDER BY
                    k.id DESC
                `,
                [clienteId]
            );

        return res.status(200).json({
            sucesso: true,
            cliente_id:
                clienteId,
            total:
                kilapes.length,
            kilapes
        });

    } catch (error) {
        console.error(
            "Erro ao listar Kilapes:",
            error
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao carregar Kilapes do cliente."
        });
    }
}

// =====================================================
// BUSCAR KILAPE DO CLIENTE
// SEM AUTENTICAÇÃO
// =====================================================

export async function buscarMeuKilape(
    req,
    res
) {
    try {
        const {
            id
        } = req.params;

        const clienteId =
            Number(
                req.query.cliente_id ||
                req.body?.cliente_id
            );

        if (!idValido(id)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID do Kilape inválido."
            });
        }

        if (!idValido(clienteId)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Informe um cliente_id válido."
            });
        }

        // =================================================
        // ATUALIZAR ATRASADO
        // =================================================

        await pool.execute(
            `
            UPDATE kilapes
            SET status = 'atrasado'
            WHERE id = ?
            AND cliente_id = ?
            AND status = 'aprovado'
            AND data_vencimento < NOW()
            `,
            [
                id,
                clienteId
            ]
        );

        // =================================================
        // BUSCAR
        // =================================================

        const [kilapes] =
            await pool.execute(
                `
                SELECT
                    k.id,
                    k.cliente_id,
                    k.valor,
                    k.data_solicitacao,
                    k.data_vencimento,
                    k.status,
                    k.observacao,
                    k.criado_em,
                    k.atualizado_em,

                    c.nome AS cliente_nome,
                    c.telefone AS cliente_telefone,
                    c.email AS cliente_email,
                    c.cloudinary_url AS cliente_imagem

                FROM kilapes k

                INNER JOIN clientes c
                    ON c.id = k.cliente_id

                WHERE k.id = ?
                AND k.cliente_id = ?

                LIMIT 1
                `,
                [
                    id,
                    clienteId
                ]
            );

        if (kilapes.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Kilape não encontrado para este cliente."
            });
        }

        return res.status(200).json({
            sucesso: true,
            kilape:
                kilapes[0]
        });

    } catch (error) {
        console.error(
            "Erro ao buscar Kilape:",
            error
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao buscar Kilape."
        });
    }
}

// =====================================================
// CANCELAR KILAPE
// SEM AUTENTICAÇÃO
// =====================================================

export async function cancelarKilape(
    req,
    res
) {
    try {
        const {
            id
        } = req.params;

        const clienteId =
            Number(
                req.body?.cliente_id ||
                req.query.cliente_id
            );

        if (!idValido(id)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID do Kilape inválido."
            });
        }

        if (!idValido(clienteId)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Informe um cliente_id válido."
            });
        }

        // =================================================
        // BUSCAR
        // =================================================

        const [kilapes] =
            await pool.execute(
                `
                SELECT
                    id,
                    cliente_id,
                    status
                FROM kilapes
                WHERE id = ?
                AND cliente_id = ?
                LIMIT 1
                `,
                [
                    id,
                    clienteId
                ]
            );

        if (kilapes.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Kilape não encontrado."
            });
        }

        // =================================================
        // VALIDAR STATUS
        // =================================================

        if (
            kilapes[0].status !==
            "pendente"
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Somente Kilapes pendentes podem ser cancelados."
            });
        }

        // =================================================
        // CANCELAR
        // =================================================

        await pool.execute(
            `
            UPDATE kilapes
            SET
                status = 'recusado',
                observacao =
                    CASE
                        WHEN observacao IS NULL
                            THEN 'Cancelado pelo cliente.'
                        ELSE CONCAT(
                            observacao,
                            ' | Cancelado pelo cliente.'
                        )
                    END
            WHERE id = ?
            AND cliente_id = ?
            `,
            [
                id,
                clienteId
            ]
        );

        return res.status(200).json({
            sucesso: true,
            mensagem:
                "Kilape cancelado com sucesso."
        });

    } catch (error) {
        console.error(
            "Erro ao cancelar Kilape:",
            error
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao cancelar Kilape."
        });
    }
}

// =====================================================
// ADMIN - LISTAR TODOS
// SEM AUTENTICAÇÃO
// =====================================================

export async function listarKilapes(
    req,
    res
) {
    try {
        // =================================================
        // ATUALIZAR ATRASADOS
        // =================================================

        await pool.execute(
            `
            UPDATE kilapes
            SET status = 'atrasado'
            WHERE status = 'aprovado'
            AND data_vencimento < NOW()
            `
        );

        // =================================================
        // BUSCAR
        // =================================================

        const [kilapes] =
            await pool.execute(
                `
                SELECT
                    k.id,
                    k.cliente_id,
                    k.valor,
                    k.data_solicitacao,
                    k.data_vencimento,
                    k.status,
                    k.observacao,
                    k.criado_em,
                    k.atualizado_em,

                    c.nome AS cliente_nome,
                    c.telefone AS cliente_telefone,
                    c.email AS cliente_email,
                    c.cloudinary_url AS cliente_imagem

                FROM kilapes k

                INNER JOIN clientes c
                    ON c.id = k.cliente_id

                ORDER BY
                    k.id DESC
                `
            );

        return res.status(200).json({
            sucesso: true,
            total:
                kilapes.length,
            kilapes
        });

    } catch (error) {
        console.error(
            "Erro ao listar Kilapes:",
            error
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao carregar Kilapes."
        });
    }
}

// =====================================================
// ADMIN - BUSCAR KILAPE
// SEM AUTENTICAÇÃO
// =====================================================

export async function buscarKilape(
    req,
    res
) {
    try {
        const {
            id
        } = req.params;

        if (!idValido(id)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID do Kilape inválido."
            });
        }

        const [kilapes] =
            await pool.execute(
                `
                SELECT
                    k.id,
                    k.cliente_id,
                    k.valor,
                    k.data_solicitacao,
                    k.data_vencimento,
                    k.status,
                    k.observacao,
                    k.criado_em,
                    k.atualizado_em,

                    c.nome AS cliente_nome,
                    c.telefone AS cliente_telefone,
                    c.email AS cliente_email

                FROM kilapes k

                INNER JOIN clientes c
                    ON c.id = k.cliente_id

                WHERE k.id = ?

                LIMIT 1
                `,
                [id]
            );

        if (kilapes.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Kilape não encontrado."
            });
        }

        return res.status(200).json({
            sucesso: true,
            kilape:
                kilapes[0]
        });

    } catch (error) {
        console.error(
            "Erro ao buscar Kilape:",
            error
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao buscar Kilape."
        });
    }
}

// =====================================================
// ADMIN - EDITAR KILAPE
// SEM AUTENTICAÇÃO
// =====================================================

export async function editarKilape(
    req,
    res
) {
    try {
        const {
            id
        } = req.params;

        const {
            cliente_id,
            valor,
            observacao
        } = req.body || {};

        // =================================================
        // VALIDAR ID
        // =================================================

        if (!idValido(id)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID do Kilape inválido."
            });
        }

        const kilapeId =
            Number(id);

        // =================================================
        // BUSCAR KILAPE
        // =================================================

        const [kilapes] =
            await pool.execute(
                `
                SELECT
                    id,
                    cliente_id,
                    valor,
                    data_solicitacao,
                    data_vencimento,
                    status,
                    observacao
                FROM kilapes
                WHERE id = ?
                LIMIT 1
                `,
                [kilapeId]
            );

        if (kilapes.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Kilape não encontrado."
            });
        }

        const kilape =
            kilapes[0];

        // =================================================
        // CLIENTE
        // Se não for enviado, mantém o atual
        // =================================================

        const clienteId =
            cliente_id !== undefined
                ? Number(cliente_id)
                : Number(kilape.cliente_id);

        if (!idValido(clienteId)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "cliente_id inválido."
            });
        }

        // =================================================
        // VERIFICAR CLIENTE
        // =================================================

        const [clientes] =
            await pool.execute(
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

        // =================================================
        // VALOR
        // =================================================

        const valorNumerico =
            valor !== undefined
                ? Number(valor)
                : Number(kilape.valor);

        if (!numeroValido(valorNumerico)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Informe um valor de Kilape válido."
            });
        }

        // =================================================
        // OBSERVAÇÃO
        // =================================================

        let observacaoFinal;

        if (
            observacao === undefined
        ) {
            observacaoFinal =
                kilape.observacao;
        } else {
            observacaoFinal =
                limparTexto(
                    observacao
                );
        }

        // =================================================
        // VERIFICAR SE MUDOU DE CLIENTE
        // =================================================

        if (
            clienteId !==
            Number(kilape.cliente_id)
        ) {
            const [
                outrosKilapes
            ] =
                await pool.execute(
                    `
                    SELECT
                        id,
                        valor,
                        status,
                        data_vencimento
                    FROM kilapes
                    WHERE cliente_id = ?
                    AND id <> ?
                    AND status IN (
                        'pendente',
                        'aprovado'
                    )
                    ORDER BY id DESC
                    LIMIT 1
                    `,
                    [
                        clienteId,
                        kilapeId
                    ]
                );

            if (
                outrosKilapes.length > 0
            ) {
                return res.status(409).json({
                    sucesso: false,
                    mensagem:
                        "O novo cliente já possui um Kilape pendente ou aprovado.",
                    kilape:
                        outrosKilapes[0]
                });
            }
        }

        // =================================================
        // ATUALIZAR
        // =================================================

        await pool.execute(
            `
            UPDATE kilapes
            SET
                cliente_id = ?,
                valor = ?,
                observacao = ?
            WHERE id = ?
            `,
            [
                clienteId,
                valorNumerico,
                observacaoFinal,
                kilapeId
            ]
        );

        // =================================================
        // BUSCAR ATUALIZADO
        // =================================================

        const [atualizado] =
            await pool.execute(
                `
                SELECT
                    k.id,
                    k.cliente_id,
                    k.valor,
                    k.data_solicitacao,
                    k.data_vencimento,
                    k.status,
                    k.observacao,
                    k.criado_em,
                    k.atualizado_em,

                    c.nome AS cliente_nome,
                    c.telefone AS cliente_telefone,
                    c.email AS cliente_email

                FROM kilapes k

                INNER JOIN clientes c
                    ON c.id = k.cliente_id

                WHERE k.id = ?

                LIMIT 1
                `,
                [kilapeId]
            );

        return res.status(200).json({
            sucesso: true,
            mensagem:
                "Kilape atualizado com sucesso.",
            kilape:
                atualizado[0]
        });

    } catch (error) {
        console.error(
            "Erro ao editar Kilape:",
            error
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao editar Kilape.",
            erro:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined
        });
    }
}

// =====================================================
// ADMIN - ELIMINAR KILAPE
// SEM AUTENTICAÇÃO
// =====================================================

export async function eliminarKilape(
    req,
    res
) {
    try {
        const {
            id
        } = req.params;

        // =================================================
        // VALIDAR ID
        // =================================================

        if (!idValido(id)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID do Kilape inválido."
            });
        }

        const kilapeId =
            Number(id);

        // =================================================
        // VERIFICAR EXISTÊNCIA
        // =================================================

        const [kilapes] =
            await pool.execute(
                `
                SELECT
                    id,
                    cliente_id,
                    valor,
                    status
                FROM kilapes
                WHERE id = ?
                LIMIT 1
                `,
                [kilapeId]
            );

        if (kilapes.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Kilape não encontrado."
            });
        }

        const kilape =
            kilapes[0];

        // =================================================
        // ELIMINAR
        // =================================================

        await pool.execute(
            `
            DELETE FROM kilapes
            WHERE id = ?
            `,
            [kilapeId]
        );

        return res.status(200).json({
            sucesso: true,
            mensagem:
                "Kilape eliminado com sucesso.",
            kilape: {
                id:
                    Number(kilape.id),
                cliente_id:
                    Number(kilape.cliente_id),
                valor:
                    Number(kilape.valor),
                status:
                    kilape.status
            }
        });

    } catch (error) {
        console.error(
            "Erro ao eliminar Kilape:",
            error
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao eliminar Kilape.",
            erro:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined
        });
    }
}

// =====================================================
// ADMIN - APROVAR KILAPE
// SEM AUTENTICAÇÃO
// =====================================================

export async function aprovarKilape(
    req,
    res
) {
    try {
        const {
            id
        } = req.params;

        if (!idValido(id)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID do Kilape inválido."
            });
        }

        // =================================================
        // BUSCAR
        // =================================================

        const [kilapes] =
            await pool.execute(
                `
                SELECT
                    id,
                    cliente_id,
                    valor,
                    status,
                    data_vencimento
                FROM kilapes
                WHERE id = ?
                LIMIT 1
                `,
                [id]
            );

        if (kilapes.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Kilape não encontrado."
            });
        }

        const kilape =
            kilapes[0];

        // =================================================
        // STATUS
        // =================================================

        if (
            kilape.status !==
            "pendente"
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    `Não é possível aprovar um Kilape com status "${kilape.status}".`
            });
        }

        // =================================================
        // VERIFICAR VENCIMENTO
        // =================================================

        const vencimento =
            new Date(
                kilape.data_vencimento
            );

        if (
            vencimento.getTime() <
            Date.now()
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Este Kilape já ultrapassou o prazo de 21 dias."
            });
        }

        // =================================================
        // APROVAR
        // =================================================

        await pool.execute(
            `
            UPDATE kilapes
            SET
                status = 'aprovado'
            WHERE id = ?
            `,
            [id]
        );

        return res.status(200).json({
            sucesso: true,
            mensagem:
                "Kilape aprovado com sucesso.",
            kilape_id:
                Number(id)
        });

    } catch (error) {
        console.error(
            "Erro ao aprovar Kilape:",
            error
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao aprovar Kilape."
        });
    }
}

// =====================================================
// ADMIN - RECUSAR KILAPE
// SEM AUTENTICAÇÃO
// =====================================================

export async function recusarKilape(
    req,
    res
) {
    try {
        const {
            id
        } = req.params;

        const {
            observacao
        } = req.body || {};

        if (!idValido(id)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID do Kilape inválido."
            });
        }

        // =================================================
        // BUSCAR
        // =================================================

        const [kilapes] =
            await pool.execute(
                `
                SELECT
                    id,
                    cliente_id,
                    status
                FROM kilapes
                WHERE id = ?
                LIMIT 1
                `,
                [id]
            );

        if (kilapes.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Kilape não encontrado."
            });
        }

        // =================================================
        // VALIDAR STATUS
        // =================================================

        if (
            kilapes[0].status !==
            "pendente"
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Somente Kilapes pendentes podem ser recusados."
            });
        }

        // =================================================
        // OBSERVAÇÃO
        // =================================================

        const observacaoFinal =
            limparTexto(observacao) ||
            "Solicitação recusada pelo administrador.";

        // =================================================
        // RECUSAR
        // =================================================

        await pool.execute(
            `
            UPDATE kilapes
            SET
                status = 'recusado',
                observacao = ?
            WHERE id = ?
            `,
            [
                observacaoFinal,
                id
            ]
        );

        return res.status(200).json({
            sucesso: true,
            mensagem:
                "Kilape recusado com sucesso.",
            kilape_id:
                Number(id)
        });

    } catch (error) {
        console.error(
            "Erro ao recusar Kilape:",
            error
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao recusar Kilape."
        });
    }
}

// =====================================================
// REGISTRAR PAGAMENTO
// SEM AUTENTICAÇÃO
// =====================================================

export async function pagarKilape(
    req,
    res
) {
    try {
        const {
            id
        } = req.params;

        if (!idValido(id)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID do Kilape inválido."
            });
        }

        // =================================================
        // BUSCAR KILAPE
        // =================================================

        const [kilapes] =
            await pool.execute(
                `
                SELECT
                    id,
                    cliente_id,
                    valor,
                    status,
                    data_vencimento
                FROM kilapes
                WHERE id = ?
                LIMIT 1
                `,
                [id]
            );

        if (kilapes.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Kilape não encontrado."
            });
        }

        const kilape =
            kilapes[0];

        // =================================================
        // VALIDAR STATUS
        // =================================================

        if (
            kilape.status !==
                "aprovado" &&
            kilape.status !==
                "atrasado"
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Este Kilape não está disponível para pagamento."
            });
        }

        // =================================================
        // PAGAR
        // =================================================

        await pool.execute(
            `
            UPDATE kilapes
            SET
                status = 'pago'
            WHERE id = ?
            `,
            [id]
        );

        // =================================================
        // RESPOSTA
        // =================================================

        return res.status(200).json({
            sucesso: true,
            mensagem:
                "Pagamento do Kilape registrado com sucesso.",
            kilape: {
                id:
                    Number(kilape.id),
                cliente_id:
                    Number(kilape.cliente_id),
                valor:
                    Number(kilape.valor),
                status:
                    "pago"
            }
        });

    } catch (error) {
        console.error(
            "Erro ao registrar pagamento:",
            error
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao registrar pagamento."
        });
    }
}