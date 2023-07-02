require("dotenv").config();

const sql = require("mssql/msnodesqlv8");
const colors = require("colors");

const config = {
    connectionString: process.env.DB_CONNECTION,
    requestTimeout: 5 * 60 * 1000 // Tempo limite da consulta: 5 minutos
};

// Cria a conexão com a base de dados para usar assincronamente
// (pra poder usar async await ao invés dos callbacks)
// e retorna a request e a instância do SQL
const connection = () =>
    new Promise((resolve, reject) =>
        sql.connect(config, (error) => {
            if (error) {
                console.error(
                    colors.red("Erro ao conectar ao banco de dados:", error.message)
                );

                reject(error);
                return;
            }

            console.log("Conexão com o banco de dados estabelecida");

            resolve({ request: new sql.Request(), sql });
        })
    );

// Função que executa uma query no banco de dados
const query = (request, queryStr) => {
    return new Promise((resolve, reject) => {
        request.query(queryStr, (err, result) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(result);
        })
    })
};

module.exports = { connection, query };