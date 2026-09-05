import { prisma } from "./prisma";

type AuditEvent = 
  | "USER_LOGIN" 
  | "USER_LOGOUT"
  | "USER_REGISTER"
  | "PASSWORD_CHANGE"
  | "ROLE_CHANGE"
  | "JOB_CREATED"
  | "JOB_EDITED"
  | "JOB_DELETED"
  | "CANDIDATE_VIEWED"
  | "RESUME_DOWNLOADED"
  | "INTERVIEW_SCHEDULED"
  | "SUBSCRIPTION_CHANGED"
  | "PAYMENT_FAILED"
  | "ADMIN_ACTION";

interface LogAuditParams {
  userId: string;
  companyId?: string;
  action: AuditEvent;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

export async function logAudit({ userId, companyId, action, ipAddress, metadata }: LogAuditParams) {
  try {
    // We execute this asynchronously so it doesn't block the main thread
    // The AuditLog model will be added in schema.prisma shortly
    await prisma.auditLog.create({
      data: {
        userId,
        companyId,
        action,
        ipAddress: ipAddress || "unknown",
        metadata: metadata ? JSON.stringify(metadata) : null,
      }
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // In production, we'd fall back to Sentry here
  }
}
