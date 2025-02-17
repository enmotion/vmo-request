/*
 * @Author: enmotion
 * @Date: 2024-12-02 21:07:35
 * @Last Modified by: enmotion
 * @Last Modified time: 2024-12-05 18:25:15
 * 该库已经考虑过缓存问题的优化，目前缓存策略如下:
 * 1.request 方法中 expiredTime > 0 的 才会进行缓存，否则只是简单的队列，请求周期完成后，就会删除这个队列 hash 对象
 * 2.每次请求时，都会检查 this._queues, 状态不为 PromiseStatus.PENDING 同时 已经过期的 缓存数据，需要被清除关闭, 避免缓存膨胀
 */

import md5 from 'md5'
import axios from 'axios'
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

export default class VmoRequest {
  private _defaultConfig: Partial<AxiosRequestConfig & { maxRetry: number }> // 默认的 axios 配置
  private _axiosInstance: AxiosInstance | null = null
  private _queues: Record<
    string,
    {
      promise: { resolve: Function; reject: Function }[] // 缓存中的 Promise 列表
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
  constructor(config: Partial<AxiosRequestConfig>, createInstance: boolean = false) {
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
  public setDefaultConfig(config: Partial<AxiosRequestConfig>) {
    try {
      this._defaultConfig = config // 更新默认配置
      !!this._axiosInstance && (this._axiosInstance = axios.create(this._defaultConfig))
      return true
    } catch (err) {
      throw new TypeError('setDefaultConfig with wrong params')
    }
  }
  /**
   * 请求方法
   * @param config 请求配置
   * @param expiredTime 超时时间
   * @param retry 重试次数
   * @returns
   */
  public async request(
    config: Partial<AxiosRequestConfig>,
    expiredTime: number = 0,
    retry: number = 0, /* 新增重试次数参数，默认不重试*/
    retryDelay:number = 0 /* 重试延迟时间 */
  ) {
    const $config = mergeDeepRight(this._defaultConfig, config) as Partial<AxiosRequestConfig> // 合并默认配置和用户配置
    if (expiredTime >= 0) {
      const expired = expiredTime
      const hash = md5(JSON.stringify($config)) // 获取请求配置的哈希值
      this._queues = omit(
        Object.keys(this._queues).filter(
          key => this._queues[key]?.status != PromiseStatus.PENDING && Date.now() > this._queues[key].expired!
        ),
        this._queues
      )
      /**
       * 存在缓存, 且缓存配置的过期时间尚未失效
       */
      if (this._queues[hash] && (!this._queues[hash]?.expired || Date.now() <= this._queues[hash].expired!)) {
        //已经存在缓存对象
        if (this._queues[hash].status == PromiseStatus.PENDING) {
          // 如果缓存对象的状态为 PENDING，则添加新的 Promise 到队列中
          return new Promise((resolve, reject) => {
            this._queues[hash].promise.push({ resolve, reject })
          })
        }
        if (this._queues[hash].status == PromiseStatus.FULFILLED) {
          // 如果缓存对象的状态为 FULFILLED，则直接返回缓存的响应数据
          return Promise.resolve(this._queues[hash]?.response)
        }
        if (this._queues[hash].status == PromiseStatus.REJECTED) {
          // 如果缓存对象的状态为 REJECTED，则直接返回缓存的错误数据
          return Promise.reject(this._queues[hash]?.response)
        }
      } else {
        // console.log(`create -----------------------[${hash}] `)
        // 不存在缓存对象，或缓存已过期
        this._queues[hash] = {
          promise: [], // 初始化 Promise 队列
          response: null, // 初始化响应数据
          status: PromiseStatus.PENDING, // 设置初始状态为 PENDING
          expired: null // 初始化过期时间
        }
        return this._sendRequest($config, hash, expired, retry,retryDelay)
      }
    } else {
      return this._sendRequest(config, undefined, 0, retry,retryDelay)
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
    hash?: string,
    expired: number = 0,
    retry: number = 0, /*新增重试次数参数*/
    retryDelay:number = 0 /* 重试延迟时间 */
  ) {
    let retriesLeft = Math.min(retry, this._defaultConfig?.maxRetry ?? 9)
    const attemptRequest: any = async () => {
      try {
        const res = !this._axiosInstance ? await axios.request(config) : await this._axiosInstance(config)
        if (hash) {
          setTimeout(() => {
            this._updateCache(hash, res, expired, PromiseStatus.FULFILLED)
          })
        }
        return Promise.resolve(res)
      } catch (err) {
        if (retriesLeft > 0) {
          retriesLeft--
          // console.log(`Retrying request, retries left: ${retriesLeft}`)
          return new Promise((resolve)=>{
            setTimeout(()=>{
              resolve(attemptRequest())
            },Math.abs(retryDelay))
          })
          // return attemptRequest() // 递归调用以进行重试
        } else {
          if (hash) {
            setTimeout(() => {
              this._updateCache(hash, err, expired, PromiseStatus.REJECTED)
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
    // 如果缓存设置大于0
    try {
      if (expired > 0) {
        // 1. 需要对返回数据进行缓存操作
        const queue = this._queues[hash]
        // console.log(queue, hash, this._queues[hash], 'queue')
        queue.response = data // 缓存响应数据
        queue.status = status // 更新状态
        queue.expired = Date.now() + expired // 设置缓存过期时间
        queue.promise.forEach(element => {
          if (status === PromiseStatus.FULFILLED) {
            element.resolve(data) // 解决所有挂起的 Promise
          } else if (status === PromiseStatus.REJECTED) {
            element.reject(data) // 拒绝所有挂起的 Promise
          }
        })
        queue.promise = [] // 清空 Promise 队列
      } else {
        this._queues[hash].promise.forEach(element => {
          if (status === PromiseStatus.FULFILLED) {
            element.resolve(data) // 解决所有挂起的 Promise
          } else if (status === PromiseStatus.REJECTED) {
            element.reject(data) // 拒绝所有挂起的 Promise
          }
        })
        delete this._queues[hash]
      }
    } catch (err) {
      throw err
    }
  }
}
