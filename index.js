require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api")
const cron = require("node-cron");
const colors = require("colors");
const { sendMessage } = require("./send_message");
const { connection } = require("./db");

// Configurar token do bot
const bot = new TelegramBot(process.env.TOKEN);

// Função que executa a tarefa principal
const cronjob = async (request) => {
  console.log(colors.white.bold("Agendamento iniciado"));

  try {
    // Envia a mensagem no telegram da consulta
    await sendMessage(bot, request);
  } catch (error) {
    // Se falhar, envia uma mensagem de erro no telegram
    const errorMessage = `<b>Erro ao executar a consulta SQL:</b>\n\n<code>${err.message}</code>`;

    await bot
      .sendMessage(chatId, errorMessage, { parse_mode: "HTML" })
      .catch((err) => {
        console.log(colors.red("Bot falhou em enviar a mensagem", err.message))
      });

    console.error(colors.red("Erro ao executar a consulta SQL:", err.message));
  }
};

const main = async () => {
  // Abrir a conexão com o banco de dados
  const { request } = await connection();

  // Agendar a tarefa para ser executada a cada hora das 7h às 23h
  cron.schedule("0 7-23 * * *", () => cronjob(request), {
    timezone: "America/Sao_Paulo", // Definir o fuso horário adequado
    runOnInit: true, // Iniciar a tarefa imediatamente
  });
}

main()