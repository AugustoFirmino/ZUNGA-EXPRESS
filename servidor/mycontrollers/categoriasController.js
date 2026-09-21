import pool from "../config/database.js";

// =====================================================
// LISTAR TODAS AS CATEGORIAS
// GET /api/categorias
// =====================================================

const listarCategorias = async (req, res) => {
    try {
        const [categorias] = await pool.query(`
            SELECT
                id,
                nome,
                descricao,
                criado_em,
                atualizado_em
            FROM categorias
            ORDER BY id DESC
        `);

        return res.status(200).json({
            sucesso: true,
            categorias
        });

    } catch (error) {
        console.error(
            "Erro ao listar categorias:",
            error
        );

        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao listar categorias."
        });
    }
};


// =====================================================
// BUSCAR CATEGORIA POR ID
// GET /api/categorias/:id
// =====================================================

const buscarCategoria = async (req, res) => {

    try {

        const { id } = req.params;

        if (!id || isNaN(id)) {

            return res.status(400).json({
                sucesso: false,
                mensagem: "ID da categoria inválido."
            });
        }

        const [categorias] = await pool.query(
            `
            SELECT
                id,
                nome,
                descricao,
                criado_em,
                atualizado_em
            FROM categorias
            WHERE id = ?
            `,
            [id]
        );

        if (categorias.length === 0) {

            return res.status(404).json({
                sucesso: false,
                mensagem: "Categoria não encontrada."
            });
        }

        return res.status(200).json({
            sucesso: true,
            categoria: categorias[0]
        });

    } catch (error) {

        console.error(
            "Erro ao buscar categoria:",
            error
        );

        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao buscar categoria."
        });
    }
};


// =====================================================
// CRIAR CATEGORIA
// POST /api/categorias
// =====================================================

const criarCategoria = async (req, res) => {

    try {

        const {
            nome,
            descricao
        } = req.body;

        // =================================================
        // VALIDAÇÃO
        // =================================================

        if (!nome || !nome.trim()) {

            return res.status(400).json({
                sucesso: false,
                mensagem: "O nome da categoria é obrigatório."
            });
        }

        const nomeLimpo =
            nome.trim();

        const descricaoLimpa =
            descricao
                ? descricao.trim()
                : null;

        if (nomeLimpo.length < 2) {

            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O nome da categoria deve ter pelo menos 2 caracteres."
            });
        }

        // =================================================
        // VERIFICAR DUPLICADO
        // =================================================

        const [existente] = await pool.query(
            `
            SELECT
                id
            FROM categorias
            WHERE LOWER(nome) = LOWER(?)
            LIMIT 1
            `,
            [nomeLimpo]
        );

        if (existente.length > 0) {

            return res.status(409).json({
                sucesso: false,
                mensagem:
                    "Já existe uma categoria com este nome."
            });
        }

        // =================================================
        // INSERIR
        // =================================================

        const [resultado] = await pool.query(
            `
            INSERT INTO categorias
            (
                nome,
                descricao
            )
            VALUES
            (
                ?,
                ?
            )
            `,
            [
                nomeLimpo,
                descricaoLimpa
            ]
        );

        // =================================================
        // BUSCAR CATEGORIA CRIADA
        // =================================================

        const [categorias] = await pool.query(
            `
            SELECT
                id,
                nome,
                descricao,
                criado_em,
                atualizado_em
            FROM categorias
            WHERE id = ?
            `,
            [resultado.insertId]
        );

        return res.status(201).json({
            sucesso: true,
            mensagem: "Categoria criada com sucesso.",
            categoria: categorias[0]
        });

    } catch (error) {

        console.error(
            "Erro ao criar categoria:",
            error
        );

        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao criar categoria."
        });
    }
};


// =====================================================
// ATUALIZAR CATEGORIA
// PUT /api/categorias/:id
// =====================================================

