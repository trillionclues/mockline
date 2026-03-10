import { LoginContent } from '@/components/login/LoginContent'
import { Suspense } from 'react'

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div style={{
                fontFamily: 'Inter, -apple-system, sans-serif',
                fontSize: '14px',
                color: '#959598ff',
                textAlign: 'center',
                padding: '40px',
            }}>
                Loading...
            </div>
        }>
            <LoginContent />
        </Suspense>
    )
}
