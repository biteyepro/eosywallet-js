import { Api, JsSignatureProvider } from 'eosjs'
import Ecc from 'eosjs-ecc'
import { BaseNetworkPlugin } from './BaseNetworkPlugin'
import { EosyAccount } from './EosyAccount'
import { EosyUtil } from './EosyUtil'
import { IEosyNetworkOption } from './EosyWalletInterfaces'

export interface IPrivateKeyNetworkOption {
  storePassword?: string
  privateKey: string
}

export class PrivateKeyNetworkPlugin extends BaseNetworkPlugin {
  private priKey?: string
  private storePassword?: string
  constructor(nwOption: IEosyNetworkOption) {
    super(nwOption)
  }
  public async logout(): Promise<void> {
    this.priKey = undefined
    this.storePassword = undefined
    // TODO: delete from storage
  }

  // public restore(storePassword: string) {

  // }

  public async login(args: IPrivateKeyNetworkOption): Promise<EosyAccount[]> {
    this.priKey = args.privateKey
    this.storePassword = args.storePassword || 'asdfjksladfjwo4k4354365-34234'
    const pk: string = this.priKey as string
    if (!Ecc.isValidPrivate(pk)) {
      throw new Error('Invalid private key')
    }
    const pubKey = Ecc.privateToPublic(pk)
    const rpc = this.rpc
    const rs = await rpc.history_get_key_accounts(pubKey)
    if (rs.account_names.length === 0) {
      throw new Error('The account does not exist.')
    }
    const accountNames = rs.account_names
    const reqAcc: Array<Promise<any>> = []
    accountNames.forEach((a: string) => reqAcc.push(rpc.get_account(a)))
    const accArr = await Promise.all(reqAcc)
    const accounts: EosyAccount[] = []
    accArr.forEach((acc) => {
      if (EosyUtil.isShareAccount(acc.account_name)) {
        acc.permissions.filter((p: any) => p.parent === 'wallet' && p.required_auth && p.required_auth.keys.find((k: any) => k.key === pubKey)).map((p: any) => p.perm_name).forEach((a: string) => {
          accounts.push(new EosyAccount(acc.account_name, a, pubKey))
        })
      } else {
        const perNameArr = acc.permissions.filter((p: any) => p.required_auth && p.required_auth.keys.find((k: any) => k.key === pubKey)).map((p: any) => p.perm_name)
        if (perNameArr.length === 0) {
          return
        }
        const perName = (perNameArr.indexOf('active') > -1) ? 'active' : ((perNameArr.indexOf('owner') > -1) ? 'owner' : perNameArr[0])
        accounts.push(new EosyAccount(acc.account_name, perName, pubKey))
      }
    })
    if (accounts.length < 1) {
      throw new Error('Not exist valid account')
    }
    this.api = new Api({rpc: this.rpc, signatureProvider: new JsSignatureProvider([pk]), textEncoder: this.networkOption.textEncoder, textDecoder: this.networkOption.textDecoder})
    return accounts
  }
}
