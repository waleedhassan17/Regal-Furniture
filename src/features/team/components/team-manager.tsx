"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Copy, KeyRound, RefreshCw, ShieldCheck, UserPlus, UserRoundCheck, UserRoundX } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Field, FormAlert, describedBy } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Pill } from "@/components/data/status-badge"
import { Initials } from "@/components/shell/sidebar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatDate } from "@/lib/format/date"
import { changeRoleAction, createMemberAction, resetMemberPasswordAction, setActiveAction } from "@/features/team/actions"
import { newMemberSchema, type NewMemberFormValues, type NewMemberValues } from "@/features/team/schema"
import type { TeamMember } from "@/features/team/queries"

/** Readable temporary password (no look-alike characters). */
function generatePassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  const raw = [...bytes].map((b) => alphabet[b % alphabet.length]).join("")
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`
}

export function TeamManager({ members, currentUserId }: { members: TeamMember[]; currentUserId: string }) {
  const [adding, setAdding] = useState(false)
  const [credentials, setCredentials] = useState<{ name: string; email: string; password: string } | null>(null)
  const [resetting, setResetting] = useState<TeamMember | null>(null)
  const [toggling, setToggling] = useState<TeamMember | null>(null)
  const [pending, startTransition] = useTransition()
  const activeAdmins = members.filter((m) => m.role === "admin" && m.is_active).length

  function changeRole(member: TeamMember, role: "admin" | "staff") {
    startTransition(async () => {
      const result = await changeRoleAction({ userId: member.id, role })
      if (!result.ok) toast.error(result.error)
      else toast.success(result.message ?? "Role updated")
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone">
          {members.filter((m) => m.is_active).length} active · {activeAdmins} {activeAdmins === 1 ? "admin" : "admins"}
        </p>
        <Button onClick={() => setAdding(true)}>
          <UserPlus aria-hidden="true" /> Add team member
        </Button>
      </div>

      <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line bg-card shadow-(--shadow-card)">
        {members.map((m) => {
          const isMe = m.id === currentUserId
          const lastAdmin = m.role === "admin" && m.is_active && activeAdmins === 1
          return (
            <li key={m.id} className={cn("flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:px-5", !m.is_active && "bg-subtle/40")}>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Initials name={m.full_name} className={cn(!m.is_active && "bg-stone/40")} />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-bold text-ink">
                    <span className="truncate">{m.full_name}</span>
                    {isMe && <span className="text-caption font-semibold text-stone">(you)</span>}
                    {!m.is_active && (
                      <Pill tone="cancel" size="sm">
                        Deactivated
                      </Pill>
                    )}
                  </p>
                  <p className="truncate text-caption text-stone">
                    {[m.email, m.phone].filter(Boolean).join(" · ")}
                    {" · "}
                    {m.lastSignInAt ? `Last signed in ${formatDate(m.lastSignInAt)}` : "Never signed in"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor={`role-${m.id}`}>
                  Role for {m.full_name}
                </label>
                <NativeSelect
                  id={`role-${m.id}`}
                  size="sm"
                  value={m.role}
                  disabled={pending || !m.is_active || isMe || lastAdmin}
                  onChange={(e) => changeRole(m, e.target.value as "admin" | "staff")}
                  className="w-32"
                  title={lastAdmin ? "There must always be at least one admin." : undefined}
                >
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </NativeSelect>
                <Button variant="outline" size="sm" onClick={() => setResetting(m)} disabled={!m.is_active}>
                  <KeyRound aria-hidden="true" /> Password
                </Button>
                {m.is_active ? (
                  <Button variant="destructive" size="sm" onClick={() => setToggling(m)} disabled={isMe || lastAdmin}>
                    <UserRoundX aria-hidden="true" /> Deactivate
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setToggling(m)}>
                    <UserRoundCheck aria-hidden="true" /> Reactivate
                  </Button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <p className="flex items-start gap-2 text-caption text-stone">
        <ShieldCheck aria-hidden="true" className="mt-px size-3.5 shrink-0" />
        Admins see amounts and payments and manage the team. Staff can view orders, change statuses and add notes — they never see money.
      </p>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add team member</DialogTitle>
            <DialogDescription>They sign in with this email and the temporary password. Ask them to change it from &ldquo;Forgot password&rdquo;.</DialogDescription>
          </DialogHeader>
          <NewMemberForm
            onCancel={() => setAdding(false)}
            onCreated={(values) => {
              setAdding(false)
              setCredentials({ name: values.full_name, email: values.email, password: values.password })
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={credentials !== null} onOpenChange={(open) => !open && setCredentials(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Account ready</DialogTitle>
            <DialogDescription>Share these sign-in details with {credentials?.name}. The password won&apos;t be shown again.</DialogDescription>
          </DialogHeader>
          {credentials && <CredentialCard email={credentials.email} password={credentials.password} />}
        </DialogContent>
      </Dialog>

      <Dialog open={resetting !== null} onOpenChange={(open) => !open && setResetting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set a temporary password</DialogTitle>
            <DialogDescription>For {resetting?.full_name}. Their current password stops working.</DialogDescription>
          </DialogHeader>
          {resetting && <ResetPasswordForm member={resetting} onDone={() => setResetting(null)} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={toggling !== null} onOpenChange={(open) => !open && setToggling(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{toggling?.is_active ? `Deactivate ${toggling?.full_name}?` : `Reactivate ${toggling?.full_name}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {toggling?.is_active
                ? "They lose access straight away and are signed out. Their name stays on orders and history. You can reactivate them later."
                : "They can sign in again with their existing password."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={toggling?.is_active ? "destructive" : "default"}
              disabled={pending}
              onClick={(e) => {
                e.preventDefault()
                if (!toggling) return
                startTransition(async () => {
                  const result = await setActiveAction({ userId: toggling.id, active: !toggling.is_active })
                  if (!result.ok) toast.error(result.error)
                  else toast.success(result.message ?? "Saved")
                  setToggling(null)
                })
              }}
            >
              {pending && <Spinner />}
              {toggling?.is_active ? "Deactivate" : "Reactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function NewMemberForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: (values: NewMemberValues) => void }) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const form = useForm<NewMemberFormValues, unknown, NewMemberValues>({
    resolver: zodResolver(newMemberSchema),
    defaultValues: { full_name: "", email: "", phone: "", role: "staff", password: generatePassword() },
  })
  const { errors } = form.formState

  const submit = form.handleSubmit((values) => {
    setServerError(null)
    startTransition(async () => {
      const result = await createMemberAction(form.getValues())
      if (!result.ok) {
        setServerError(result.error)
        for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
          form.setError(field as keyof NewMemberFormValues, { message: messages[0] })
        }
        return
      }
      toast.success(result.message ?? "Account created")
      onCreated(values)
    })
  })

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      {serverError && <FormAlert>{serverError}</FormAlert>}
      <Field label="Full name" htmlFor="m-name" error={errors.full_name?.message}>
        <Input id="m-name" autoComplete="off" autoFocus aria-invalid={!!errors.full_name} {...form.register("full_name")} />
      </Field>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Email" htmlFor="m-email" error={errors.email?.message}>
          <Input
            id="m-email"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            autoComplete="off"
            aria-invalid={!!errors.email}
            aria-describedby={describedBy("m-email", { error: errors.email })}
            {...form.register("email")}
          />
        </Field>
        <Field label="Phone" htmlFor="m-phone" error={errors.phone?.message} optional>
          <Input id="m-phone" type="tel" inputMode="tel" autoComplete="off" {...form.register("phone")} />
        </Field>
      </div>
      <Field label="Role" htmlFor="m-role" hint="Staff never see amounts or payments.">
        <NativeSelect id="m-role" aria-describedby="m-role-hint" {...form.register("role")}>
          <option value="staff">Staff — factory floor</option>
          <option value="admin">Admin — office and owner</option>
        </NativeSelect>
      </Field>
      <Field label="Temporary password" htmlFor="m-password" error={errors.password?.message}>
        <div className="flex gap-2">
          <Input id="m-password" autoComplete="off" spellCheck={false} className="font-mono tracking-wide" aria-invalid={!!errors.password} {...form.register("password")} />
          <Button type="button" variant="outline" size="icon" aria-label="Generate a new password" onClick={() => form.setValue("password", generatePassword(), { shouldValidate: true })}>
            <RefreshCw aria-hidden="true" />
          </Button>
        </div>
      </Field>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner />} Create account
        </Button>
      </div>
    </form>
  )
}

