import { db } from '@mockline/db'

// user repo for database operations

export async function findUserById(userId: string) {
    return db.user.findUnique({
        where: { id: userId },
    })
}

export async function deleteUser(userId: string) {
    return db.user.delete({
        where: { id: userId },
    })
}
