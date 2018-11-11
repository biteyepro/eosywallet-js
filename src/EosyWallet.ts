// import CryptoJS from 'crypto-js'
import { Api, JsonRpc } from 'eosjs'
// import { Ecc } from 'eosjs-ecc'
import { EosyAccount } from './EosyAccount'
import { EosyUtil } from './EosyUtil'
import { IEosyNetworkPlugin } from './EosyWalletInterfaces'

/**
 *
 *
 * @class EosyWallet
 */
export class EosyWallet {

  private static patchAction(api: Api, actionNameArr: string[]) {
    if (actionNameArr.length < 1) {
      return
    }
    const abi: any = {
      actions: [],
      structs: [
        {
          name: 'transferout',
          base: '',
          fields: [{
            name: 'to',
            type: 'name',
          }, {
            name: 'quantity',
            type: 'asset',
          }, {
            name: 'memo',
            type: 'string',
          }, {
            name: 'include_account',
            type: 'bool',
          }],
        },
      ],
      types: [],
      version: 'eosio::abi/1.0',
    }
    actionNameArr.forEach((a) => {
      const action = {
        name: a,
        type: 'transferout',
        ricardian_contract: '',
      }
      abi.actions.push(action)
    })
    api.cachedAbis.set(EosyUtil.BankAccountName, {abi, rawAbi: new Uint8Array(0)})
  }

  private accounts: EosyAccount[] = []

  private networkPlugin: IEosyNetworkPlugin

  constructor(networkPlugin: IEosyNetworkPlugin) {
    this.networkPlugin = networkPlugin
  }

  public getRpc(): JsonRpc {
    return this.networkPlugin.getRpc()
  }

  /**
   * @returns {boolean} 是否已经登录
   */
  public isLogin(): boolean {
    return this.accounts.length > 0
  }
  /**
   * 登出
   */
  public logout(): Promise<void> {
    this.accounts = []
    return this.networkPlugin.logout()
  }
  /**
   * @returns {EosyAccount[]}
   */
  public getAccounts(): EosyAccount[] {
    return this.accounts
  }
  /**
   * Login by Network Plugin
   *
   * @param {*} args
   * @returns {Promise<EosyAccount[]>}
   * @memberof EosyWallet
   */
  public async login(args: any): Promise<EosyAccount[]> {
    const accs = await this.networkPlugin.login(args)
    this.accounts = accs
    const shareAccountNameArr = accs.filter((a) => a.isShareAccount).map((a) => a.authority)
    if (shareAccountNameArr.length > 0) {
      EosyWallet.patchAction(this.networkPlugin.getApi(), shareAccountNameArr)
    }
    return accs
  }

  /**
   *
   * @param {String} contractName
   * @param {SAAcount | String} account
   * @param {String} symbol
   * @returns {Promise<String[]>}
   */
  public async getCurrencyBalance(contractName: string, account: EosyAccount | string, symbol: string = 'EOS'): Promise<string[]> {
    const accName = (account instanceof EosyAccount) ? (account as EosyAccount).getEosyAccountName() : account
    if (accName.charAt(0) === '.') {
      // TODO: 目前只支持EOS, EOS type is 0
      const tmp = EosyUtil.encodeName(accName.substring(1))
      const lower = tmp.toString()
      const upper = tmp.add(1).toString()
      const options = {
        json: true,
        code: EosyUtil.BankAccountName,
        scope: EosyUtil.BankAccountName,
        table: 'assets',
        lower_bound: lower,
        upper_bound: upper,
        limit: 1,
      }
      const rs = await this.getRpc().get_table_rows(options)
      const rows = rs.rows
      let amount = 0
      if (rows.length > 0) {
        // 目前只有EOS
        const b = rows[0].balances.find((c: any) => c.asset_type === 0)
        if (b) {
          amount = b.amount
        }
      }
      return [(amount / 10000).toFixed(4) + ' ' + symbol]
    }
    return this.getRpc().get_currency_balance(contractName, accName, symbol)
  }
  /**
   * Check if the account exists
   *
   * @param {string} accountName
   * @returns {Promise<boolean>}
   * @memberof EosyWallet
   */
  public async checkAccountExists(accountName: string): Promise<boolean> {
    if (accountName.charAt(0) === '.') {
      accountName = accountName.substring(1)
    }
    const tmp: Long = EosyUtil.encodeName(accountName)
    const lower: string = tmp.toString()
    const upper: string = tmp.add(1).toString()
    const options = {
      json: true,
      code: EosyUtil.BankAccountName,
      scope: EosyUtil.BankAccountName,
      table: 'assets',
      lower_bound: lower,
      upper_bound: upper,
      limit: 1,
    }
    const rs = await this.getRpc().get_table_rows(options)
    return rs.rows.length > 0
  }
  // /**
  //  * 恢复保存的钱包
  //  * @param {string} password
  //  * @returns {Promise}
  //  */
  // private restore(password) {
  //   const priKey = EosyWallet.getDecrypt('ql', password)
  //   if (priKey) {
  //     return importPrivateKey(priKey)
  //   }
  //   return Promise.reject('Not find stored wallet')
  // }

  /**
   * Token transfer...
   *
   * @param {(EosyAccount | string)} account
   * @param {string} toAccountName
   * @param {string} amountAsset
   * @param {string} memo
   * @param {boolean} [includeShareAccountName=true]
   * @param {(object | undefined)} eosOptions
   * @returns {Promise<any>}
   * @memberof EosyWallet
   */
  public transfer(account: EosyAccount | string, toAccountName: string, amountAsset: string, memo: string, includeShareAccountName: boolean = true, eosOptions?: object): Promise<any> {
    if (!(account instanceof EosyAccount)) {
      account = EosyAccount.parse(account) as EosyAccount
    }
    // 目前只支持转账EOS
    let actions: object
    if (account.isShareAccount()) {
      actions = [{
          account: EosyUtil.BankAccountName,
          name: account.authority,
          authorization: [{
              actor: account.accountName,
              permission: account.authority,
          }],
          data: {
              to: toAccountName,
              quantity: amountAsset,
              memo,
              include_account: includeShareAccountName,
          },
      }]
    } else {
      actions = [{
        account: 'eosio.token',
        name: 'transfer',
        authorization: [{
          actor: account.accountName,
          permission: account.authority,
        }],
        data: {
          from: account.accountName,
          to: toAccountName,
          quantity: amountAsset,
          memo,
        },
      }]
    }

    return this.networkPlugin.getApi().transact({
      actions,
    }, Object.assign({
      blocksBehind: 3,
      expireSeconds: 30,
    }, eosOptions))
  }
}
