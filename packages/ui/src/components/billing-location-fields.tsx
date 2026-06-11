"use client"

import * as React from "react"
import { City, Country, State } from "country-state-city"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"

type LocationFieldMessages = {
  country?: string
  state?: string
  city?: string
}

type BillingLocationFieldsProps = {
  country: string
  state: string
  city: string
  onCountryChange: (value: string) => void
  onStateChange: (value: string) => void
  onCityChange: (value: string) => void
  disabled?: boolean
  errors?: LocationFieldMessages
  ids?: {
    country?: string
    state?: string
    city?: string
  }
}

const countries = Country.getAllCountries()

function findCountryCode(countryName: string) {
  return (
    countries.find((country) => country.name === countryName)?.isoCode ?? ""
  )
}

function BillingLocationFields({
  country,
  state,
  city,
  onCountryChange,
  onStateChange,
  onCityChange,
  disabled = false,
  errors,
  ids,
}: BillingLocationFieldsProps) {
  const countryCode = React.useMemo(() => findCountryCode(country), [country])
  const states = React.useMemo(
    () => (countryCode ? State.getStatesOfCountry(countryCode) : []),
    [countryCode]
  )
  const stateOptions = React.useMemo(
    () => states.map((stateOption) => stateOption.name),
    [states]
  )
  const stateCode = React.useMemo(
    () =>
      states.find((stateOption) => stateOption.name === state)?.isoCode ?? "",
    [state, states]
  )
  const cities = React.useMemo(
    () =>
      countryCode && stateCode
        ? City.getCitiesOfState(countryCode, stateCode)
        : [],
    [countryCode, stateCode]
  )

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2">
        <Field data-invalid={!!errors?.country}>
          <FieldLabel htmlFor={ids?.country ?? "country"}>Country</FieldLabel>
          <LocationSelect
            key="country"
            id={ids?.country ?? "country"}
            value={country}
            options={countries.map((countryOption) => ({
              key: countryOption.isoCode,
              label: countryOption.name,
              value: countryOption.name,
            }))}
            placeholder="Select country"
            disabled={disabled}
            aria-invalid={!!errors?.country}
            onChange={(value) => {
              onCountryChange(value)
              onStateChange("")
              onCityChange("")
            }}
          />
          {errors?.country ? <FieldError>{errors.country}</FieldError> : null}
        </Field>
        <Field data-invalid={!!errors?.state}>
          <FieldLabel htmlFor={ids?.state ?? "state"}>State/Region</FieldLabel>
          <LocationSelect
            key={countryCode || "state-disabled"}
            id={ids?.state ?? "state"}
            value={state}
            options={stateOptions.map((stateOption) => ({
              key: stateOption,
              label: stateOption,
              value: stateOption,
            }))}
            placeholder={
              countryCode ? "Select state/region" : "Select country first"
            }
            disabled={disabled || !countryCode}
            aria-invalid={!!errors?.state}
            onChange={(value) => {
              onStateChange(value)
              onCityChange("")
            }}
          />
          {errors?.state ? <FieldError>{errors.state}</FieldError> : null}
        </Field>
      </div>
      <Field data-invalid={!!errors?.city}>
        <FieldLabel htmlFor={ids?.city ?? "city"}>City</FieldLabel>
        <LocationSelect
          key={`${countryCode}-${stateCode || "city-disabled"}`}
          id={ids?.city ?? "city"}
          value={city}
          options={cities.map((cityOption, index) => ({
            key: `${cityOption.countryCode}-${cityOption.stateCode}-${cityOption.name}-${index}`,
            label: cityOption.name,
            value: cityOption.name,
          }))}
          placeholder={stateCode ? "Select city" : "Select state/region first"}
          disabled={disabled || !countryCode || !stateCode}
          aria-invalid={!!errors?.city}
          onChange={onCityChange}
        />
        {errors?.city ? <FieldError>{errors.city}</FieldError> : null}
      </Field>
    </>
  )
}

type LocationSelectOption = {
  key: string
  label: string
  value: string
}

type LocationSelectProps = {
  id: string
  value: string
  options: LocationSelectOption[]
  placeholder: string
  disabled: boolean
  "aria-invalid": boolean
  onChange: (value: string) => void
}

function LocationSelect({
  id,
  value,
  options,
  placeholder,
  disabled,
  "aria-invalid": invalid,
  onChange,
}: LocationSelectProps) {
  return (
    <Select
      value={value || null}
      onValueChange={(nextValue) => onChange(nextValue ?? "")}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-full" aria-invalid={invalid}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.key} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export { BillingLocationFields }
