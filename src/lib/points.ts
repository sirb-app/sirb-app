/**
 * Contributor Points System - Core Service
 *
 * Centralized service for awarding, revoking, and managing contributor points.
 * All points are subject-specific to enable subject leaderboards.
 */

import { prisma } from "@/lib/prisma";
import type {
  PointAwardContext,
  PointRevokeContext,
  PointsCheckContext,
} from "./points.types";

/**
 * Award points to a user with transaction support and idempotency
 *
 * @param context - Point award context including userId, points, reason, subjectId, metadata
 * @returns Promise<void>
 *
 * @example
 * await awardPoints({
 *   userId: 'user123',
 *   points: 100,
 *   reason: POINT_REASONS.CANVAS_APPROVED,
 *   subjectId: 5,
 *   metadata: { canvasId: 42 },
 *   tx, // Optional transaction
 * });
 */
export async function awardPoints(context: PointAwardContext): Promise<void> {
  const { userId, points, reason, subjectId, metadata = {}, tx } = context;

  const db = tx || prisma;

  // Idempotency check - prevent duplicate awards
  const alreadyAwarded = await checkPointsAwarded({
    userId,
    reason,
    metadata,
    tx: db,
  });

  if (alreadyAwarded) {
    console.log(
      `Points already awarded: ${reason} for user ${userId}`,
      metadata
    );
    return;
  }

  // Create UserPoints record
  await db.userPoints.create({
    data: {
      userId,
      points,
      reason,
      subjectId,
      metadata: metadata as never, // Cast for Prisma Json type
      earnedAt: new Date(),
    },
  });

  // Update denormalized totalPoints on User
  await db.user.update({
    where: { id: userId },
    data: {
      totalPoints: {
        increment: points,
      },
    },
  });

  console.log(
    `Awarded ${points} points to user ${userId} for ${reason} in subject ${subjectId}`
  );
}

/**
 * Revoke points from a user (used for vote changes, etc.)
 *
 * @param context - Point revoke context
 * @returns Promise<void>
 *
 * @example
 * await revokePoints({
 *   userId: 'user123',
 *   points: 5,
 *   reason: POINT_REASONS.CANVAS_UPVOTE_REVOKED,
 *   subjectId: 5,
 *   metadata: { canvasId: 42, voterId: 'voter456' },
 *   tx,
 * });
 */
export async function revokePoints(context: PointRevokeContext): Promise<void> {
  const { userId, points, reason, subjectId, metadata = {}, tx } = context;

  const db = tx || prisma;

  // Create negative UserPoints record
  await db.userPoints.create({
    data: {
      userId,
      points: -points, // Negative points for revocation
      reason,
      subjectId,
      metadata: metadata as never,
      earnedAt: new Date(),
    },
  });

  // Update denormalized totalPoints on User
  await db.user.update({
    where: { id: userId },
    data: {
      totalPoints: {
        decrement: points,
      },
    },
  });

  console.log(
    `Revoked ${points} points from user ${userId} for ${reason} in subject ${subjectId}`
  );
}

/**
 * Check if points have already been awarded (idempotency check)
 *
 * @param context - Check context with userId, reason, and metadata
 * @returns Promise<boolean> - True if points already awarded
 *
 * @example
 * const alreadyAwarded = await checkPointsAwarded({
 *   userId: 'user123',
 *   reason: POINT_REASONS.CANVAS_APPROVED,
 *   metadata: { canvasId: 42 },
 * });
 */
export async function checkPointsAwarded(
  context: PointsCheckContext
): Promise<boolean> {
  const { userId, metadata, tx } = context;

  const db = tx || prisma;

  // Check NET sum of all points with matching metadata (awards + revocations)
  // This correctly handles vote cycles:
  //   - vote (+5) → net = +5, check returns true (blocked)
  //   - unvote (-5) → net = 0, next vote check returns false (allowed)
  //   - vote (+5) → net = +5, check returns true (blocked)
  // Result: Only one active award at a time, matching current vote state
  const result = await db.userPoints.aggregate({
    where: {
      userId,
      metadata: {
        equals: metadata as never,
      },
    },
    _sum: { points: true },
  });

  return (result._sum.points || 0) > 0;
}

/**
 * Get user's total points (reads from denormalized field)
 *
 * @param userId - User ID
 * @returns Promise<number> - Total points
 */
export async function getUserTotalPoints(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalPoints: true },
  });

  return user?.totalPoints || 0;
}

/**
 * Get user's points breakdown by reason
 *
 * @param userId - User ID
 * @param subjectId - Optional subject filter
 * @returns Promise<Array<{ reason: string; totalPoints: number; count: number }>>
 */
export async function getUserPointsBreakdown(
  userId: string,
  subjectId?: number
) {
  const where = subjectId ? { userId, subjectId } : { userId };

  const breakdown = await prisma.userPoints.groupBy({
    by: ["reason"],
    where,
    _sum: { points: true },
    _count: { id: true },
  });

  return breakdown.map(
    (item: {
      reason: string | null;
      _sum: { points: number | null };
      _count: { id: number };
    }) => ({
      reason: item.reason || "unknown",
      totalPoints: item._sum.points || 0,
      count: item._count.id,
    })
  );
}

/**
 * Reconcile user's totalPoints with actual sum (for periodic validation)
 *
 * @param userId - User ID
 * @returns Promise<{ before: number; after: number; corrected: boolean }>
 */
export async function reconcileUserPoints(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalPoints: true },
  });

  const actualSum = await prisma.userPoints.aggregate({
    where: { userId },
    _sum: { points: true },
  });

  const actualTotal = actualSum._sum.points || 0;
  const currentTotal = user?.totalPoints || 0;

  if (actualTotal !== currentTotal) {
    await prisma.user.update({
      where: { id: userId },
      data: { totalPoints: actualTotal },
    });

    console.log(
      `Reconciled points for user ${userId}: ${currentTotal} -> ${actualTotal}`
    );

    return {
      before: currentTotal,
      after: actualTotal,
      corrected: true,
    };
  }

  return {
    before: currentTotal,
    after: currentTotal,
    corrected: false,
  };
}
