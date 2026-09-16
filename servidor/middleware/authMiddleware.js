import jwt from "jsonwebtoken";

// =====================================================
// VERIFICAR JWT
// =====================================================

export const verificarToken = (
    req,
    res,
    next
) => {
    try {

        const segredo =
            process.env.JWT_SECRET;

        // =================================================
        // VERIFICAR JWT_SECRET
        // =================================================

        if (!segredo) {

            console.error(
                "JWT_SECRET não configurado."
            );

            return res.status(500).json({
                sucesso: false,
                mensagem:
                    "JWT_SECRET não configurado no servidor."
            });
        }

        // =================================================
        // BUSCAR AUTHORIZATION
        // =================================================

        const authorization =
            req.headers.authorization;

        if (!authorization) {

            return res.status(401).json({
                sucesso: false,
                mensagem:
                    "Token de autenticação não enviado."
            });
        }

        // =================================================
        // SEPARAR BEARER TOKEN
        // =================================================

        const partes =
            authorization.split(" ");

        if (
            partes.length !== 2 ||
            partes[0] !== "Bearer" ||
            !partes[1]
        ) {

            return res.status(401).json({
                sucesso: false,
                mensagem:
                    "Formato do token inválido."
            });
        }

        const token =
            partes[1];

        // =================================================
        // VALIDAR JWT
        // =================================================

        const decodificado =
            jwt.verify(
                token,
                segredo
            );

        // =================================================
        // GUARDAR USUÁRIO
        // =================================================

        req.usuario =
            decodificado;

        // Compatibilidade
        req.user =
            decodificado;

        // =================================================
        // SE FOR ADMIN
        // =================================================

        if (
            decodificado.tipo === "admin"
        ) {

            req.admin =
                decodificado;
        }

        // =================================================
        // SE FOR CLIENTE
        // =================================================

        if (
            decodificado.tipo === "cliente"
        ) {

            req.cliente =
                decodificado;
        }

        // =================================================
        // SE FOR GESTOR
        // =================================================

        if (
            decodificado.tipo === "gestor"
        ) {

            req.gestor =
                decodificado;
        }

        // =================================================
        // CONTINUAR
        // =================================================

        next();

    } catch (erro) {

        console.error(
            "Erro ao verificar token:",
            erro.message
        );

        // =================================================
        // TOKEN EXPIRADO
        // =================================================

        if (
            erro.name ===
            "TokenExpiredError"
        ) {

            return res.status(401).json({
                sucesso: false,
                mensagem:
                    "Token expirado. Faça login novamente."
            });
        }

        // =================================================
        // TOKEN INVÁLIDO
        // =================================================

        if (
            erro.name ===
            "JsonWebTokenError"
        ) {

            return res.status(401).json({
                sucesso: false,
                mensagem:
                    "Token inválido."
            });
        }

        // =================================================
        // OUTRO ERRO
        // =================================================

        return res.status(401).json({
            sucesso: false,
            mensagem:
                "Não foi possível autenticar o usuário."
        });
    }
};


// =====================================================
// AUTENTICAR ADMIN
// =====================================================

export const autenticarAdmin = (
    req,
    res,
    next
) => {

    verificarToken(
        req,
        res,
        () => {

            // =============================================
            // VERIFICAR SE É ADMIN
            // =============================================

            if (
                !req.usuario ||
                req.usuario.tipo !== "admin"
            ) {

                return res.status(403).json({
                    sucesso: false,
                    mensagem:
                        "Acesso permitido apenas para administradores."
                });
            }

            // =============================================
            // GARANTIR req.admin
            // =============================================

            req.admin =
                req.usuario;

            next();
        }
    );
};

// =====================================================
// AUTENTICAR GESTOR
// =====================================================

export const autenticarGestor = (
    req,
    res,
    next
) => {

    verificarToken(
        req,
        res,
        () => {

            if (
                !req.usuario ||
                req.usuario.tipo !== "gestor"
            ) {

                return res.status(403).json({
                    sucesso: false,
                    mensagem:
                        "Acesso permitido apenas para gestores."
                });
            }

            req.gestor =
                req.usuario;

            next();
        }
    );
};


// =====================================================
// VERIFICAR TOKEN ADMIN
//
// Alias de autenticarAdmin.
//
// Permite usar:
// verificarTokenAdmin
//
// ou:
// autenticarAdmin
// =====================================================

export const verificarTokenAdmin = (
    req,
    res,
    next
) => {

    autenticarAdmin(
        req,
        res,
        next
    );
};


// =====================================================
// AUTENTICAR CLIENTE
// =====================================================

export const autenticarCliente = (
    req,
    res,
    next
) => {

    verificarToken(
        req,
        res,
        () => {

            // =============================================
            // VERIFICAR SE É CLIENTE
            // =============================================

            if (
                !req.usuario ||
                req.usuario.tipo !== "cliente"
            ) {

                return res.status(403).json({
                    sucesso: false,
                    mensagem:
                        "Acesso permitido apenas para clientes."
                });
            }

            // =============================================
            // GARANTIR req.cliente
            // =============================================

            req.cliente =
                req.usuario;

            next();
        }
    );
};


// =====================================================
// AUTENTICAR QUALQUER USUÁRIO
//
// ADMIN OU CLIENTE
// =====================================================

export const autenticarUsuario = (
    req,
    res,
    next
) => {

    verificarToken(
        req,
        res,
        next
    );
};


// =====================================================
// EXPORT DEFAULT
// =====================================================

export default {
    verificarToken,
    verificarTokenAdmin,
    autenticarAdmin,
    autenticarCliente,
    autenticarUsuario
};