
import pool from "../config/database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// =====================================================
// CONFIGURAÇÕES / FUNÇÕES AUXILIARES
// =====================================================

const normalizarEmail = (email) => {
    return String(email ?? "")
        .trim()
        .toLowerCase();
};

const normalizarTexto = (valor) => {
    return String(valor ?? "").trim();
};

const normalizarTelefone = (telefone) => {
    return String(telefone ?? "").trim();
};

// =====================================================
// VALIDAR EMAIL
// =====================================================

const emailValido = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// =====================================================
// VALIDAR HASH BCRYPT
// =====================================================

const ehHashBcrypt = (senha) => {
    return (
        typeof senha === "string" &&
        /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(senha)
    );
};

// =====================================================
// GERAR TOKEN
// =====================================================

const gerarTokenAdmin = (admin) => {
    const segredo = process.env.JWT_SECRET;

    if (!segredo) {
        throw new Error(
            "JWT_SECRET não configurado no servidor."
        );
    }

    return jwt.sign(
        {
            id: admin.id,
            nome: admin.nome,
            email: admin.email,
            tipo: "admin"
        },
        segredo,
        {
            expiresIn:
                process.env.JWT_EXPIRES_IN || "8h"
        }
    );
};

// =====================================================
// BUSCAR ADMIN POR EMAIL
// =====================================================

const buscarAdminPorEmail = async (email) => {
    const [admins] = await pool.query(
        `
        SELECT
            id,
            nome,
            email,
            telefone,
            senha
        FROM admin
        WHERE LOWER(TRIM(email)) = ?
        LIMIT 1
        `,
        [email]
    );

    return admins[0] || null;
};

// =====================================================
// BUSCAR ADMIN POR ID
// =====================================================

