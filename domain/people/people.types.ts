export type ChurchStatus = 'visitor' | 'member' | 'officer'
export type HouseholdRole = 'head' | 'spouse' | 'child' | 'other'

export type CreatePersonInput = {
  firstName: string
  lastName: string
  preferredName?: string
  email?: string
  phone?: string
  phoneType?: string
  churchStatus?: ChurchStatus
  isMinor?: boolean
  householdId?: string
  householdRole?: HouseholdRole
  birthDate?: string
  gender?: string
  allergyNotes?: string
  medicalNotes?: string
  internalNotes?: string
}

export type UpdatePersonInput = Partial<CreatePersonInput> & {
  officerTitle?: string
  membershipDate?: string
  directoryVisible?: boolean
}
