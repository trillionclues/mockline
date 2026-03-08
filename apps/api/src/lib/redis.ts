import Redis from 'ioredis'

export const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
})

redis.on('error', (err: Error) => {
    console.error('Redis connection error:', err.message)
})

redis.on('connect', () => {
    console.log('Redis connected')
})
