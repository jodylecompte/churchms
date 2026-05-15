export type CreateHouseholdInput = {
  name: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  anniversaryDate?: string
  notes?: string
}

export type UpdateHouseholdInput = Partial<CreateHouseholdInput>
