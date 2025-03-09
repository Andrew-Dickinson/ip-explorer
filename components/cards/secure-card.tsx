"use client"

import {useEffect, useState} from "react"
import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {Loader2, Lock} from "lucide-react"
import {cn} from "@/lib/utils";
import {runParallelAction} from "next-server-actions-parallel";
import {checkPassword} from "@/lib/actions/check-password";
import {useLocalStorage} from "@/lib/hooks/use-local-storage";
import {PSK_STORAGE_KEY} from "@/lib/constants";

export interface SecureCardProps extends React.ComponentProps<"div"> {
  title?: string
  description?: string
  password?: string
  children?: React.ReactNode
}
// Custom non-animating skeleton component
function StaticSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-md bg-muted", className)} {...props} />
}

export function SecureCard({
                             title = "Secure card",
                             description = "This content is password protected",
                             children,
                             className,
                             ...props
                           }: SecureCardProps) {
  const [secureContentPSK, setSecureContentPSK] = useLocalStorage<string>(PSK_STORAGE_KEY);

  const [pendingAuthResponse, setPendingAuthResponse] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [invalidPassword, setInvalidPassword] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [inputPassword, setInputPassword] = useState("")

  useEffect(() => {
    setInputPassword("");
    setPendingAuthResponse(false);
    setInvalidPassword(false);
    setAuthError(false);
  }, [isDialogOpen])

  useEffect(() => {
    setAuthError(false);
    setInvalidPassword(false);
  }, [inputPassword]);

  const handleUnlockAttempt = async () => {
    if (pendingAuthResponse) { return; }

    setPendingAuthResponse(true);
    setAuthError(false);
    setInvalidPassword(false);
    try {
      const pwCorrect = await runParallelAction(checkPassword(inputPassword));
      if (pwCorrect) {
        setSecureContentPSK(inputPassword);
        setIsDialogOpen(false);
      } else {
        setInvalidPassword(true);
      }
    } catch {
      setAuthError(true);
    } finally {
      setPendingAuthResponse(false);
    }
  }

  return (
    <Card className={`${className} relative`} {...props}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {secureContentPSK === undefined ? (
          <>
            <div className="flex items-center gap-3">
              <StaticSkeleton className="h-10 w-10 rounded-full" />
              <div className="items-center gap-2">
                <div className="space-y-2">
                  <StaticSkeleton className="h-4 w-[170px]" />
                  <div className="flex gap-3">
                    <div className="space-y-2">
                      <StaticSkeleton className="h-4 w-[100px]" />
                      <StaticSkeleton className="h-4 w-[100px]" />
                    </div>
                    <div className="space-y-2">
                      <StaticSkeleton className="h-4 w-[100px]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="flex items-center gap-2 mt-5">
                <Lock className="h-4 w-4" />
                Enter Password to View
              </Button>
            </div>
          </>
        ) : children}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enter Password</DialogTitle>
            <DialogDescription>
              Enter the pre-shared password to unlock the secure content (you probably already know it)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUnlockAttempt()
                  }
                }}
                autoFocus
              />
              {authError && <span className="text-sm -mt-2 text-red-600">Unknown error encountered while checking password, try again later</span>}
              {invalidPassword && <span className="text-sm -mt-2 text-red-600">Incorrect password</span>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={pendingAuthResponse || inputPassword.length === 0}
              onClick={handleUnlockAttempt}
            >
              {pendingAuthResponse && <Loader2 className="animate-spin mr-1 h-4 w-4"/>}
              Unlock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

