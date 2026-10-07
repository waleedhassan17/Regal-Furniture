/** The minimum the client-side shell needs to know about the signed-in user. */
export type ShellUser = {
  fullName: string
  email: string
  isAdmin: boolean
}
