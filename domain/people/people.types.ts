export type ChurchStatus = 'visitor' | 'member' | 'officer'
export type HouseholdRole = 'head' | 'spouse' | 'child' | 'other'
export type FieldVisibility = 'public' | 'staff_only' | 'self_only'

export type CreatePersonInput = {
  firstName: string
  lastName: string
  preferredName?: string
  suffix?: string
  email?: string
  phone?: string
  phoneType?: string
  churchStatus?: ChurchStatus
  officerTitle?: string
  membershipDate?: string
  receivedFrom?: string
  isMinor?: boolean
  householdId?: string
  householdRole?: HouseholdRole
  birthDate?: string
  gender?: string
  maritalStatus?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  zip?: string
  allergyNotes?: string
  medicalNotes?: string
  internalNotes?: string
  baptismDate?: string
  baptismType?: string
  directoryVisible?: boolean
}

export type UpdatePersonInput = Partial<CreatePersonInput> & {
  profilePhotoKey?: string
}

export type CreateEmergencyContactInput = {
  name: string
  relationship?: string
  phone: string
  email?: string
  priority?: number
  notes?: string
}

export type UpdateEmergencyContactInput = Partial<CreateEmergencyContactInput>

export type CreateAuthorizedPickupInput = {
  authorizedPersonId?: string
  externalName?: string
  externalPhone?: string
  relationship?: string
  isDenied?: boolean
  notes?: string
}

export type UpdateAuthorizedPickupInput = Partial<CreateAuthorizedPickupInput>

export type SetFieldVisibilityInput = {
  fieldName: string
  visibility: FieldVisibility
}
