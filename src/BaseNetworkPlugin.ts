import { Api, JsonRpc } from 'eosjs'
import { EosyAccount } from './EosyAccount'
import { IEosyNetworkOption, IEosyNetworkPlugin } from './EosyWalletInterfaces'

export abstract class BaseNetworkPlugin implements IEosyNetworkPlugin {
  protected networkOption: IEosyNetworkOption
  protected rpc: JsonRpc
  protected api?: Api
  constructor(nwOption: IEosyNetworkOption) {
    this.networkOption = nwOption
    // const fetch = typeof window === 'undefined' ?
    this.rpc = new JsonRpc(`${nwOption.protocol}://${nwOption.host}:${nwOption.port}`, {fetch: nwOption.fetch})
  }
  public getRpc(): JsonRpc {
    return this.rpc
  }
  public getApi(): Api {
    return this.api as Api
  }
  public abstract login(args: any): Promise<EosyAccount[]>
  public abstract logout(): Promise<void>
}
