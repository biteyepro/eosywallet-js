import CryptoJS from 'crypto-js'
import Long from 'long'

export class EosyUtil {
  public static AddressAccountName = 'address.bank'
  public static BankAccountName = 'counter.bank'

  public static charmap: string = '.12345abcdefghijklmnopqrstuvwxyz'

  public static charidx(ch: string): number {
    const idx = EosyUtil.charmap.indexOf(ch)
    if (idx === -1) { throw new TypeError('Invalid character: \'' + ch + '\'') }
    return idx
  }

  public static encodeName(name: string): Long {
    let bitstr = ''
    for (let i = 0; i <= 12; i++) {
      // process all 64 bits (even if name is short)
      const c = i < name.length ? EosyUtil.charidx(name[i]) : 0
      const bitlen = i < 12 ? 5 : 4
      let bits = Number(c).toString(2)
      if (bits.length > bitlen) {
        throw new TypeError('Invalid name ' + name)
      }
      bits = '0'.repeat(bitlen - bits.length) + bits
      bitstr += bits
    }
    return Long.fromString(bitstr, true, 2)
  }

  public static isShareAccount(accountName: string): boolean {
    return accountName === this.AddressAccountName
  }

  public static saveEncrypt(key: string, value: string, password: string): void {
    EosyUtil.getStorage().setItem(key, CryptoJS.AES.encrypt(value, password + 'A6CKfRm8yL9fRpKj').toString())
  }

  public static getDecrypt(key: string, password: string): string | undefined {
    const rs = EosyUtil.getStorage().getItem(key)
    if (rs) {
      const tmp = CryptoJS.AES.decrypt(rs, password + 'A6CKfRm8yL9fRpKj').toString(CryptoJS.enc.Utf8)
      return tmp
    }
  }

  private static tmpStorage: Map<string, string> = new Map<string, string>()
  private static getStorage(): any {
    if (sessionStorage) {
      return sessionStorage
    }
    return this.tmpStorage
  }
}
