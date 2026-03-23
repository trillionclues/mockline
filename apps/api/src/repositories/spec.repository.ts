import { db } from '@mockline/db'

// spec repo for database operations

export async function listSpecs(userId: string) {
    return db.spec.findMany({
        where: { userId, deletedAt: null },
        include: {
            versions: { orderBy: { version: 'desc' }, take: 1 },
            _count: { select: { mockServers: { where: { deletedAt: null } } } },
        },
        orderBy: { updatedAt: 'desc' },
    })
}

export async function findSpec(specId: string, userId: string) {
    return db.spec.findFirst({
        where: { id: specId, userId, deletedAt: null },
        include: { versions: { orderBy: { version: 'desc' } } },
    })
}

export async function findSpecBasic(specId: string, userId: string) {
    return db.spec.findFirst({
        where: { id: specId, userId, deletedAt: null },
    })
}

export async function countSpecs(userId: string) {
    return db.spec.count({
        where: { userId, deletedAt: null },
    })
}

export async function softDeleteSpec(specId: string) {
    return db.spec.update({
        where: { id: specId },
        data: { deletedAt: new Date() },
    })
}

export async function listVersions(specId: string) {
    return db.specVersion.findMany({
        where: { specId },
        orderBy: { version: 'desc' },
        select: { id: true, version: true, format: true, hash: true, createdAt: true },
    })
}

export async function findVersion(specId: string, version: number) {
    return db.specVersion.findFirst({
        where: { specId, version },
    })
}

export async function findSpecWithLatestVersion(specId: string, userId: string) {
    return db.spec.findFirst({
        where: { id: specId, userId, deletedAt: null },
        include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    })
}
