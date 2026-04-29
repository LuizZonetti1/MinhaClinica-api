// v3 — after rename_document_types migration
import "dotenv/config";
import app from "./app";
import { registerNotificationCrons } from "./services/notifications/reminderCronService";
import { registerBirthdayCron } from "./services/notifications/birthdayCronService";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  registerNotificationCrons();
  registerBirthdayCron();
});
