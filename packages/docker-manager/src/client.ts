import Dockerode from 'dockerode'

// Singleton Docker client.
// Connects locally via unix socket, or TCP in prod.
export const docker = new Dockerode({
    socketPath: process.env.DOCKER_HOST?.startsWith('unix://')
        ? process.env.DOCKER_HOST.replace('unix://', '')
        : '/var/run/docker.sock',
})
