'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'
import { LogIn } from 'lucide-react'

export function LoginButton({ className }: { className?: string }) {
    const [loading, setLoading] = useState(false)

    const handleLogin = async () => {
        setLoading(true)
        const supabase = createClient()
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'discord',
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            },
        })
        if (error) {
            console.error('Login Error:', error);
            alert('Login failed: ' + error.message);
            setLoading(false);
        }
    }

    return (
        <button
            onClick={handleLogin}
            disabled={loading}
            className={`flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded font-bold transition-all ${className}`}
        >
            <LogIn size={20} />
            {loading ? 'Connecting...' : 'Login with Discord'}
        </button>
    )
}