const buscarAdminPorId = async (id) => {
    const [admins] = await pool.query(
        `
        SELECT
            id,
            nome,
            email,
            telefone,
            senha
        FROM admin
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    return admins[0] || null;
};

// =====================================================
// OBTER ID DO ADMIN AUTENTICADO
// =====================================================

const obterIdAdminAutenticado = (req) => {
    return (
        req.admin?.id ||
        req.usuario?.id ||
        req.user?.id ||
        null
    );
};

// =====================================================
// FORMATAR ADMIN
// =====================================================

const formatarAdmin = (admin) => {
    return {
        id: admin.id,
        nome: admin.nome || "",
        email: admin.email || "",
        telefone: admin.telefone || "",
        tipo: "admin"
    };
};

// =====================================================
// RESPOSTA LOGIN
// =====================================================

const respostaLoginAdmin = (res, admin) => {
    const token = gerarTokenAdmin(admin);

    const usuario = formatarAdmin(admin);

    return res.status(200).json({
        sucesso: true,
        mensagem: "Login realizado com sucesso.",
        token,
        usuario,
        admin: usuario,
        tipo: "admin",
        redirecionar: "/dashboard"
    });
};

// =====================================================
// LOGIN ADMIN
// POST /api/admin/login
// =====================================================

export const loginAdmin = async (req, res) => {
    try {
        console.log("\n=================================");
        console.log("LOGIN ADMIN");
        console.log("=================================");

        const body = req.body || {};

        const email = normalizarEmail(body.email);

        const senha =
            body.senha !== undefined
                ? String(body.senha)
                : "";

        if (!email) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "O email é obrigatório."
            });
        }

        if (!emailValido(email)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Informe um email válido."
            });
        }

        if (!senha) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "A senha é obrigatória."
            });
        }

        const admin = await buscarAdminPorEmail(email);

        if (!admin) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Email ou senha incorretos."
            });
        }

        if (!admin.senha) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Email ou senha incorretos."
            });
        }

        if (!ehHashBcrypt(String(admin.senha))) {
            console.error(
                "A senha do administrador não está em formato bcrypt."
            );

            return res.status(500).json({
                sucesso: false,
                mensagem:
                    "A senha armazenada do administrador está inválida."
            });
        }

        const senhaValida = await bcrypt.compare(
            senha,
            String(admin.senha)
        );

        if (!senhaValida) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Email ou senha incorretos."
            });
        }

        console.log(
            "LOGIN ADMIN REALIZADO:",
            admin.email
        );

        return respostaLoginAdmin(res, admin);

    } catch (erro) {
        console.error(
            "ERRO LOGIN ADMIN:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro interno ao realizar login.",
            erro:
                process.env.NODE_ENV === "production"
                    ? undefined
                    : erro.message
        });
    }
};

// =====================================================
// LOGIN GERAL
// POST /api/admin/login-geral
// =====================================================

export const login = async (req, res) => {
    try {
        const body = req.body || {};

        const email =
            normalizarEmail(body.email);

        const senha =
            body.senha !== undefined
                ? String(body.senha)
                : "";

        if (!email) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "O email é obrigatório."
            });
        }

        if (!emailValido(email)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Informe um email válido."
            });
        }

        if (!senha) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "A senha é obrigatória."
            });
        }

        const admin =
            await buscarAdminPorEmail(email);

        if (!admin) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Email ou senha incorretos."
            });
        }

        if (
            !admin.senha ||
            !ehHashBcrypt(
                String(admin.senha)
            )
        ) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Email ou senha incorretos."
            });
        }

        const senhaValida =
            await bcrypt.compare(
                senha,
                String(admin.senha)
            );

        if (!senhaValida) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Email ou senha incorretos."
            });
        }

        return respostaLoginAdmin(
            res,
            admin
        );

    } catch (erro) {
        console.error(
            "ERRO LOGIN GERAL:",
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
// VERIFICAR ADMIN / ESTADO DA PLATAFORMA
//
// GET /api/admin/verificar
//
// ESTA ROTA NÃO PRECISA DE TOKEN
// =====================================================

export const verificarAdmin = async (req, res) => {
    try {
        console.log("\n=================================");
        console.log("VERIFICAR ESTADO DA PLATAFORMA");
        console.log("=================================");

        const [resultado] = await pool.query(
            `
            SELECT COUNT(*) AS total
            FROM admin
            `
        );

        const total = Number(
            resultado?.[0]?.total ?? 0
        );

        const existe = total > 0;

        console.log("Total de administradores:", total);
        console.log("Existe administrador:", existe);

        return res.status(200).json({
            sucesso: true,
            existe,
            total,
            plataforma: {
                configurada: existe,
                existeAdmin: existe
            }
        });

    } catch (erro) {
        console.error(
            "ERRO VERIFICAR ESTADO DA PLATAFORMA:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            existe: false,
            total: 0,
            plataforma: {
                configurada: false,
                existeAdmin: false
            },
            mensagem:
                "Não foi possível verificar o estado da plataforma.",
            erro:
                process.env.NODE_ENV === "production"
                    ? undefined
                    : erro.message
        });
    }
};

// =====================================================
// CRIAR ADMIN
//
// POST /api/admin/criar
//
// Apenas permite criar o primeiro administrador.
// =====================================================

export const criarAdmin = async (req, res) => {
    try {
        const body = req.body || {};

        const nome =
            normalizarTexto(body.nome);

        const email =
            normalizarEmail(body.email);

        const senha =
            body.senha !== undefined
                ? String(body.senha)
                : "";

        const telefone =
            normalizarTelefone(body.telefone);

        if (!nome) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "O nome é obrigatório."
            });
        }

        if (nome.length < 3) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O nome deve ter pelo menos 3 caracteres."
            });
        }

        if (!email) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "O email é obrigatório."
            });
        }

        if (!emailValido(email)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Informe um email válido."
            });
        }

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
        // VERIFICAR SE JÁ EXISTE ADMIN
        // =================================================

        const [totalAdmins] =
            await pool.query(
                `
                SELECT COUNT(*) AS total
                FROM admin
                `
            );

        const total =
            Number(
                totalAdmins?.[0]?.total ?? 0
            );

        if (total > 0) {
            return res.status(403).json({
                sucesso: false,
                mensagem:
                    "Já existe um administrador cadastrado."
            });
        }

        // =================================================
        // VERIFICAR EMAIL
        // =================================================

        const [existente] =
            await pool.query(
                `
                SELECT id
                FROM admin
                WHERE LOWER(TRIM(email)) = ?
                LIMIT 1
                `,
                [email]
            );

        if (existente.length > 0) {
            return res.status(409).json({
                sucesso: false,
                mensagem:
                    "Este email já está cadastrado."
            });
        }

        // =================================================
        // GERAR HASH
        // =================================================

        const senhaHash =
            await bcrypt.hash(
                senha,
                12
            );

        // =================================================
        // INSERIR ADMIN
        // =================================================

        const [resultado] =
            await pool.query(
                `
                INSERT INTO admin
                (
                    nome,
                    email,
                    senha,
                    telefone
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    nome,
                    email,
                    senhaHash,
                    telefone
                ]
            );

        const adminCriado = {
            id: resultado.insertId,
            nome,
            email,
            telefone,
            tipo: "admin"
        };

        return res.status(201).json({
            sucesso: true,
            mensagem:
                "Conta de administrador criada com sucesso.",
            usuario: adminCriado,
            admin: adminCriado
        });

    } catch (erro) {
        console.error(
            "ERRO CRIAR ADMIN:",
            erro
        );

        // Email UNIQUE
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
                "Erro ao criar administrador.",
            erro:
                process.env.NODE_ENV === "production"
                    ? undefined
                    : erro.message
        });
    }
};

