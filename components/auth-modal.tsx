"use client"

import type React from "react"
import Image from "next/image"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, Lock, User, Github, Chrome } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: "signin" | "signup"
}

export function AuthModal({ isOpen, onClose, defaultTab = "signin" }: AuthModalProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")

  const handleSubmit = async (e: React.FormEvent, type: "signin" | "signup") => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsLoading(false)
    onClose()

    // Show success (in real app, would redirect or update state)
    alert(type === "signin" ? t.auth.signInSuccess : t.auth.signUpSuccess)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Image
              src="/images/nairi-logo-header.jpg"
              alt="Nairi"
              width={40}
              height={40}
              className="rounded-full"
            />
            <DialogTitle className="text-xl gradient-text">{t.auth.welcomeTitle}</DialogTitle>
          </div>
          <DialogDescription>{t.auth.welcomeDescription}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-muted">
            <TabsTrigger value="signin">{t.auth.signInTab}</TabsTrigger>
            <TabsTrigger value="signup">{t.auth.signUpTab}</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={(e) => handleSubmit(e, "signin")} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">{t.auth.email}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder={t.auth.signInPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-muted border-border"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">{t.auth.password}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder={t.auth.signInPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-muted border-border"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-background hover:opacity-90"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {t.auth.signInButton}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={(e) => handleSubmit(e, "signup")} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">{t.auth.fullName}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder={t.auth.fullNamePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 bg-muted border-border"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">{t.auth.email}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder={t.auth.signUpPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-muted border-border"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">{t.auth.password}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder={t.auth.createPasswordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-muted border-border"
                    required
                    minLength={8}
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-background hover:opacity-90"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {t.auth.createAccountButton}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">{t.auth.orContinueWith}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="bg-transparent border-border hover:bg-muted">
            <Github className="w-4 h-4 mr-2" />
            {t.auth.github}
          </Button>
          <Button variant="outline" className="bg-transparent border-border hover:bg-muted">
            <Chrome className="w-4 h-4 mr-2" />
            {t.auth.google}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
