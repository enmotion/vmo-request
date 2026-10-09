/*
 * @Author: enmotion
 * @Date: 2024-12-02 21:07:35
 * @Last Modified by: enmotion
 * 该库已经考虑过缓存问题的优化，目前缓存策略如下:
 * 1.request 方法中 expiredTime > 0 的 才会进行缓存，否则只是简单的队列，请求周期完成后，就会删除这个队列 hash 对象
 * 2.定期随请求清理过期缓存；命中时始终检查 TTL，不清理仍在等待的请求
 */

import axios from 'axios'
import md5 from 'md5'
import { clone, mergeDeepRight, omit } from 'ramda'
import type { AxiosRequestConfig, AxiosInstance } from 'axios'

export type RequestProps<M> = {
  name?: string // 接口名称
  key: string // 接口键名
  axiosConfig: Partial<AxiosRequestConfig> // 接口的 axios 配置
  middlConfig?: M // 中间件配置
  expiredTime?: number // 缓存过期时间（毫秒）
  retry?: number // 重试次数
}

export enum PromiseStatus {
  PENDING = 'pending', // Promise 挂起状态
  FULFILLED = 'fulfilled', // Promise 完成状态
  REJECTED = 'rejected' // Promise 拒绝状态
}

type RequestConfig = Partial<AxiosRequestConfig & { maxRetry: number }>

