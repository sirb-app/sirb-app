import type { Prisma } from "@/generated/prisma";
import type { PointReason } from "./points-config";

/**
 * Prisma transaction type for use in point award operations
 */
export type PrismaTransaction = Omit<
  Prisma.TransactionClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Context for awarding points to a user
 */
export type PointAwardContext = {
  userId: string;
  points: number;
  reason: PointReason;
  subjectId: number; // Required - all points are subject-specific
  metadata?: {
    canvasId?: number;
    quizId?: number;
    commentId?: number;
    contentBlockId?: number;
    contentType?: string;
    attemptId?: number;
    reportId?: number;
    voterId?: string;
    moderatorAction?: boolean;
    [key: string]: unknown;
  };
  tx?: PrismaTransaction;
};

/**
 * Context for revoking points from a user
 */
export type PointRevokeContext = {
  userId: string;
  points: number;
  reason: string; // Usually original reason + "_revoked"
  subjectId: number;
  metadata?: {
    canvasId?: number;
    quizId?: number;
    commentId?: number;
    voterId?: string;
    [key: string]: unknown;
  };
  originalPointsId?: number; // Reference to original UserPoints record
  tx?: PrismaTransaction;
};

/**
 * Context for checking if points were already awarded (idempotency)
 * Uses NET-based checking: sums all points with matching metadata
 */
export type PointsCheckContext = {
  userId: string;
  reason?: PointReason; // Optional - not used in NET-based check
  metadata: Record<string, unknown>;
  tx?: PrismaTransaction;
};
