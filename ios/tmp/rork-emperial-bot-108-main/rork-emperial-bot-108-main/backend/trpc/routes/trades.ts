import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";

export type TradeDirection = "long" | "short";
export type TradeStatus = "open" | "closed" | "cancelled";

export interface Trade {
  id: string;
  signalId: string | null;
  instrument: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  trailingStop: number;
  status: TradeStatus;
  pnl: number | null;
  pnlPercent: number | null;
  fees: number;
  openedAt: string;
  closedAt: string | null;
  notes: string;
  broker: string;
}

const tradeStore: Trade[] = [];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export const tradesRouter = createTRPCRouter({
  open: publicProcedure
    .input(
      z.object({
        signalId: z.string().nullable().optional(),
        instrument: z.string(),
        direction: z.enum(["long", "short"]),
        entryPrice: z.number(),
        quantity: z.number().min(0.001),
        stopLoss: z.number(),
        takeProfit1: z.number(),
        takeProfit2: z.number().optional(),
        takeProfit3: z.number().optional(),
        trailingStop: z.number().optional(),
        fees: z.number().optional(),
        notes: z.string().optional(),
        broker: z.string().optional(),
      }),
    )
    .mutation(({ input }) => {
      const trade: Trade = {
        id: generateId(),
        signalId: input.signalId ?? null,
        instrument: input.instrument,
        direction: input.direction,
        entryPrice: input.entryPrice,
        exitPrice: null,
        quantity: input.quantity,
        stopLoss: input.stopLoss,
        takeProfit1: input.takeProfit1,
        takeProfit2: input.takeProfit2 ?? 0,
        takeProfit3: input.takeProfit3 ?? 0,
        trailingStop: input.trailingStop ?? 0,
        status: "open",
        pnl: null,
        pnlPercent: null,
        fees: input.fees ?? 0,
        openedAt: new Date().toISOString(),
        closedAt: null,
        notes: input.notes ?? "",
        broker: input.broker ?? "manual",
      };

      tradeStore.unshift(trade);
      console.log("[Trades] Opened:", trade.id, trade.instrument, trade.direction);
      return trade;
    }),

  close: publicProcedure
    .input(
      z.object({
        id: z.string(),
        exitPrice: z.number(),
        fees: z.number().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(({ input }) => {
      const trade = tradeStore.find((t) => t.id === input.id);
      if (!trade) {
        throw new Error("Trade not found");
      }
      if (trade.status !== "open") {
        throw new Error("Trade is not open");
      }

      trade.exitPrice = input.exitPrice;
      trade.status = "closed";
      trade.closedAt = new Date().toISOString();

      if (input.fees !== undefined) {
        trade.fees += input.fees;
      }
      if (input.notes) {
        trade.notes = trade.notes ? `${trade.notes}\n${input.notes}` : input.notes;
      }

      const sign = trade.direction === "long" ? 1 : -1;
      const rawPnl = sign * (trade.exitPrice - trade.entryPrice) * trade.quantity;
      trade.pnl = rawPnl - trade.fees;
      trade.pnlPercent =
        trade.entryPrice > 0
          ? ((sign * (trade.exitPrice - trade.entryPrice)) / trade.entryPrice) * 100
          : 0;

      console.log("[Trades] Closed:", trade.id, "P&L:", trade.pnl?.toFixed(2));
      return trade;
    }),

  cancel: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const trade = tradeStore.find((t) => t.id === input.id);
      if (!trade) {
        throw new Error("Trade not found");
      }
      trade.status = "cancelled";
      trade.closedAt = new Date().toISOString();
      console.log("[Trades] Cancelled:", trade.id);
      return trade;
    }),

  list: publicProcedure
    .input(
      z.object({
        instrument: z.string().optional(),
        status: z.enum(["open", "closed", "cancelled"]).optional(),
        direction: z.enum(["long", "short"]).optional(),
        broker: z.string().optional(),
        limit: z.number().min(1).max(200).optional(),
        offset: z.number().min(0).optional(),
      }).optional(),
    )
    .query(({ input }) => {
      let filtered = [...tradeStore];
      if (input?.instrument) {
        filtered = filtered.filter((t) => t.instrument === input.instrument);
      }
      if (input?.status) {
        filtered = filtered.filter((t) => t.status === input.status);
      }
      if (input?.direction) {
        filtered = filtered.filter((t) => t.direction === input.direction);
      }
      if (input?.broker) {
        filtered = filtered.filter((t) => t.broker === input.broker);
      }

      const limit = input?.limit ?? 50;
      const offset = input?.offset ?? 0;

      return {
        trades: filtered.slice(offset, offset + limit),
        total: filtered.length,
        hasMore: offset + limit < filtered.length,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const trade = tradeStore.find((t) => t.id === input.id);
      if (!trade) {
        throw new Error("Trade not found");
      }
      return trade;
    }),

  stats: publicProcedure
    .input(
      z.object({
        instrument: z.string().optional(),
        broker: z.string().optional(),
      }).optional(),
    )
    .query(({ input }) => {
      let filtered = [...tradeStore];
      if (input?.instrument) {
        filtered = filtered.filter((t) => t.instrument === input.instrument);
      }
      if (input?.broker) {
        filtered = filtered.filter((t) => t.broker === input.broker);
      }

      const closed = filtered.filter((t) => t.status === "closed");
      const open = filtered.filter((t) => t.status === "open");
      const winners = closed.filter((t) => (t.pnl ?? 0) > 0);
      const losers = closed.filter((t) => (t.pnl ?? 0) < 0);

      const totalPnl = closed.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
      const totalFees = filtered.reduce((sum, t) => sum + t.fees, 0);
      const winRate = closed.length > 0 ? (winners.length / closed.length) * 100 : 0;

      const avgWin = winners.length > 0
        ? winners.reduce((s, t) => s + (t.pnl ?? 0), 0) / winners.length
        : 0;
      const avgLoss = losers.length > 0
        ? Math.abs(losers.reduce((s, t) => s + (t.pnl ?? 0), 0) / losers.length)
        : 0;

      const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;

      const biggestWin = winners.length > 0
        ? Math.max(...winners.map((t) => t.pnl ?? 0))
        : 0;
      const biggestLoss = losers.length > 0
        ? Math.min(...losers.map((t) => t.pnl ?? 0))
        : 0;

      return {
        totalTrades: filtered.length,
        openTrades: open.length,
        closedTrades: closed.length,
        winners: winners.length,
        losers: losers.length,
        totalPnl: Math.round(totalPnl * 100) / 100,
        totalFees: Math.round(totalFees * 100) / 100,
        winRate: Math.round(winRate * 10) / 10,
        avgWin: Math.round(avgWin * 100) / 100,
        avgLoss: Math.round(avgLoss * 100) / 100,
        profitFactor: Math.round(profitFactor * 100) / 100,
        biggestWin: Math.round(biggestWin * 100) / 100,
        biggestLoss: Math.round(biggestLoss * 100) / 100,
      };
    }),

  pnlHistory: publicProcedure
    .input(
      z.object({
        instrument: z.string().optional(),
        days: z.number().min(1).max(365).optional(),
      }).optional(),
    )
    .query(({ input }) => {
      let closed = tradeStore.filter((t) => t.status === "closed" && t.closedAt);
      if (input?.instrument) {
        closed = closed.filter((t) => t.instrument === input.instrument);
      }

      const days = input?.days ?? 30;
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      closed = closed.filter((t) => new Date(t.closedAt!).getTime() > cutoff);

      closed.sort((a, b) => new Date(a.closedAt!).getTime() - new Date(b.closedAt!).getTime());

      let cumPnl = 0;
      const history = closed.map((t) => {
        cumPnl += t.pnl ?? 0;
        return {
          tradeId: t.id,
          instrument: t.instrument,
          pnl: t.pnl ?? 0,
          cumulativePnl: Math.round(cumPnl * 100) / 100,
          closedAt: t.closedAt!,
        };
      });

      return { history, totalPnl: Math.round(cumPnl * 100) / 100 };
    }),
});
