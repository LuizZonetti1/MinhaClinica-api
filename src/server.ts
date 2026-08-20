// v3 — after rename_document_types migration
import "dotenv/config";
import app from "./app";
import { assertEnv } from "./config/env";
import { registerBirthdayCron } from "./services/notifications/birthdayCronService";
import { registerDailyReportCron } from "./services/notifications/dailyReportCronService";
import { registerNotificationCrons } from "./services/notifications/reminderCronService";

// Antes de abrir a porta: se faltar variável obrigatória, o processo encerra
// aqui com a lista do que falta, em vez de subir e quebrar depois no meio de um
// fluxo de usuário — ou subir funcionando e inseguro. Nenhum módulo importado
// acima lança no carregamento, então esta é a primeira coisa que roda de fato.
assertEnv();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  registerNotificationCrons();
  registerBirthdayCron();
  registerDailyReportCron();
});