// =====================================================
// OBTER ADMIN AUTENTICADO
//
// GET /api/admin/me
//
// EXIGE TOKEN
// =====================================================

export const obterAdmin = async (req, res) => {
    try {
        const adminId =
            obterIdAdminAutenticado(req);

        if (!adminId) {
            return res.status(401).json({
                sucesso: false,
                mensagem:
                    "Administrador não autenticado."
            });
        }

        const admin =
            await buscarAdminPorId(
                adminId
            );

        if (!admin) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Administrador não encontrado."
            });
        }

        const usuario =
            formatarAdmin(admin);

        return res.status(200).json({
            sucesso: true,
            usuario,
            admin: usuario
        });

    } catch (erro) {
        console.error(
            "ERRO OBTER ADMIN:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao carregar administrador.",
            erro:
                process.env.NODE_ENV === "production"
                    ? undefined
                    : erro.message
        });
    }
};

// =====================================================
// ACTUALIZAR DADOS DO ADMIN
//
// PUT /api/admin/dados
// PUT /api/admin/perfil
//
// EXIGE TOKEN
// =====================================================

export const actualizarDadosAdmin = async (
    req,
    res
) => {
    try {
        const adminId =
            obterIdAdminAutenticado(req);

        if (!adminId) {
            return res.status(401).json({
                sucesso: false,
                mensagem:
                    "Administrador não autenticado."
            });
        }

        const body =
            req.body || {};

        const nome =
            normalizarTexto(
                body.nome
            );

        const email =
            normalizarEmail(
                body.email
            );

        const telefone =
            normalizarTelefone(
                body.telefone
            );

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

        if (!email) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O email é obrigatório."
            });
        }

        if (!emailValido(email)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Informe um email válido."
            });
        }

        const admin =
            await buscarAdminPorId(
                adminId
            );

        if (!admin) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Administrador não encontrado."
            });
        }

        // =================================================
        // EMAIL DE OUTRO ADMIN
        // =================================================

        const [emailExistente] =
            await pool.query(
                `
                SELECT id
                FROM admin
                WHERE LOWER(TRIM(email)) = ?
                AND id <> ?
                LIMIT 1
                `,
                [
                    email,
                    adminId
                ]
            );

        if (emailExistente.length > 0) {
            return res.status(409).json({
                sucesso: false,
                mensagem:
                    "Este email já está sendo utilizado por outro administrador."
            });
        }

        // =================================================
        // ACTUALIZAR
        // =================================================

        await pool.query(
            `
            UPDATE admin
            SET
                nome = ?,
                email = ?,
                telefone = ?
            WHERE id = ?
            `,
            [
                nome,
                email,
                telefone,
                adminId
            ]
        );

        const adminAtualizado =
            await buscarAdminPorId(
                adminId
            );

        if (!adminAtualizado) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Administrador não encontrado após atualização."
            });
        }

        const usuario =
            formatarAdmin(
                adminAtualizado
            );

        return res.status(200).json({
            sucesso: true,
            mensagem:
                "Dados actualizados com sucesso.",
            usuario,
            admin: usuario
        });

    } catch (erro) {
        console.error(
            "ERRO ACTUALIZAR DADOS ADMIN:",
            erro
        );

        if (
            erro.code === "ER_DUP_ENTRY"
        ) {
            return res.status(409).json({
                sucesso: false,
                mensagem:
                    "Este email já está sendo utilizado."
            });
        }

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao actualizar os dados do administrador.",
            erro:
                process.env.NODE_ENV === "production"
                    ? undefined
                    : erro.message
        });
    }
};

// =====================================================
// ALTERAR SENHA DO ADMIN
//
// PUT /api/admin/senha
//
// USA:
// - token
// - senhaAtual
// - novaSenha
//
// O token identifica o administrador.
// =====================================================

