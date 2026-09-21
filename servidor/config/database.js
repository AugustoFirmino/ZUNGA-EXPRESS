import mysql from "mysql2/promise";

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// TESTE DE CONEXÃO
pool.getConnection()
    .then(connection => {
        console.log("========================================");
        console.log("MYSQL CONECTADO COM SUCESSO");
        console.log("========================================");

        connection.release();
    })
    .catch(error => {
        console.error("========================================");
        console.error("ERRO AO CONECTAR MYSQL");
        console.error("Código:", error.code);
        console.error("Mensagem:", error.message);
        console.error("========================================");
    });

export default pool;