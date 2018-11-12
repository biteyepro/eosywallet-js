import {EosyUtil} from './EosyUtil'

export class EosyAccount {
  /**
   * Parse account name to EosyAccount
   * @param name Support: startswith '.' account and split by '@', E.g. '.test11111' is eosy inner account. 'address.bank@test11111' is the same as '.test11111'
   */
  public static parse(name: string): EosyAccount | undefined {
    if (!name || name.length === 0) {
      return
    }
    if (name.charAt(0) === '.') {
      return new EosyAccount(EosyUtil.AddressAccountName, name.substring(1))
    }
    const pos = name.indexOf('@')
    let m
    let a
    if (pos > 0) {
      m = name.substring(0, pos)
      a = name.substring(pos + 1)
    } else {
      m = name
      a = 'active'
    }
    return new EosyAccount(m, a)
  }
  /**
   * account name
   *
   * @type {string}
   * @memberof EosyAccount
   */
  public accountName: string
  /**
   * authority
   *
   * @type {string}
   * @memberof EosyAccount
   */
  public authority: string
  /**
   * public key
   *
   * @type {string}
   * @memberof EosyAccount
   */
  public publicKey?: string

  /**
   * Creates an instance of EosyAccount.
   * @param {string} accountName
   * @param {string} authority
   * @param {string} [publicKey]
   * @memberof EosyAccount
   */
  constructor(accountName: string, authority: string, publicKey?: string) {
    this.accountName = accountName
    this.authority = authority
    this.publicKey = publicKey
  }

  /**
   * get full name. E.g. 'Account@authority'
   *
   * @returns {string}
   * @memberof EosyAccount
   */
  public getFullName(): string {
    return this.accountName + '@' + this.authority
  }

  public isShareAccount(): boolean {
    return this.accountName === EosyUtil.AddressAccountName
  }
  /**
   * get EosyAccount name, E.g. '.test11111'
   *
   * @returns {string}
   * @memberof EosyAccount
   */
  public getEosyAccountName(): string {
    return this.isShareAccount() ? '.' + this.authority : this.accountName
  }
}
