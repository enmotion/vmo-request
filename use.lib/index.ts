/*
 * @Author: enmotion
 * @Date: 2024-12-02 17:07:35
 * @Last Modified by: enmotion
 * @Last Modified time: 2024-12-04 13:02:25
 */

import md5 from 'md5'
import axios from 'axios'
import { clone, mergeDeepRight, omit } from 'ramda'
import type { AxiosRequestConfig } from 'axios'

export type RequestProps<M> = {
  name?: string // 接口名称
  key: string // 接口键名
  axiosConfig: Partial<AxiosRequestConfig> // 接口的 axios 配置
  middlConfig: M // 中间件配置
  expiredTime: number // 缓存过期时间（毫秒）
  retry: number // 重试次数
}

export enum PromiseStatus {
  PENDING = 'pending', // Promise 挂起状态
  FULFILLED = 'fulfilled', // Promise 完成状态
  REJECTED = 'rejected' // Promise 拒绝状态
}

export default class VmoRequest {
  private _defaultConfig: Partial<AxiosRequestConfig & { maxRetry: number }> // 默认的 axios 配置
  private _queues: Record<
    string,
    {
      promise: { resolve: Function; reject: Function }[] // 缓存中的 Promise 列表
      response?: any // 缓存的响应数据
      status: PromiseStatus // Promise 状态
      expired?: number | null // 缓存过期时间
    }
  >
  constructor(config: Partial<AxiosRequestConfig>) {
    this._queues = {} // 初始化缓存队列
    this._defaultConfig = config // 设置默认配置
  }
  public getDefaultConfig() {
    return clone(omit(['maxRetry'], this._defaultConfig)) // 返回默认配置的深拷贝
  }
  public setDefaultConfig(config: Partial<AxiosRequestConfig>) {
    this._defaultConfig = config // 更新默认配置
    return true
  }
  public async request(
    config: Partial<AxiosRequestConfig>,
    expiredTime: number = 0,
    retry: number = 0 /* 新增重试次数参数，默认不重试*/
  ) {
    const $config = mergeDeepRight(this._defaultConfig, config) as Partial<AxiosRequestConfig> // 合并默认配置和用户配置
    const expired = Math.abs(expiredTime)
    const hash = md5(JSON.stringify($config)) // 获取请求配置的哈希值
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
      return this._sendRequest($config, hash, expired, retry)
    }
  }
  private async _sendRequest(
    config: AxiosRequestConfig,
    hash?: string,
    expired: number = 0,
    retry: number = 0 /*新增重试次数参数*/
  ) {
    let retriesLeft = Math.min(retry, this._defaultConfig?.maxRetry ?? 9999)
    const attemptRequest: any = async () => {
      try {
        const res = await axios.request(config)
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
          return attemptRequest() // 递归调用以进行重试
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
  private _updateCache(hash: string, data: any, expired: number, status: PromiseStatus) {
    if (expired > 0) {
      const queue = this._queues[hash]
      if (queue) {
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
      }
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
  }
}
