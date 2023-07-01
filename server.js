require('dotenv').config();
const sql = require('mssql/msnodesqlv8');
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const colors = require('colors');

const env = {
  dbConnection: process.env.DB_CONNECTION,
  token: process.env.TOKEN,
  table: process.env.TABLE,
  chatID: process.env.ID_GRUPO_TN
}

const config = {
  connectionString: env.dbConnection
};

// Configurar o token do bot do Telegram
const botToken = process.env.TOKEN;
const bot = new TelegramBot(botToken);

// Agendar a tarefa para ser executada a cada hora das 7h às 23h
cron.schedule('0 7-23 * * *', () => {

  // Rodar a cada minuto para testes
  // cron.schedule('* * * * *', () => {

  console.log(colors.white.bold('Agendamento iniciado'));

  // Abrir a conexão com o banco de dados
  sql.connect(config, (error) => {
    if (error) {
      console.error(colors.red('Erro ao conectar ao banco de dados:', error.message));
      return;
    }

    console.log('Conexão com o banco de dados estabelecida');

    const request = new sql.Request();

    request.query(`
    SELECT
        CONVERT(VARCHAR(10), TRY_CONVERT(DATE, DATA, 103), 103) AS Data,
        CASE ENVIADO
            WHEN '0' THEN 'EM ESPERA'
            WHEN '1' THEN 'ENVIADO'
            WHEN '9' THEN 'LOTE ENVIANDO'
            ELSE 'ERRO/FALHA'
        END AS EnvioWS,
        COUNT(*) AS Quantidade
      FROM ${env.table} WITH (NOLOCK)
      WHERE TRY_CONVERT(DATE, DATA, 103) = CONVERT(DATE, GETDATE())
      GROUP BY TRY_CONVERT(DATE, DATA, 103), ENVIADO
      ORDER BY TRY_CONVERT(DATE, DATA, 103)
    `, (err, result) => {
      if (err) {
        console.error(colors.red('Erro ao executar a consulta SQL:', err.message));
        return;
      }

      console.log('Consulta SQL executada com sucesso');

      const chatId = env.chatID;

      // Construir a mensagem formatada
      let message = '';
      let currentDay = '';
      result.recordset.forEach((obj) => {
        if (obj.Data !== currentDay) {
          message += `<b>${obj.Data}</b> ⏰\n\n`;
          currentDay = obj.Data;
        }
        message += `${obj.EnvioWS} - ${obj.Quantidade}\n`;
      });

      // Enviar mensagem para o chat no Telegram
      bot.sendMessage(chatId, message, { parse_mode: 'HTML' })
        .then(() => {
          console.log(colors.yellow('Mensagem enviada com sucesso!'));
        })
        .catch((error) => {
          console.error(colors.red('Erro ao enviar mensagem:', error.message));
        })
        .finally(() => {
          sql.close();
          console.log('Conexão com o banco de dados fechada');
        });
    });
  });
}, {
  scheduled: true, // Habilitar a execução agendada
  timezone: 'America/Sao_Paulo', // Definir o fuso horário adequado
  start: true // Iniciar a tarefa imediatamente
});

console.log(colors.green.bold('Servidor iniciado'));