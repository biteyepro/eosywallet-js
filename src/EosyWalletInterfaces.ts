import { Api, JsonRpc } from 'eosjs'
import { EosyAccount } from './EosyAccount'

/**
 *
 *
 * @export
 * @interface IEosyNetworkOption
 */
export interface IEosyNetworkOption {
  protocol: string
  host: string
  port: number
  chainId: string
  fetch: any
  textEncoder?: TextEncoder
  textDecoder?: TextDecoder
}
/**
 *
 *
 * @export
 * @interface IEosyNetworkPlugin
 */
export interface IEosyNetworkPlugin {
  login(args: any): Promise<EosyAccount[]>
  restore(args: any): Promise<EosyAccount[] | boolean>
  logout(): Promise<void>
  getRpc(): JsonRpc
  getApi(): Api
}
