import type { ActionPlan } from "@openuidev/react-lang"
import { useTriggerAction } from "@openuidev/react-lang"

export function useTap(label: string | undefined, action: unknown) {
  const triggerAction = useTriggerAction()
  if (!action) return undefined
  return () => {
    triggerAction(label ?? "", undefined, action as ActionPlan)
  }
}