// Preserve non-JSON configuration identity instead of silently merging distinct requests.
const identities = new WeakMap<object, number>()
let identitySequence = 0
function identity(value: object): number {
  let id = identities.get(value)
  if (id === undefined) identities.set(value, id = ++identitySequence)
  return id
}
function requestKey(value: unknown, ancestors = new Set<object>()): string {
  if (value === null) return 'null'
  if (typeof value === 'function') return `function:${identity(value)}`
  if (typeof value !== 'object') return `${typeof value}:${JSON.stringify(String(value))}`
  if (ancestors.has(value)) return `reference:${identity(value)}`
  if (typeof URLSearchParams !== 'undefined' && value instanceof URLSearchParams) return `params:${JSON.stringify(value.toString())}`
  if (typeof FormData !== 'undefined' && value instanceof FormData) {
    return `form:${JSON.stringify(Array.from(value.entries(), ([key, item]) => [key, typeof item === 'string' ? item : `blob:${identity(item)}:${item.name}`]))}`
  }
  if (value instanceof ArrayBuffer) return `bytes:${JSON.stringify(Array.from(new Uint8Array(value)))}`
  if (ArrayBuffer.isView(value)) return `view:${value.constructor.name}:${JSON.stringify(Array.from(new Uint8Array(value.buffer, value.byteOffset, value.byteLength)))}`
  if (value instanceof axios.AxiosHeaders) return `headers:${requestKey(value.toJSON(), ancestors)}`
  if (value instanceof Date) return `date:${value.toJSON()}`
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
    return `object:${identity(value)}`
  }
  ancestors.add(value)
  const result = Array.isArray(value)
    ? `array:${value.length}:[${value.map(item => requestKey(item, ancestors)).join(',')}]`
    : `record:{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${requestKey((value as Record<string, unknown>)[key], ancestors)}`).join(',')}}`
  ancestors.delete(value)
  return result
}

export default class VmoRequest {
  private _lastSweep = 0
  private _defaultConfig: RequestConfig // 默认的 axios 配置
  private _axiosInstance: AxiosInstance | null = null
  private _queues: Record<
    string,
    {
      promise: { resolve: (value: any) => void; reject: (reason: any) => void }[] // 缓存中的 Promise 列表
      response?: any // 缓存的响应数据
      status: PromiseStatus // Promise 状态
      expired?: number | null // 缓存过期时间
    }
  >
  /**
   * 构建方法
   * @param config 请求配置
   * @param createInstance 是否创建 axios 实例，便于后期通过 .instance 直接访问到 axios 实例来配置相关其他属性
   */
  constructor(config: RequestConfig, createInstance: boolean = false) {
    try {
      this._queues = {} // 初始化缓存队列
      this._defaultConfig = config // 设置默认配置
      createInstance && (this._axiosInstance = axios.create(config))
    } catch (err) {
      throw new TypeError('new VmoRequest: with wrong params')
    }
  }
  /**
   * 获取 _axiosInstance 实例
   */
  get instance(): AxiosInstance | null {
    return this._axiosInstance
  }
  /**
   * 获取当前默认配置
   * @returns {Partial<AxiosRequestConfig & { maxRetry: number }>} // 获取默认配置
   */
  public getDefaultConfig() {
    return clone(omit(['maxRetry'], this._defaultConfig)) // 返回默认配置的深拷贝
  }
  /**
   * 重置当前默认配置
   * @param config {Partial<AxiosRequestConfig>}
   * @returns {boolean} // 返回设置是否成功
   */
  public setDefaultConfig(config: RequestConfig) {
    try {
      // Keep the published reset semantics: a fresh instance with fresh interceptors.
      const instance = this._axiosInstance ? axios.create(config) : null
      this._defaultConfig = config
      this._axiosInstance = instance
      return true
    } catch (err) {
      throw new TypeError('setDefaultConfig with wrong params')
    }
  }
  /**
   * 请求方法
   * @param config 请求配置
   * @param expiredTime 缓存时间（负值关闭缓存与合并，0 仅合并，正值缓存结果）
   * @param retry 重试次数
   * @returns
   */
  public async request(
    config: Partial<AxiosRequestConfig>,
    expiredTime: number = 0,
    retry: number = 0,
    retryDelay: number = 0
  ): Promise<any> {
    const $config = mergeDeepRight(this._defaultConfig, config) as Partial<AxiosRequestConfig> // 合并默认配置和用户配置
    $config.cancelToken?.throwIfRequested()
    if ($config.signal?.aborted) throw new axios.CanceledError('canceled')
    if (expiredTime >= 0) {
      const expired = expiredTime
      const hash = md5(requestKey({ config: $config, instanceDefaults: this._axiosInstance?.defaults })) // 获取请求配置的哈希值
      const now = Date.now()
      // Amortize cleanup instead of scanning and copying every entry per request.
      if (now - this._lastSweep >= 1000) {
        this._lastSweep = now
        for (const key of Object.keys(this._queues)) {
          const queue = this._queues[key]
          if (queue.status !== PromiseStatus.PENDING && now > queue.expired!) delete this._queues[key]
        }
      }
      /**
       * 存在缓存, 且缓存配置的过期时间尚未失效
       */
      if (this._queues[hash] && (!this._queues[hash]?.expired || Date.now() <= this._queues[hash].expired!)) {
        //已经存在缓存对象
        if (this._queues[hash].status == PromiseStatus.PENDING) {
          // 如果缓存对象的状态为 PENDING，则添加新的 Promise 到队列中
          return new Promise<any>((resolve, reject) => {
            this._queues[hash].promise.push({ resolve, reject })
          })
        }
        if (this._queues[hash].status == PromiseStatus.FULFILLED) {
          // 如果缓存对象的状态为 FULFILLED，则直接返回缓存的响应数据
          return Promise.resolve(this._queues[hash]?.response)
        }
        return Promise.reject(this._queues[hash].response)
      } else {
        // 不存在缓存对象，或缓存已过期
        this._queues[hash] = {
          promise: [], // 初始化 Promise 队列
          response: null, // 初始化响应数据
          status: PromiseStatus.PENDING, // 设置初始状态为 PENDING
          expired: null // 初始化过期时间
        }
        return this._sendRequest($config, hash, expired, retry, retryDelay)
      }
    } else {
      return this._sendRequest($config, undefined, 0, retry, retryDelay)
    }
  }
  /**
   * 发送具体请求
   * @param config 请求配置
   * @param hash 请求配置的hash指纹
   * @param expired 缓存超时时间
   * @param retry 重试次数
   * @returns
   */
  private async _sendRequest(
    config: AxiosRequestConfig,
    hash: string | undefined,
    expired: number,
    retry: number,
    retryDelay: number
  ) {
    const count = (value: number) => Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
    let retriesLeft = Math.min(retry === Infinity ? Infinity : count(retry), count(this._defaultConfig?.maxRetry ?? 9))
    const attemptRequest = async (): Promise<any> => {
      try {
        const res = !this._axiosInstance ? await axios.request(config) : await this._axiosInstance(config)
        if (hash) {
          setTimeout(() => {
            this._updateCache(hash, res, expired, PromiseStatus.FULFILLED)
          })
        }
        return Promise.resolve(res)
      } catch (err) {
        if (retriesLeft > 0 && !axios.isCancel(err) && !config.signal?.aborted) {
          retriesLeft--
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(attemptRequest())
            }, Number.isFinite(retryDelay) ? Math.abs(retryDelay) : 0)
          })
        } else {
          if (hash) {
            setTimeout(() => {
              this._updateCache(hash, err, axios.isCancel(err) ? 0 : expired, PromiseStatus.REJECTED)
            })
          }
          return Promise.reject(err)
        }
      }
    }
    return attemptRequest()
  }
  /**
   * 更新缓存并分发
   * @param hash 请求hash指纹
   * @param data 返回后需要分发的数据
   * @param expired 缓存过期时间
   * @param status 请求Promise 状态
   */
  private _updateCache(hash: string, data: any, expired: number, status: PromiseStatus) {
    const queue = this._queues[hash]
    if (expired > 0) {
      queue.response = data
      queue.status = status
      queue.expired = Date.now() + expired
    }
    queue.promise.forEach(element => {
      if (status === PromiseStatus.FULFILLED) element.resolve(data)
      else element.reject(data)
    })
    queue.promise = []
    if (expired <= 0) delete this._queues[hash]
  }
}
