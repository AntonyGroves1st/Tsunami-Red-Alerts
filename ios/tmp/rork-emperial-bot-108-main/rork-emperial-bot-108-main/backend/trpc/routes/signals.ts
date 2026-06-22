import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";

export type SignalDirection = "long" | "short" | "neutral";
export type SignalStrength = "strong" | "moderate" | "weak";
export type SignalStatus = "active" | "closed" | "expired";

export interface TradingSignal {
  id: string;
  instrument: string;
  direction: SignalDirection;
  strength: SignalStrength;
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  trailingStop: number;
  condition: string;
  compositeScore: number;
  confidence: number;
  timeframe: string;
  createdAt: string;
  expiresAt: string;
  status: SignalStatus;
  notes: string;
}

const signalStore: TradingSignal[] = [];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function computeSignalDirection(compositeScore: number): SignalDirection {
  if (compositeScore >= 2) return "long";
  if (compositeScore <= -2) return "short";
  return "neutral";
}

function computeSignalStrength(compositeScore: number): SignalStrength {
  const abs = Math.abs(compositeScore);
  if (abs >= 4) return "strong";
  if (abs >= 2) return "moderate";
  return "weak";
}

function computeConfidence(compositeScore: number): number {
  const abs = Math.abs(compositeScore);
  return Math.min(100, Math.round((abs / 8) * 100));
}

export const signalsRouter = createTRPCRouter({
  generate: publicProcedure
    .input(
      z.object({
        instrument: z.string(),
        price: z.number(),
        compositeScore: z.number(),
        atr: z.number(),
        timeframe: z.string(),
        condition: z.string().optional(),
        tp1Mult: z.number().optional(),
        tp2Mult: z.number().optional(),
        tp3Mult: z.number().optional(),
        slMult: z.number().optional(),
        trailingStopMult: z.number().optional(),
      }),
    )
    .mutation(({ input }) => {
      const direction = computeSignalDirection(input.compositeScore);
      const strength = computeSignalStrength(input.compositeScore);
      const confidence = computeConfidence(input.compositeScore);

      const tp1Mult = input.tp1Mult ?? 2.0;
      const tp2Mult = input.tp2Mult ?? 3.0;
      const tp3Mult = input.tp3Mult ?? 4.0;
      const slMult = input.slMult ?? 1.5;
      const trailingMult = input.trailingStopMult ?? 1.0;

      const sign = direction === "long" ? 1 : -1;
      const entryPrice = input.price;
      const stopLoss = entryPrice - sign * input.atr * slMult;
      const takeProfit1 = entryPrice + sign * input.atr * tp1Mult;
      const takeProfit2 = entryPrice + sign * input.atr * tp2Mult;
      const takeProfit3 = entryPrice + sign * input.atr * tp3Mult;
      const trailingStop = input.atr * trailingMult;

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const signal: TradingSignal = {
        id: generateId(),
        instrument: input.instrument,
        direction,
        strength,
        entryPrice,
        stopLoss,
        takeProfit1,
        takeProfit2,
        takeProfit3,
        trailingStop,
        condition: input.condition ?? `Composite ${input.compositeScore.toFixed(1)}`,
        compositeScore: input.compositeScore,
        confidence,
        timeframe: input.timeframe,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: "active",
        notes: `Auto-generated signal for ${input.instrument} on ${input.timeframe}`,
      };

      signalStore.unshift(signal);

      if (signalStore.length > 500) {
        signalStore.splice(500);
      }

      console.log("[Signals] Generated signal:", signal.id, signal.instrument, signal.direction, signal.strength);
      return signal;
    }),

  list: publicProcedure
    .input(
      z.object({
        instrument: z.string().optional(),
        status: z.enum(["active", "closed", "expired"]).optional(),
        direction: z.enum(["long", "short", "neutral"]).optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      }).optional(),
    )
    .query(({ input }) => {
      let filtered = [...signalStore];

      const now = new Date();
      filtered.forEach((s) => {
        if (s.status === "active" && new Date(s.expiresAt) < now) {
          s.status = "expired";
        }
      });

      if (input?.instrument) {
        filtered = filtered.filter((s) => s.instrument === input.instrument);
      }
      if (input?.status) {
        filtered = filtered.filter((s) => s.status === input.status);
      }
      if (input?.direction) {
        filtered = filtered.filter((s) => s.direction === input.direction);
      }

      const limit = input?.limit ?? 50;
      const offset = input?.offset ?? 0;

      return {
        signals: filtered.slice(offset, offset + limit),
        total: filtered.length,
        hasMore: offset + limit < filtered.length,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const signal = signalStore.find((s) => s.id === input.id);
      if (!signal) {
        throw new Error("Signal not found");
      }
      return signal;
    }),

  close: publicProcedure
    .input(
      z.object({
        id: z.string(),
        exitPrice: z.number(),
      }),
    )
    .mutation(({ input }) => {
      const signal = signalStore.find((s) => s.id === input.id);
      if (!signal) {
        throw new Error("Signal not found");
      }
      signal.status = "closed";
      console.log("[Signals] Closed signal:", signal.id);
      return signal;
    }),

  stats: publicProcedure
    .input(z.object({ instrument: z.string().optional() }).optional())
    .query(({ input }) => {
      let filtered = [...signalStore];
      if (input?.instrument) {
        filtered = filtered.filter((s) => s.instrument === input.instrument);
      }

      const total = filtered.length;
      const active = filtered.filter((s) => s.status === "active").length;
      const closed = filtered.filter((s) => s.status === "closed").length;
      const expired = filtered.filter((s) => s.status === "expired").length;
      const longCount = filtered.filter((s) => s.direction === "long").length;
      const shortCount = filtered.filter((s) => s.direction === "short").length;
      const strongCount = filtered.filter((s) => s.strength === "strong").length;
      const avgConfidence = total > 0
        ? Math.round(filtered.reduce((sum, s) => sum + s.confidence, 0) / total)
        : 0;

      return {
        total,
        active,
        closed,
        expired,
        longCount,
        shortCount,
        strongCount,
        avgConfidence,
      };
    }),
});