export const actualizarSenhaAdmin = async (
    req,
    res
) => {
    try {
        console.log("\n=================================");
        console.log("ALTERAR SENHA ADMIN");
        console.log("=================================");

        const adminId =
            obterIdAdminAutenticado(req);

        if (!adminId) {
            return res.status(401).json({
                sucesso: false,
                mensagem:
                    "Administrador não autenticado."
            });
        }

        const body =
            req.body || {};

        const senhaAtual =
            String(
                body.senhaAtual ?? ""
            );

        const novaSenha =
            String(
                body.novaSenha ?? ""
            );

        // =================================================
        // VALIDAR SENHA ACTUAL
        // =================================================

        if (!senhaAtual) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "A senha actual é obrigatória."
            });
        }

        // =================================================
        // VALIDAR NOVA SENHA
        // =================================================

        if (!novaSenha) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "A nova senha é obrigatória."
            });
        }

        if (novaSenha.length < 6) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "A nova senha deve ter pelo menos 6 caracteres."
            });
        }

        if (senhaAtual === novaSenha) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "A nova senha deve ser diferente da senha actual."
            });
        }

        // =================================================
        // BUSCAR ADMIN
        // =================================================

        const admin =
            await buscarAdminPorId(
                adminId
            );

        if (!admin) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Administrador não encontrado."
            });
        }

        // =================================================
        // VALIDAR HASH
        // =================================================

        if (
            !admin.senha ||
            !ehHashBcrypt(
                String(admin.senha)
            )
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "A senha actual está em formato inválido."
            });
        }

        // =================================================
        // COMPARAR SENHA
        // =================================================

        const senhaValida =
            await bcrypt.compare(
                senhaAtual,
                String(admin.senha)
            );

        if (!senhaValida) {
            return res.status(401).json({
                sucesso: false,
                mensagem:
                    "A senha actual está incorreta."
            });
        }

        // =================================================
        // GERAR NOVO HASH
        // =================================================

        const novaSenhaHash =
            await bcrypt.hash(
                novaSenha,
                12
            );

        // =================================================
        // ACTUALIZAR
        // =================================================

        const [resultado] =
            await pool.query(
                `
                UPDATE admin
                SET senha = ?
                WHERE id = ?
                `,
                [
                    novaSenhaHash,
                    adminId
                ]
            );

        if (
            !resultado ||
            resultado.affectedRows === 0
        ) {
            return res.status(500).json({
                sucesso: false,
                mensagem:
                    "Não foi possível actualizar a senha."
            });
        }

        console.log(
            "SENHA ACTUALIZADA COM SUCESSO"
        );

        return res.status(200).json({
            sucesso: true,
            mensagem:
                "Senha actualizada com sucesso.",
            usuario:
                formatarAdmin(admin)
        });

    } catch (erro) {
        console.error(
            "ERRO ALTERAR SENHA ADMIN:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao alterar a senha.",
            erro:
                process.env.NODE_ENV === "production"
                    ? undefined
                    : erro.message
        });
    }
};

// =====================================================
// RESETAR SENHA
//
// POST /api/admin/resetar-senha
//
// NÃO USA TOKEN
//
// ATENÇÃO:
// Esta rota deve ser protegida posteriormente por um
// mecanismo real de recuperação de conta.
// =====================================================

export const resetarSenhaAdmin = async (
    req,
    res
) => {
    try {
        const body =
            req.body || {};

        const email =
            normalizarEmail(
                body.email
            );

        const novaSenha =
            String(
                body.novaSenha ?? ""
            );

        if (!email) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "O email é obrigatório."
            });
        }

        if (!emailValido(email)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Informe um email válido."
            });
        }

        if (!novaSenha) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "A nova senha é obrigatória."
            });
        }

        if (novaSenha.length < 6) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "A nova senha deve ter pelo menos 6 caracteres."
            });
        }

        const admin =
            await buscarAdminPorEmail(
                email
            );

        if (!admin) {
            return res.status(404).json({
                sucesso: false,
                mensagem:
                    "Administrador não encontrado."
            });
        }

        const senhaHash =
            await bcrypt.hash(
                novaSenha,
                12
            );

        const [resultado] =
            await pool.query(
                `
                UPDATE admin
                SET senha = ?
                WHERE id = ?
                `,
                [
                    senhaHash,
                    admin.id
                ]
            );

        if (
            !resultado ||
            resultado.affectedRows === 0
        ) {
            return res.status(500).json({
                sucesso: false,
                mensagem:
                    "Não foi possível redefinir a senha."
            });
        }

        console.log(
            "SENHA DO ADMIN REDEFINIDA:",
            admin.email
        );

        return res.status(200).json({
            sucesso: true,
            mensagem:
                "Senha do administrador redefinida com sucesso."
        });

    } catch (erro) {
        console.error(
            "ERRO RESETAR SENHA ADMIN:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao redefinir senha.",
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
    login,
    loginAdmin,
    verificarAdmin,
    criarAdmin,
    obterAdmin,
    actualizarDadosAdmin,
    actualizarSenhaAdmin,
    resetarSenhaAdmin
};
