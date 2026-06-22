import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";

export type AlertCondition =
  | "price_above"
  | "price_below"
  | "ema_cross_long"
  | "ema_cross_short"
  | "composite_above"
  | "composite_below"
  | "golden_cross"
  | "death_cross"
  | "atr_buy"
  | "atr_sell"
  | "rmp_buy"
  | "rmp_sell"
  | "pressure_flip_bull"
  | "pressure_flip_bear"
  | "cloud_flip_bull"
  | "cloud_flip_bear"
  | "price_change_pct";

export type AlertAction = "notify" | "webhook" | "both";
export type AlertStatus = "active" | "triggered" | "paused" | "expired";

export interface ServerAlertRule {
  id: string;
  name: string;
  instrument: string;
  condition: AlertCondition;
  threshold: number | null;
  action: AlertAction;
  webhookUrl: string | null;
  webhookPayload: string | null;
  status: AlertStatus;
  createdAt: string;
  triggeredAt: string | null;
  triggerCount: number;
  maxTriggers: number;
  cooldownMs: number;
  lastTriggeredAt: string | null;
  message: string | null;
}

export interface ServerAlertEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  instrument: string;
  condition: AlertCondition;
  message: string;
  price: number;
  timestamp: string;
  webhookSent: boolean;
  webhookStatus: number | null;
  compositeScore: number | null;
}

const alertRules: ServerAlertRule[] = [];
const alertEvents: ServerAlertEvent[] = [];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

const alertConditionEnum = z.enum([
  "price_above", "price_below", "ema_cross_long", "ema_cross_short",
  "composite_above", "composite_below", "golden_cross", "death_cross",
  "atr_buy", "atr_sell", "rmp_buy", "rmp_sell",
  "pressure_flip_bull", "pressure_flip_bear", "cloud_flip_bull", "cloud_flip_bear",
  "price_change_pct",
]);

