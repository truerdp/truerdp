"use client"

import * as React from "react"
import { City, Country, State } from "country-state-city"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"
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
const countryOptions = countries.map((country) => country.name)

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
          <LocationCombobox
            id={ids?.country ?? "country"}
            value={country}
            options={countryOptions}
            placeholder="Select country"
            emptyMessage="No countries found"
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
          <LocationCombobox
            id={ids?.state ?? "state"}
            value={state}
            options={stateOptions}
            placeholder={
              countryCode ? "Select state/region" : "Select country first"
            }
            emptyMessage="No states or regions found"
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
        <LocationCombobox
          id={ids?.city ?? "city"}
          value={city}
          options={cities.map((cityOption) => cityOption.name)}
          placeholder={stateCode ? "Select city" : "Select state/region first"}
          emptyMessage="No cities found"
          disabled={disabled || !countryCode || !stateCode}
          aria-invalid={!!errors?.city}
          onChange={onCityChange}
        />
        {errors?.city ? <FieldError>{errors.city}</FieldError> : null}
      </Field>
    </>
  )
}

type LocationComboboxProps = {
  id: string
  value: string
  options: string[]
  placeholder: string
  emptyMessage: string
  disabled: boolean
  "aria-invalid": boolean
  onChange: (value: string) => void
}

function LocationCombobox({
  id,
  value,
  options,
  placeholder,
  emptyMessage,
  disabled,
  "aria-invalid": invalid,
  onChange,
}: LocationComboboxProps) {
  return (
    <Combobox
      value={value || null}
      onValueChange={(nextValue) => onChange(nextValue ?? "")}
    >
      <ComboboxInput
        id={id}
        className="w-full"
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={invalid}
        showClear={!!value}
      />
      <ComboboxContent>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          <ComboboxGroup>
            {options.map((option, index) => (
              <ComboboxItem key={`${option}-${index}`} value={option}>
                {option}
              </ComboboxItem>
            ))}
          </ComboboxGroup>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

export { BillingLocationFields }
