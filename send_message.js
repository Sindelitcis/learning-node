require("dotenv").config();

const colors = require("colors");
const { query } = require("./db");

const env = {
    tableName: process.env.TABLE_NAME,
    chatId: process.env.TELEGRAM_CHAT_ID
};

const sendMessage = async (bot, request) => {

    // Consulta que fará no banco
    const queryString = `
    SELECT
        CONVERT(VARCHAR(10), TRY_CONVERT(DATE, DATA, 103), 103) AS Data,
        CASE ENVIADO
            WHEN '0' THEN 'EM ESPERA'
            WHEN '1' THEN 'ENVIADO'
            WHEN '9' THEN 'LOTE ENVIANDO'
            ELSE 'ERRO/FALHA'
        END AS EnvioWS,
        COUNT(*) AS Quantidade
    FROM ${env.tableName} WITH (NOLOCK)
    WHERE TRY_CONVERT(DATE, DATA, 103) = CONVERT(DATE, GETDATE())
    GROUP BY TRY_CONVERT(DATE, DATA, 103), ENVIADO
    ORDER BY TRY_CONVERT(DATE, DATA, 103)
  `;

    // Realiza a consulta SQL
    const result = await query(request, queryString);

    console.log("Consulta SQL executada com sucesso")

    // Constroi a mensagem
    let message = `<b>${new Date().toLocaleDateString("pt-BR")}</b> ⏰\n\n`;

    result.recordset.forEach((obj) => {
        message += `${obj.EnvioWS} - ${obj.Quantidade}\n`;
    });

    // Envia a mensagem para o Telegram
    try {
        await bot.sendMessage(env.chatId, message, { parse_mode: "HTML" });

        console.log(colors.yellow("Mensagem enviada com sucesso!"));
    } catch (error) {
        console.error(colors.red("Erro ao enviar mensagem:", error.message));
    }
}

module.exports = { sendMessage };