export const alertsRouter = createTRPCRouter({
  createRule: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        instrument: z.string(),
        condition: alertConditionEnum,
        threshold: z.number().nullable().optional(),
        action: z.enum(["notify", "webhook", "both"]),
        webhookUrl: z.string().nullable().optional(),
        webhookPayload: z.string().nullable().optional(),
        maxTriggers: z.number().min(0).optional(),
        cooldownMs: z.number().min(0).optional(),
      }),
    )
    .mutation(({ input }) => {
      const rule: ServerAlertRule = {
        id: generateId(),
        name: input.name,
        instrument: input.instrument,
        condition: input.condition,
        threshold: input.threshold ?? null,
        action: input.action,
        webhookUrl: input.webhookUrl ?? null,
        webhookPayload: input.webhookPayload ?? null,
        status: "active",
        createdAt: new Date().toISOString(),
        triggeredAt: null,
        triggerCount: 0,
        maxTriggers: input.maxTriggers ?? 0,
        cooldownMs: input.cooldownMs ?? 60000,
        lastTriggeredAt: null,
        message: null,
      };

      alertRules.unshift(rule);
      console.log("[Alerts] Created rule:", rule.id, rule.name);
      return rule;
    }),

  listRules: publicProcedure
    .input(
      z.object({
        instrument: z.string().optional(),
        status: z.enum(["active", "triggered", "paused", "expired"]).optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      }).optional(),
    )
    .query(({ input }) => {
      let filtered = [...alertRules];
      if (input?.instrument) {
        filtered = filtered.filter((r) => r.instrument === input.instrument);
      }
      if (input?.status) {
        filtered = filtered.filter((r) => r.status === input.status);
      }

      const limit = input?.limit ?? 50;
      const offset = input?.offset ?? 0;

      return {
        rules: filtered.slice(offset, offset + limit),
        total: filtered.length,
      };
    }),

  updateRule: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        status: z.enum(["active", "triggered", "paused", "expired"]).optional(),
        threshold: z.number().nullable().optional(),
        webhookUrl: z.string().nullable().optional(),
        webhookPayload: z.string().nullable().optional(),
        maxTriggers: z.number().min(0).optional(),
        cooldownMs: z.number().min(0).optional(),
      }),
    )
    .mutation(({ input }) => {
      const rule = alertRules.find((r) => r.id === input.id);
      if (!rule) {
        throw new Error("Alert rule not found");
      }
      if (input.name !== undefined) rule.name = input.name;
      if (input.status !== undefined) rule.status = input.status;
      if (input.threshold !== undefined) rule.threshold = input.threshold;
      if (input.webhookUrl !== undefined) rule.webhookUrl = input.webhookUrl;
      if (input.webhookPayload !== undefined) rule.webhookPayload = input.webhookPayload;
      if (input.maxTriggers !== undefined) rule.maxTriggers = input.maxTriggers;
      if (input.cooldownMs !== undefined) rule.cooldownMs = input.cooldownMs;

      console.log("[Alerts] Updated rule:", rule.id);
      return rule;
    }),

  deleteRule: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const idx = alertRules.findIndex((r) => r.id === input.id);
      if (idx === -1) {
        throw new Error("Alert rule not found");
      }
      const [removed] = alertRules.splice(idx, 1);
      console.log("[Alerts] Deleted rule:", removed.id);
      return { success: true, id: removed.id };
    }),

  triggerAlert: publicProcedure
    .input(
      z.object({
        ruleId: z.string(),
        price: z.number(),
        message: z.string(),
        compositeScore: z.number().nullable().optional(),
        webhookSent: z.boolean().optional(),
        webhookStatus: z.number().nullable().optional(),
      }),
    )
    .mutation(({ input }) => {
      const rule = alertRules.find((r) => r.id === input.ruleId);
      if (!rule) {
        throw new Error("Alert rule not found");
      }

      const event: ServerAlertEvent = {
        id: generateId(),
        ruleId: rule.id,
        ruleName: rule.name,
        instrument: rule.instrument,
        condition: rule.condition,
        message: input.message,
        price: input.price,
        timestamp: new Date().toISOString(),
        webhookSent: input.webhookSent ?? false,
        webhookStatus: input.webhookStatus ?? null,
        compositeScore: input.compositeScore ?? null,
      };

      rule.triggerCount++;
      rule.lastTriggeredAt = event.timestamp;
      rule.triggeredAt = event.timestamp;

      if (rule.maxTriggers > 0 && rule.triggerCount >= rule.maxTriggers) {
        rule.status = "expired";
      }

      alertEvents.unshift(event);

      if (alertEvents.length > 1000) {
        alertEvents.splice(1000);
      }

      console.log("[Alerts] Triggered:", event.id, "for rule:", rule.name);
      return event;
    }),

  listEvents: publicProcedure
    .input(
      z.object({
        ruleId: z.string().optional(),
        instrument: z.string().optional(),
        limit: z.number().min(1).max(200).optional(),
        offset: z.number().min(0).optional(),
      }).optional(),
    )
    .query(({ input }) => {
      let filtered = [...alertEvents];
      if (input?.ruleId) {
        filtered = filtered.filter((e) => e.ruleId === input.ruleId);
      }
      if (input?.instrument) {
        filtered = filtered.filter((e) => e.instrument === input.instrument);
      }

      const limit = input?.limit ?? 50;
      const offset = input?.offset ?? 0;

      return {
        events: filtered.slice(offset, offset + limit),
        total: filtered.length,
      };
    }),

  stats: publicProcedure.query(() => {
    const totalRules = alertRules.length;
    const activeRules = alertRules.filter((r) => r.status === "active").length;
    const totalEvents = alertEvents.length;
    const recentEvents = alertEvents.filter(
      (e) => Date.now() - new Date(e.timestamp).getTime() < 24 * 60 * 60 * 1000,
    ).length;
    const webhooksSent = alertEvents.filter((e) => e.webhookSent).length;

    return {
      totalRules,
      activeRules,
      totalEvents,
      recentEvents,
      webhooksSent,
    };
  }),
});
