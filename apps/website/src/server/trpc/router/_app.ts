import { adminUsersRouter } from "@/server/trpc/router/admin/users";
import { router } from "../trpc";
import { authRouter } from "./auth";
import { adminActionRouter } from "./admin/actions";
import { pushSubscriptionRouter } from "./push/subscription";
import { notificationsConfigRouter } from "./notificationsConfig";
import { formsRouter } from "./forms";
import { adminFormsRouter } from "./admin/forms";
import { adminActivityFeedRouter } from "./admin/activity-feed";
import { showAndTellRouter } from "./show-and-tell";
import { adminShowAndTellRouter } from "./admin/show-and-tell";

export const appRouter = router({
  auth: authRouter,
  adminAction: adminActionRouter,
  adminForms: adminFormsRouter,
  adminActivityFeed: adminActivityFeedRouter,
  adminShowAndTell: adminShowAndTellRouter,
  adminUsersRouter: adminUsersRouter,
  pushSubscription: pushSubscriptionRouter,
  notificationsConfig: notificationsConfigRouter,
  showAndTell: showAndTellRouter,
  forms: formsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