const atualizarCategoria = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            nome,
            descricao
        } = req.body;

        // =================================================
        // VALIDAR ID
        // =================================================

        if (!id || isNaN(id)) {

            return res.status(400).json({
                sucesso: false,
                mensagem: "ID da categoria inválido."
            });
        }

        // =================================================
        // VALIDAR NOME
        // =================================================

        if (!nome || !nome.trim()) {

            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O nome da categoria é obrigatório."
            });
        }

        const nomeLimpo =
            nome.trim();

        const descricaoLimpa =
            descricao
                ? descricao.trim()
                : null;

        if (nomeLimpo.length < 2) {

            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O nome da categoria deve ter pelo menos 2 caracteres."
            });
        }

        // =================================================
        // VERIFICAR SE EXISTE
        // =================================================

        const [categoriaExistente] =
            await pool.query(
                `
                SELECT
                    id
                FROM categorias
                WHERE id = ?
                LIMIT 1
                `,
                [id]
            );

        if (
            categoriaExistente.length === 0
        ) {

            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Categoria não encontrada."
            });
        }

        // =================================================
        // VERIFICAR NOME DUPLICADO
        // =================================================

        const [nomeExistente] =
            await pool.query(
                `
                SELECT
                    id
                FROM categorias
                WHERE LOWER(nome) = LOWER(?)
                AND id != ?
                LIMIT 1
                `,
                [
                    nomeLimpo,
                    id
                ]
            );

        if (nomeExistente.length > 0) {

            return res.status(409).json({
                sucesso: false,
                mensagem:
                    "Já existe outra categoria com este nome."
            });
        }

        // =================================================
        // ATUALIZAR
        // =================================================

        await pool.query(
            `
            UPDATE categorias
            SET
                nome = ?,
                descricao = ?,
                atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [
                nomeLimpo,
                descricaoLimpa,
                id
            ]
        );

        // =================================================
        // BUSCAR DADOS ATUALIZADOS
        // =================================================

        const [categorias] =
            await pool.query(
                `
                SELECT
                    id,
                    nome,
                    descricao,
                    criado_em,
                    atualizado_em
                FROM categorias
                WHERE id = ?
                `,
                [id]
            );

        return res.status(200).json({
            sucesso: true,
            mensagem:
                "Categoria atualizada com sucesso.",
            categoria: categorias[0]
        });

    } catch (error) {

        console.error(
            "Erro ao atualizar categoria:",
            error
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao atualizar categoria."
        });
    }
};


// =====================================================
// ELIMINAR CATEGORIA
// DELETE /api/categorias/:id
// =====================================================

const eliminarCategoria = async (req, res) => {

    try {

        const { id } = req.params;

        // =================================================
        // VALIDAR ID
        // =================================================

        if (!id || isNaN(id)) {

            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "ID da categoria inválido."
            });
        }

        // =================================================
        // VERIFICAR EXISTÊNCIA
        // =================================================

        const [categorias] =
            await pool.query(
                `
                SELECT
                    id,
                    nome
                FROM categorias
                WHERE id = ?
                LIMIT 1
                `,
                [id]
            );

        if (categorias.length === 0) {

            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Categoria não encontrada."
            });
        }

        // =================================================
        // ELIMINAR
        // =================================================

        await pool.query(
            `
            DELETE FROM categorias
            WHERE id = ?
            `,
            [id]
        );

        return res.status(200).json({
            sucesso: true,
            mensagem:
                "Categoria eliminada com sucesso."
        });

    } catch (error) {

        console.error(
            "Erro ao eliminar categoria:",
            error
        );

        // =================================================
        // CASO A CATEGORIA ESTEJA RELACIONADA
        // COM PRODUTOS
        // =================================================

        if (
            error.code ===
            "ER_ROW_IS_REFERENCED_2" ||
            error.code ===
            "ER_ROW_IS_REFERENCED"
        ) {

            return res.status(409).json({
                sucesso: false,
                mensagem:
                    "Não é possível eliminar esta categoria porque existem produtos associados a ela."
            });
        }

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao eliminar categoria."
        });
    }
};


// =====================================================
// EXPORTAR CONTROLLER
// =====================================================

export default {
    listarCategorias,
    buscarCategoria,
    criarCategoria,
    atualizarCategoria,
    eliminarCategoria
};