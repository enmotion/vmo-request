/*
 * @Author: enmotion
 * @Date: 2024-11-29 14:38:11
 * @Last Modified by: enmotion
 * @Last Modified time: 2024-11-29 15:04:49
 */
import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'

/* 自定义axios类
 *  该类封装后，简化了 API，仅仅只有 use 与 send 两个API
 *  此 axios 的二次封装，不同于常见的封装 request 实例的方式，而采用类似 koa onion 双向管道模式
 *  请求时的具体配置权重 依照： 请求时配置 > 接口默认配置 > Axios初始化配置的原则进行，既兼顾灵活，也方便统一管理
 *  send()
 */

// import axios from 'axios';
// import type { AxiosRequestConfig, AxiosResponse, AxiosInstance } from 'axios';
//@ts-ignore
import ModOnion from 'mod-onion'
import { mergeDeepRight, clone } from 'ramda'
import type ModAxiosType from '../types/index'
import type { Method } from 'axios'

export default class VmoRequest {
  // public readonly instance:AxiosInstance; // axios 实例引用
  public readonly baseConfig: ModAxiosType.BaseConfig // 基础配置
  private readonly onion: any = new ModOnion() // 引入洋葱皮管道模型
  // 构造方法
  constructor($config: ModAxiosType.BaseConfig) {
    // this.instance = axios.create($config.RequestAxiosBaseConfig);
    this.baseConfig = $config
  }
  private packageContext(
    api: ModAxiosType.RequestConfig,
    payload: any,
    requestConfig: ModAxiosType.BaseConfig = {}
  ): ModAxiosType.Context {
    // requestConfig > api.config > this.baseConfig;
    // console.log(api)
    var context: ModAxiosType.Context = mergeDeepRight(
      mergeDeepRight(this.baseConfig, {
        name: api.tips,
        keyname: api.keyname,
        axios: api.axios,
        config: api.config,
        payload: payload
      }),
      requestConfig
    ) as ModAxiosType.Context
    if (context.axios?.method) {
      context.axios.method = context.axios.method?.toUpperCase() as Method
    }
    // console.log(context,'sss')
    return context
  }
  public use(middleware: Function | Promise<Function>): void {
    // console.log(middleware)
    this.onion.use(middleware)
  }
  public send(api: ModAxiosType.RequestOption, payload: any = {}, config: ModAxiosType.BaseConfig = {}): Promise<any> {
    // 如果 api 为处理函数,则以 (payload,config) 为参数 交由 api 函数生成接口默认配置
    var apiconfig: ModAxiosType.RequestConfig =
      api.constructor == Function
        ? (api as ModAxiosType.RequestCreator)(payload, config)
        : clone(api as ModAxiosType.RequestConfig)
    // // 组装管道数据格式
    var context = this.packageContext(apiconfig, payload, config)
    // // 在请求时，组合管道，最后的请求方法并不放置在外部的中间件之中，在发送时组装
    return this.onion.pipingData(context, this.onion.middlewares).then((value: { response: any }) => {
      // console.log(value,222222);
      return value.response
    })
  }
}
