"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import { HugeiconsIcon } from "@hugeicons/react"
import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  FieldError,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import { Spinner } from "@workspace/ui/components/spinner"
import { resolvePostAuthRedirect } from "@/lib/auth"
import { authClient } from "@/lib/auth-client"
import { webPaths } from "@/lib/paths"

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })
  const requestedRedirect = searchParams.get("redirect")
  const signupHref = requestedRedirect
    ? `${webPaths.signup}?redirect=${encodeURIComponent(requestedRedirect)}`
    : webPaths.signup

  const onSubmit: SubmitHandler<LoginFormValues> = async (values) => {
    const email = values.email.trim()
    const password = values.password

    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
        rememberMe: true,
      })

      if (error) {
        throw new Error(error.message || "Login failed")
      }

      toast.success("Logged in successfully")

      const redirectTarget = resolvePostAuthRedirect(requestedRedirect)

      if (redirectTarget.startsWith("/")) {
        router.push(redirectTarget)
      } else {
        window.location.assign(redirectTarget)
      }
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Login failed"
      setError("root", { message })
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                {errors.email ? (
                  <FieldError>{errors.email.message}</FieldError>
                ) : null}
              </Field>
              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="rounded-s-4xl rounded-e-none"
                    disabled={isSubmitting}
                    aria-invalid={!!errors.password}
                    {...register("password")}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="button"
                      size="icon-xs"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      disabled={isSubmitting}
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      <HugeiconsIcon
                        icon={showPassword ? ViewOffIcon : ViewIcon}
                        strokeWidth={2}
                      />
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                {errors.password ? (
                  <FieldError>{errors.password.message}</FieldError>
                ) : null}
              </Field>
              <div className="-mt-3 text-right text-sm">
                <Link href={webPaths.forgotPassword} className="underline">
                  Forgot password?
                </Link>
              </div>
              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Spinner data-icon="inline-start" />}
                  Login
                </Button>
                {errors.root?.message ? (
                  <FieldError>{errors.root.message}</FieldError>
                ) : null}
                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <Link href={signupHref} className="underline">
                    Sign up
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
