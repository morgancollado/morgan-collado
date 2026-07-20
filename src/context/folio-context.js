"use client";

import { createContext, useContext } from "react";

// The current issue's folio line (e.g. "Vol. V, No. XI"), computed
// server-side in the layout from the post archive.
const FolioContext = createContext("");

export function FolioProvider({ value, children }) {
  return (
    <FolioContext.Provider value={value}>{children}</FolioContext.Provider>
  );
}

export function useFolio() {
  return useContext(FolioContext);
}
