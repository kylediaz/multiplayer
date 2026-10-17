import { useFormName, useGetFieldValue, useSetDefaultValue, useSetFieldValue } from "@openuidev/react-lang"

export function useFieldState(name: string, componentType: string, seedValue?: unknown) {
  const formName = useFormName()
  const getFieldValue = useGetFieldValue()
  const setFieldValue = useSetFieldValue()
  const value = getFieldValue(formName, name)
  useSetDefaultValue({
    formName,
    componentType,
    name,
    existingValue: value,
    defaultValue: seedValue,
  })
  return {
    value,
    set: (next: unknown, persist: boolean) => setFieldValue(formName, componentType, name, next, persist),
  }
}

export interface SelectItemProps {
  value?: string
  label?: string
}

export function readSelectItems(items: unknown): SelectItemProps[] {
  return ((Array.isArray(items) ? items : []) as Array<{ props?: SelectItemProps }>)
    .map((item) => item?.props)
    .filter((props): props is SelectItemProps => !!props)
}

export function inputType(type?: string): string {
  if (type === "email" || type === "password" || type === "number" || type === "url") return type
  return "text"
}
