"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import { toast } from "sonner"
import { clientApi } from "@workspace/api"
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
import { Spinner } from "@workspace/ui/components/spinner"
import { resolvePostAuthRedirect } from "@/lib/auth"
import { webPaths } from "@/lib/paths"

const signupSchema = z
  .object({
    name: z.string().trim().min(1, "Full name is required"),
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      })
    }
  })

type SignupFormValues = z.infer<typeof signupSchema>
export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })
  const requestedRedirect = searchParams.get("redirect")
  const loginHref = requestedRedirect
    ? `${webPaths.login}?redirect=${encodeURIComponent(requestedRedirect)}`
    : webPaths.login
  const onSubmit: SubmitHandler<SignupFormValues> = async (values) => {
    const fullName = values.name.trim()
    const email = values.email.trim()
    const password = values.password
    const nameParts = fullName.split(/\s+/).filter(Boolean)
    const firstName = nameParts[0] || fullName
    const lastName = nameParts.slice(1).join(" ") || "User"

    try {
      await clientApi("/users", {
        method: "POST",
        body: {
          email,
          password,
          firstName,
          lastName,
        },
      })

      await clientApi("/auth/login", {
        method: "POST",
        body: { email, password },
      })
      toast.success("Account created")
      const redirectTarget = resolvePostAuthRedirect(requestedRedirect)

      if (redirectTarget.startsWith("/")) {
        router.push(redirectTarget)
      } else {
        window.location.assign(redirectTarget)
      }
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to create account"
      setError("root", { message })
    }
  }
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                disabled={isSubmitting}
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              {errors.name ? (
                <FieldError>{errors.name.message}</FieldError>
              ) : null}
            </Field>
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
              <FieldDescription>
                We&apos;ll use this to contact you. We will not share your email
                with anyone else.
              </FieldDescription>
            </Field>
            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                disabled={isSubmitting}
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              {errors.password ? (
                <FieldError>{errors.password.message}</FieldError>
              ) : null}
              <FieldDescription>
                Must be at least 6 characters long.
              </FieldDescription>
            </Field>
            <Field data-invalid={!!errors.confirmPassword}>
              <FieldLabel htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                disabled={isSubmitting}
                aria-invalid={!!errors.confirmPassword}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword ? (
                <FieldError>{errors.confirmPassword.message}</FieldError>
              ) : null}
              <FieldDescription>Please confirm your password.</FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Spinner data-icon="inline-start" />}
                  Create Account
                </Button>
                {errors.root?.message ? (
                  <FieldError>{errors.root.message}</FieldError>
                ) : null}
                <FieldDescription className="px-6 text-center">
                  Already have an account?{" "}
                  <Link href={loginHref} className="underline">
                    Sign in
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