function ResetPasswordForm({ member, onDone }: { member: TeamMember; onDone: () => void }) {
  const [password, setPassword] = useState(generatePassword)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (saved) return <CredentialCard email={member.email ?? ""} password={password} />

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setError(null)
        startTransition(async () => {
          const result = await resetMemberPasswordAction({ userId: member.id, password })
          if (!result.ok) return setError(result.error)
          toast.success("Temporary password set")
          setSaved(true)
        })
      }}
      className="flex flex-col gap-5"
    >
      {error && <FormAlert>{error}</FormAlert>}
      <Field label="New temporary password" htmlFor="r-password">
        <div className="flex gap-2">
          <Input id="r-password" value={password} onChange={(e) => setPassword(e.target.value)} className="font-mono tracking-wide" autoComplete="off" spellCheck={false} />
          <Button type="button" variant="outline" size="icon" aria-label="Generate a new password" onClick={() => setPassword(generatePassword())}>
            <RefreshCw aria-hidden="true" />
          </Button>
        </div>
      </Field>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending || password.length < 8}>
          {pending && <Spinner />} Set password
        </Button>
      </div>
    </form>
  )
}

function CredentialCard({ email, password }: { email: string; password: string }) {
  const text = `Regal Orders sign-in\nEmail: ${email}\nTemporary password: ${password}\n${window.location.origin}/login`
  return (
    <div className="flex flex-col gap-4">
      <dl className="grid gap-3 rounded-lg border border-line bg-subtle/60 p-4 text-sm">
        <div>
          <dt className="text-caption font-semibold text-stone">Email</dt>
          <dd className="font-semibold break-all text-ink">{email}</dd>
        </div>
        <div>
          <dt className="text-caption font-semibold text-stone">Temporary password</dt>
          <dd className="font-mono text-[1rem] font-semibold tracking-wide text-ink">{password}</dd>
        </div>
      </dl>
      <Button
        variant="outline"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text)
            toast.success("Sign-in details copied")
          } catch {
            toast.error("Couldn't copy. Select the text and copy it instead.")
          }
        }}
      >
        <Copy aria-hidden="true" /> Copy sign-in details
      </Button>
    </div>
  )
}
