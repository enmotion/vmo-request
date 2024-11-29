import type { AxiosRequestConfig, AxiosResponse, BrowserProgressEvent } from 'axios'
declare namespace ModAxiosType {
  type RequestConfig = { tips?: string; keyname?: string; axios: AxiosRequestConfig; config?: any }
  type RequestCreator = (payload: any, config?: ModAxiosType.BaseConfig) => RequestConfig
  type RequestOption = RequestConfig | RequestCreator
  type MiddlewareConfig = { [key: string]: any }
  interface Context {
    name: string
    keyname: string
    payload: any
    axios: AxiosRequestConfig
    config?: MiddlewareConfig
    response?: AxiosResponse // 返回数据
  }
  // 基础配置
  interface BaseConfig {
    axios?: AxiosRequestConfig // axios请求实例配置
    config?: MiddlewareConfig // 请求时中间件相关属性配置
  }
}
export default ModAxiosType
