import { db, MockServerStatus } from '@mockline/db'

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
    extra?: { lastAccessedAt?: Date; deletedAt?: Date },
) {
    return db.mockServer.update({
        where: { id: mockId },
        data: { status, ...extra },
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
