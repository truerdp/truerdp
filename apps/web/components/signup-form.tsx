"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Controller, useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import { toast } from "sonner"
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
import { PhoneInput } from "@workspace/ui/components/phone-input"
import { Spinner } from "@workspace/ui/components/spinner"
import { authClient } from "@/lib/auth-client"
import { webPaths } from "@/lib/paths"

const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} is required`)

const signupSchema = z
  .object({
    firstName: requiredText("First name"),
    lastName: requiredText("Last name"),
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    phone: requiredText("Phone"),
    companyName: z.string().trim().optional(),
    taxId: z.string().trim().optional(),
    addressLine1: requiredText("Address line 1"),
    addressLine2: z.string().trim().optional(),
    city: requiredText("City"),
    state: requiredText("State/Region"),
    postalCode: requiredText("Postal code"),
    country: requiredText("Country"),
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
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      companyName: "",
      taxId: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
  })
  const requestedRedirect = searchParams.get("redirect")
  const loginHref = requestedRedirect
    ? `${webPaths.login}?redirect=${encodeURIComponent(requestedRedirect)}`
    : webPaths.login
  const onSubmit: SubmitHandler<SignupFormValues> = async (values) => {
    const firstName = values.firstName.trim()
    const lastName = values.lastName.trim()
    const fullName = `${firstName} ${lastName}`.trim()
    const email = values.email.trim()
    const password = values.password
    const optional = (value?: string) => value?.trim() ?? ""

    try {
      const callbackURL = `${window.location.origin}${webPaths.verifyEmailSuccess}`

      const { error } = await authClient.signUp.email({
        name: fullName,
        email,
        password,
        firstName,
        lastName,
        billingPhone: values.phone.trim(),
        billingCompanyName: optional(values.companyName),
        billingTaxId: optional(values.taxId),
        billingAddressLine1: values.addressLine1.trim(),
        billingAddressLine2: optional(values.addressLine2),
        billingCity: values.city.trim(),
        billingState: values.state.trim(),
        billingPostalCode: values.postalCode.trim(),
        billingCountry: values.country.trim(),
        callbackURL,
      })

      if (error) {
        throw new Error(error.message || "Unable to create account")
      }

      toast.success("Account created. Verify your email to continue.")
      router.push(`${webPaths.verifyEmail}?email=${encodeURIComponent(email)}`)
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.firstName}>
                <FieldLabel htmlFor="first-name">First Name</FieldLabel>
                <Input
                  id="first-name"
                  type="text"
                  placeholder="John"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.firstName}
                  {...register("firstName")}
                />
                {errors.firstName ? (
                  <FieldError>{errors.firstName.message}</FieldError>
                ) : null}
              </Field>
              <Field data-invalid={!!errors.lastName}>
                <FieldLabel htmlFor="last-name">Last Name</FieldLabel>
                <Input
                  id="last-name"
                  type="text"
                  placeholder="Doe"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.lastName}
                  {...register("lastName")}
                />
                {errors.lastName ? (
                  <FieldError>{errors.lastName.message}</FieldError>
                ) : null}
              </Field>
            </div>
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
            <div className="space-y-3 border-t pt-4">
              <div>
                <p className="text-sm font-medium">Billing address</p>
                <p className="text-xs text-muted-foreground">
                  This address will be used for plan purchases and invoices.
                </p>
              </div>
              <Field data-invalid={!!errors.phone}>
                <FieldLabel htmlFor="billing-phone">Phone</FieldLabel>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      id="billing-phone"
                      value={field.value}
                      onChange={(value) => field.onChange(value ?? "")}
                      onBlur={field.onBlur}
                      name={field.name}
                      placeholder="Phone number"
                      disabled={isSubmitting}
                      aria-invalid={!!errors.phone}
                    />
                  )}
                />
                {errors.phone ? (
                  <FieldError>{errors.phone.message}</FieldError>
                ) : null}
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="company-name">Company</FieldLabel>
                  <Input
                    id="company-name"
                    type="text"
                    placeholder="Company (optional)"
                    disabled={isSubmitting}
                    {...register("companyName")}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="tax-id">GST/VAT ID</FieldLabel>
                  <Input
                    id="tax-id"
                    type="text"
                    placeholder="GST/VAT ID (optional)"
                    disabled={isSubmitting}
                    {...register("taxId")}
                  />
                </Field>
              </div>
              <Field data-invalid={!!errors.addressLine1}>
                <FieldLabel htmlFor="address-line-1">Address line 1</FieldLabel>
                <Input
                  id="address-line-1"
                  type="text"
                  placeholder="Street address"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.addressLine1}
                  {...register("addressLine1")}
                />
                {errors.addressLine1 ? (
                  <FieldError>{errors.addressLine1.message}</FieldError>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="address-line-2">Address line 2</FieldLabel>
                <Input
                  id="address-line-2"
                  type="text"
                  placeholder="Apartment, suite, unit (optional)"
                  disabled={isSubmitting}
                  {...register("addressLine2")}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={!!errors.city}>
                  <FieldLabel htmlFor="city">City</FieldLabel>
                  <Input
                    id="city"
                    type="text"
                    placeholder="City"
                    disabled={isSubmitting}
                    aria-invalid={!!errors.city}
                    {...register("city")}
                  />
                  {errors.city ? (
                    <FieldError>{errors.city.message}</FieldError>
                  ) : null}
                </Field>
                <Field data-invalid={!!errors.state}>
                  <FieldLabel htmlFor="state">State/Region</FieldLabel>
                  <Input
                    id="state"
                    type="text"
                    placeholder="State or region"
                    disabled={isSubmitting}
                    aria-invalid={!!errors.state}
                    {...register("state")}
                  />
                  {errors.state ? (
                    <FieldError>{errors.state.message}</FieldError>
                  ) : null}
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={!!errors.postalCode}>
                  <FieldLabel htmlFor="postal-code">Postal code</FieldLabel>
                  <Input
                    id="postal-code"
                    type="text"
                    placeholder="Postal code"
                    disabled={isSubmitting}
                    aria-invalid={!!errors.postalCode}
                    {...register("postalCode")}
                  />
                  {errors.postalCode ? (
                    <FieldError>{errors.postalCode.message}</FieldError>
                  ) : null}
                </Field>
                <Field data-invalid={!!errors.country}>
                  <FieldLabel htmlFor="country">Country</FieldLabel>
                  <Input
                    id="country"
                    type="text"
                    placeholder="Country"
                    disabled={isSubmitting}
                    aria-invalid={!!errors.country}
                    {...register("country")}
                  />
                  {errors.country ? (
                    <FieldError>{errors.country.message}</FieldError>
                  ) : null}
                </Field>
              </div>
            </div>
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
