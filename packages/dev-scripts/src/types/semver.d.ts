declare module 'semver' {
  export interface SemVer {
    version: string
  }

  export function minVersion(version: string): SemVer | null
  export function compare(a: string | SemVer, b: string | SemVer): number

  const semver: {
    minVersion: typeof minVersion
    compare: typeof compare
  }

  export default semver
}
