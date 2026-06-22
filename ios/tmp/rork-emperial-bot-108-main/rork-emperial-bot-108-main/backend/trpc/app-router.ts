import { createTRPCRouter } from "./create-context";
import { signalsRouter } from "./routes/signals";
import { alertsRouter } from "./routes/alerts";
import { webhooksRouter } from "./routes/webhooks";
import { tradesRouter } from "./routes/trades";
import { marketProxyRouter } from "./routes/market-proxy";
import { updatesRouter } from "./routes/updates";

export const appRouter = createTRPCRouter({
  signals: signalsRouter,
  alerts: alertsRouter,
  webhooks: webhooksRouter,
  trades: tradesRouter,
  marketProxy: marketProxyRouter,
  updates: updatesRouter,
});

export type AppRouter = typeof appRouter;
