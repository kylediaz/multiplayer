"use client"

import { useCallback, useState } from "react"

export type SetCanvasState<T> = (action: T | ((prev: T) => T)) => void

export function useCanvasState<T>(key: string, defaultValue: T): [T, SetCanvasState<T>] {
  void key
  return useState(defaultValue)
}

export type CanvasAction =
  | { type: "openAgent"; agentId: string }
  | { type: "newComposerChat"; userPrompt?: string }
  | { type: "openFile"; path: string; selection?: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number } }

export function useCanvasAction(): (action: CanvasAction) => void {
  return useCallback(() => {}, [])
}
