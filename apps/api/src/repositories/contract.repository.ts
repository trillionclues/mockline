import { db, Prisma } from '@mockline/db'

// contract test run repo for database operations

export async function createTestRun(data: {
    specId: string
    userId: string
    baseUrl: string
}) {
    return db.contractTestRun.create({
        data: {
            specId: data.specId,
            userId: data.userId,
            baseUrl: data.baseUrl,
            results: [],
            summary: { total: 0, passed: 0, failed: 0 },
            status: 'running',
        },
    })
}

export async function updateTestRun(
    testRunId: string,
    data: {
        results?: Prisma.InputJsonValue
        summary?: Record<string, number>
        status: string
    },
) {
    return db.contractTestRun.update({
        where: { id: testRunId },
        data: {
            ...(data.results !== undefined && { results: data.results }),
            ...(data.summary !== undefined && { summary: data.summary }),
            status: data.status,
        },
    })
}

export async function findTestRun(testRunId: string, userId: string) {
    return db.contractTestRun.findFirst({
        where: { id: testRunId, userId },
    })
}

export async function listTestRuns(userId: string, specId?: string) {
    return db.contractTestRun.findMany({
        where: {
            userId,
            ...(specId ? { specId } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
    })
}
