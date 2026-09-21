
import "dotenv/config";

import express from "express";
import cors from "cors";

import pool from "./config/database.js";

// =====================================================
// ROTAS
// =====================================================

import adminRoutes from "./routes/adminRoutes.js";
import categoriasRoutes from "./routes/categoriasRoutes.js";
import clientesRoutes from "./routes/clientesRoutes.js";
import produtosRoutes from "./routes/produtosRoutes.js";
import pedidosRoutes from "./routes/pedidosRoutes.js";
import gestorRoutes from "./routes/gestoresRoutes.js";
import vendasRoutes from "./routes/vendasRoutes.js";
import KilapeRoutes from "./routes/kilapeRoutes.js";

// =====================================================
// EXPRESS
// =====================================================

const app = express();

// =====================================================
// CONFIGURAÇÕES
// =====================================================

app.disable("x-powered-by");

// =====================================================
// CORS
// =====================================================

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://localhost:5713",
            "http://172.31.80.1:5713",
        ],

        methods: [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "PATCH",
            "OPTIONS",
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization",
        ],

        credentials: true,
    })
);

// =====================================================
// BODY JSON
// =====================================================

app.use(
    express.json({
        limit: "10mb",
    })
);

// =====================================================
// BODY FORM URLENCODED
// =====================================================

app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb",
    })
);

// =====================================================
// TESTE DAS ROTAS
// =====================================================

console.log("");
console.log("========================================");
console.log("VERIFICANDO ROTAS");
console.log("========================================");

console.log(
    "adminRoutes:",
    typeof adminRoutes
);

console.log(
    "categoriasRoutes:",
    typeof categoriasRoutes
);

console.log(
    "clientesRoutes:",
    typeof clientesRoutes
);

console.log(
    "produtosRoutes:",
    typeof produtosRoutes
);

console.log("========================================");
console.log("");

// =====================================================
// VALIDAÇÃO
// =====================================================

if (typeof adminRoutes !== "function") {
    console.error(
        "ERRO: adminRoutes não é um Router válido."
    );
}

if (typeof categoriasRoutes !== "function") {
    console.error(
        "ERRO: categoriasRoutes não é um Router válido."
    );
}

if (typeof clientesRoutes !== "function") {
    console.error(
        "ERRO: clientesRoutes não é um Router válido."
    );
}

if (typeof produtosRoutes !== "function") {
    console.error(
        "ERRO: produtosRoutes não é um Router válido."
    );
}

// =====================================================
// TESTAR MYSQL
// =====================================================

const conectarBanco = async () => {
    let conexao;

    try {
        conexao = await pool.getConnection();

        console.log(
            "MySQL conectado com sucesso"
        );
    } catch (error) {
        console.error(
            "Erro ao conectar MySQL:",
            error.message
        );
    } finally {
        if (conexao) {
            conexao.release();
        }
    }
};

conectarBanco();

// =====================================================
// ROTA PRINCIPAL
// =====================================================

app.get(
    "/",
    (req, res) => {
        return res.status(200).json({
            sucesso: true,

            mensagem:
                "API Agenda Salão funcionando correctamente.",

            servidor:
                "Node.js + Express",

            banco:
                "MySQL",
        });
    }
);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
    "/api/health",
    async (req, res) => {
        let conexao;

        try {
            conexao =
                await pool.getConnection();

            return res.status(200).json({
                sucesso: true,

                servidor:
                    "online",

                mysql:
                    "online",
            });

        } catch (error) {

            return res.status(500).json({
                sucesso: false,

                servidor:
                    "online",

                mysql:
                    "offline",

                erro:
                    process.env.NODE_ENV ===
                    "production"
                        ? undefined
                        : error.message,
            });

        } finally {

            if (conexao) {
                conexao.release();
            }

        }
    }
);

// =====================================================
// ADMIN
// =====================================================

if (typeof adminRoutes === "function") {

    app.use(
        "/api/admin",
        adminRoutes
    );

}

// =====================================================
// CLIENTES
// =====================================================

if (typeof clientesRoutes === "function") {

    app.use(
        "/api/clientes",
        clientesRoutes
    );

}

// =====================================================
// CATEGORIAS
// =====================================================

if (typeof categoriasRoutes === "function") {

    app.use(
        "/api/categorias",
        categoriasRoutes
    );

}

// =====================================================
// PRODUTOS
// =====================================================

if (typeof produtosRoutes === "function") {

    app.use(
        "/api/produtos",
        produtosRoutes
    );

}

if (typeof pedidosRoutes === "function") {

app.use(
    "/api/pedidos",
    pedidosRoutes
);

}



if (typeof gestorRoutes === "function") {

app.use(
    "/api/gestores",
    gestorRoutes
);

}


if (typeof vendasRoutes === "function") {

app.use(
    "/api/vendas",
    vendasRoutes
);

}

if (typeof KilapeRoutes === "function") {

app.use(
    "/api/kilapes",
    KilapeRoutes 
);

}



// =====================================================
// ROTA 404
// =====================================================

app.use(
    (req, res) => {

        return res.status(404).json({

            sucesso: false,

            mensagem:
                "Rota não encontrada.",

            rota:
                req.originalUrl,

            metodo:
                req.method,

        });

    }
);

// =====================================================
// ERRO GLOBAL
// =====================================================

app.use(
    (
        err,
        req,
        res,
        next
    ) => {

        console.error(
            "========================================"
        );

        console.error(
            "ERRO SERVIDOR"
        );

        console.error(err);

        console.error(
            "========================================"
        );

        if (res.headersSent) {
            return next(err);
        }

        return res.status(500).json({

            sucesso: false,

            mensagem:
                "Erro interno do servidor.",

            erro:
                process.env.NODE_ENV ===
                "production"
                    ? undefined
                    : err.message,

        });

    }
);

// =====================================================
// PORTA
// =====================================================

const PORT =
    Number(
        process.env.PORT || 5000
    );

// =====================================================
// SERVIDOR
// =====================================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log("");
        console.log(
            "========================================"
        );

        console.log(
            `Servidor rodando na porta ${PORT}`
        );

        console.log(
            `http://localhost:${PORT}`
        );

        console.log(
            `http://localhost:${PORT}/api/health`
        );

        console.log(
            `http://localhost:${PORT}/api/produtos`
        );

        console.log(
            "========================================"
        );
        console.log("");

    }
);
