// Compile against the published declarations, not source aliases.
import { VmoRequest } from '../dist/index'
import type { RequestProps } from '../dist/index'
import type { AxiosRequestConfig, AxiosInstance } from 'axios'

const axiosConfig: Partial<AxiosRequestConfig> = { baseURL: '/api' }
const client = new VmoRequest(axiosConfig)
const configured = new VmoRequest({ ...axiosConfig, maxRetry: 3 }, true)
const instance: AxiosInstance | null = configured.instance
const updated: boolean = configured.setDefaultConfig({ timeout: 1000, maxRetry: 5 })
const defaults: Partial<AxiosRequestConfig> = configured.getDefaultConfig()
const request: RequestProps<{ auth: boolean }> = {
  key: 'users', axiosConfig: { url: '/users' }, middlConfig: { auth: true }, expiredTime: 1000, retry: 2
}
const legacyCall: Promise<any> = client.request({ url: '/users' })
const cachedCall: Promise<any> = client.request({ url: '/users' }, 1000, 3, 100)
const independentCall: Promise<any> = client.request({ url: '/users' }, -1)
// Response interceptors historically allow application-defined return shapes.
const applicationData: Promise<{ users: string[] }> = client.request({ url: '/users' })
void [instance, updated, defaults, request, legacyCall, cachedCall, independentCall, applicationData]
