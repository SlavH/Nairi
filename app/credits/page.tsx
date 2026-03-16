'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Zap, Gift, Trophy, Star, Clock, TrendingUp, ChevronRight, Sparkles } from 'lucide-react'

interface CreditTransaction {
  id: string
  type: 'earned' | 'spent' | 'bonus' | 'purchased'
  amount: number
  description: string
  timestamp: string
}

interface Reward {
  id: string
  name: string
  description: string
  cost: number
  icon: string
  available: boolean
}

export default function CreditsPage() {
  const [credits] = useState({
    balance: 100,
    earned: 250,
    spent: 150,
    bonus: 50
  })

  const [transactions] = useState<CreditTransaction[]>([
    { id: '1', type: 'bonus', amount: 10, description: 'Daily login bonus', timestamp: 'Today' },
    { id: '2', type: 'spent', amount: -5, description: 'Image generation', timestamp: '2 hours ago' },
    { id: '3', type: 'earned', amount: 15, description: 'Completed learning module', timestamp: 'Yesterday' },
    { id: '4', type: 'spent', amount: -10, description: 'Video generation (4s)', timestamp: 'Yesterday' },
    { id: '5', type: 'bonus', amount: 25, description: 'Weekly streak bonus', timestamp: '3 days ago' },
    { id: '6', type: 'earned', amount: 20, description: 'Shared creation on Flow', timestamp: '4 days ago' },
    { id: '7', type: 'purchased', amount: 100, description: 'Credit pack purchase', timestamp: '1 week ago' }
  ])

  const [rewards] = useState<Reward[]>([
    { id: '1', name: 'Extra Image Generation', description: '10 bonus image generations', cost: 50, icon: '🎨', available: true },
    { id: '2', name: 'Video Credits', description: '5 video generation credits', cost: 100, icon: '🎬', available: true },
    { id: '3', name: 'Premium Model Access', description: '24-hour access to premium models', cost: 200, icon: '⚡', available: false },
    { id: '4', name: 'Custom Agent', description: 'Create a custom AI agent', cost: 500, icon: '🤖', available: false },
    { id: '5', name: 'Pro Trial', description: '7-day Pro plan trial', cost: 1000, icon: '👑', available: false }
  ])

  const getTransactionColor = (type: CreditTransaction['type']) => {
    switch (type) {
      case 'earned': return 'text-green-400'
      case 'spent': return 'text-red-400'
      case 'bonus': return 'text-yellow-400'
      case 'purchased': return 'text-cyan-400'
    }
  }

  const getTransactionIcon = (type: CreditTransaction['type']) => {
    switch (type) {
      case 'earned': return <TrendingUp className="w-4 h-4" />
      case 'spent': return <Zap className="w-4 h-4" />
      case 'bonus': return <Gift className="w-4 h-4" />
      case 'purchased': return <Star className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
              ← Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-yellow-400" />
              <h1 className="text-2xl font-bold">Credits & Rewards</h1>
            </div>
          </div>
          <Link
            href="/billing"
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Buy Credits
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Credit Balance */}
        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl p-6 border border-yellow-500/30 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white/60 text-sm mb-1">Current Balance</div>
              <div className="flex items-center gap-3">
                <Zap className="w-10 h-10 text-yellow-400" />
                <span className="text-5xl font-bold">{credits.balance}</span>
                <span className="text-xl text-white/60">credits</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">+{credits.earned}</div>
                <div className="text-xs text-white/60">Earned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">-{credits.spent}</div>
                <div className="text-xs text-white/60">Spent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">+{credits.bonus}</div>
                <div className="text-xs text-white/60">Bonus</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Transaction History */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Transaction History
              </h2>
              <button className="text-sm text-cyan-400 hover:text-cyan-300">View All</button>
            </div>
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <div className={`w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center ${getTransactionColor(tx.type)}`}>
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{tx.description}</div>
                    <div className="text-xs text-white/40">{tx.timestamp}</div>
                  </div>
                  <div className={`font-bold ${getTransactionColor(tx.type)}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rewards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Redeem Rewards
              </h2>
            </div>
            <div className="space-y-3">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className={`flex items-center gap-4 bg-white/5 rounded-xl p-4 border transition-all ${
                    reward.available && credits.balance >= reward.cost
                      ? 'border-cyan-500/50 hover:border-cyan-500 cursor-pointer'
                      : 'border-white/10 opacity-60'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-2xl">
                    {reward.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{reward.name}</div>
                    <div className="text-xs text-white/60">{reward.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="font-bold">{reward.cost}</span>
                    <ChevronRight className="w-4 h-4 text-white/40" />
                  </div>
                </div>
              ))}
            </div>

            {/* Ways to Earn */}
            <div className="mt-8">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Ways to Earn Credits
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="text-sm font-medium">Daily Login</div>
                  <div className="text-xs text-white/60">+10 credits/day</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="text-sm font-medium">Complete Courses</div>
                  <div className="text-xs text-white/60">+15-50 credits</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="text-sm font-medium">Share on Flow</div>
                  <div className="text-xs text-white/60">+20 credits</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="text-sm font-medium">Weekly Streak</div>
                  <div className="text-xs text-white/60">+25 bonus</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
