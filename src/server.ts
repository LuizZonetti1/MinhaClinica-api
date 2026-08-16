// v3 — after rename_document_types migration
import "dotenv/config";
import app from "./app";
import { registerBirthdayCron } from "./services/notifications/birthdayCronService";
import { registerDailyReportCron } from "./services/notifications/dailyReportCronService";
import { registerNotificationCrons } from "./services/notifications/reminderCronService";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  registerNotificationCrons();
  registerBirthdayCron();
  registerDailyReportCron();
});
