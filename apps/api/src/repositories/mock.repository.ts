import { db, MockServerStatus } from '@mockline/db'
import type { Tier } from '@mockline/types'

// mock server repo for database operations

export async function listMocks(userId: string) {
    return db.mockServer.findMany({
        where: { userId, deletedAt: null },
        include: { spec: { select: { name: true } } },
        orderBy: { updatedAt: 'desc' },
    })
}

export async function findMock(mockId: string, userId: string) {
    return db.mockServer.findFirst({
        where: { id: mockId, userId, deletedAt: null },
        include: {
            spec: { select: { name: true } },
            specVersion: { select: { version: true } },
        },
    })
}

export async function findMockByStatus(
    mockId: string,
    userId: string,
    status: MockServerStatus,
) {
    return db.mockServer.findFirst({
        where: { id: mockId, userId, status, deletedAt: null },
    })
}

export async function findMockBasic(mockId: string, userId: string) {
    return db.mockServer.findFirst({
        where: { id: mockId, userId, deletedAt: null },
    })
}

export async function updateMockStatus(
    mockId: string,
    status: MockServerStatus,
    extra?: { 
        lastAccessedAt?: Date
        deletedAt?: Date
        publicUrl?: string | null
        dockerContainerId?: string | null 
    },
) {
    return db.mockServer.update({
        where: { id: mockId },
        data: { status, ...extra },
    })
}

export async function findStaleRunningMocks(tier: Tier, cutoff: Date) {
    return db.mockServer.findMany({
        where: {
            status: 'RUNNING',
            tier,
            lastAccessedAt: { lt: cutoff },
            deletedAt: null,
        },
    })
}

export async function findStaleFreeMocks(cutoff: Date) {
    return db.mockServer.findMany({
        where: {
            tier: 'FREE',
            createdAt: { lt: cutoff },
            deletedAt: null,
        },
    })
}

export async function touchLastAccessed(mockId: string) {
    return db.mockServer.update({
        where: { id: mockId },
        data: { lastAccessedAt: new Date() },
    })
}

export async function findMocksBySpec(specId: string) {
    return db.mockServer.findMany({
        where: { specId, deletedAt: null },
    })
}

// Partner Sandboxes: find mocks whose deliberate expiresAt has elapsed
export async function findExpiredSandboxes() {
    return db.mockServer.findMany({
        where: {
            expiresAt: { lte: new Date() },
            deletedAt: null,
            status: { in: ['RUNNING', 'STOPPED'] },
        },
    })
}
