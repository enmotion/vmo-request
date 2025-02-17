# vmo-request

`VmoRequest` is a request utility class based on Axios, designed to provide features such as caching, state management, and configuration merging. It is particularly suitable for scenarios where the same requests need to be frequently made in an application, as the caching mechanism can effectively reduce server load and improve application performance.

### Features

- **Caching Mechanism**: By hashing request configurations with MD5, it caches request results to avoid duplicate requests.
- **Retry Mechanism**: To handle network or API instability, you can set a retry mechanism to improve request success rates.
- **State Management**: It supports three state management options: PENDING, FULFILLED, and REJECTED, ensuring consistency in request states.
- **Configuration Merging**: It merges default configurations with user configurations using the `mergeDeepRight` method to prevent configuration overriding issues.
- **Expiration Time**: It supports setting cache expiration times, automatically clearing expired caches.

### Installation

```nodejs
npm install axios ramda md5
```

### Usage Example

```javascript
import VmoRequest from './VmoRequest'
import axios from 'axios'

const vmoRequest = new VmoRequest({
  baseURL: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json'
  }
})

async function fetchData() {
  try {
    const response = await vmoRequest.request(
      {
        url: '/data',
        method: 'get'
      },
      1000 * 2, // Cache for 2 seconds
      3 // Retry 3 times, total 4 requests
    )
    console.log(response.data)
  } catch (error) {
    console.error(error)
  }
}
fetchData() // Initiate the request
fetchData() // Enter the waiting queue
fetchData() // Enter the waiting queue
fetchData() // Enter the waiting queue
setTimeout(() => {
  fetchData() // Enter the waiting queue or directly get the cached result if the data has been returned
}, 1000 * 1)
// In the end, only one request will be truly initiated. If it fails, it will retry 3 times. When the result is finally returned, it will be distributed to subsequent requests.

setTimeout(() => {
  fetchData() // The cache will expire and a new request will be initiated
}, 1000 * 10)
```

### API Documentation

VmoRequest Class
Constructor

```javascript
const vmoRequest = new VmoRequest({
  baseURL: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json'
  }
})
console.log(!!vmRequest.instance) // false

// Build mode for generating instances
const vmoRequest = new VmoRequest(
  {
    baseURL: 'https://api.example.com',
    headers: {
      'Content-Type': 'application/json'
    }
  },
  true
)
console.log(!!vmRequest.instance) // true

vmoRequest.instance // The created axios instance
```

- **new VmoRequest(config, createInstance) Parameters**:
  - **config**: Default configuration.
  - **createInstance**: Boolean indicating whether to create an accompanying axios instance, default is false.

`getDefaultConfig` Method

```javascript
vmoRequest.getDefaultConfig() // Partial<AxiosRequestConfig>
```

- **Return Value**:
  - Returns the current default configuration.。

`setDefaultConfig` Method

```javascript
vmoRequest.setDefaultConfig(config: Partial<AxiosRequestConfig>): boolean
```

- **Parameters**:
  - **config**: The new default configuration.
- **Return Value**:
  - **Returns** true if the configuration update is successful.。

`request` Method

```javascript
vmoRequest.request(config: Partial<AxiosRequestConfig>, expiredTime: number = 0, retryTimes:number=0): Promise<any>
```

- **Parameters**:
  - **config**: User’s Axios configuration.
  - **expiredTime**: Cache expiration time (in milliseconds), default is 0 (no caching). However, requests initiated in the same event loop will still be merged, unless set to -1, in which case they will be treated as normal requests to handle certain special scenarios.
  - **retryTimes**: The number of retries, with a default value of 0 (no retries. There is a limit, and the maximum value cannot exceed 9).
  - **retryDelay**: The delay for retrying, with a default value of 0 (retry immediately after failure, unit: milliseconds).
- Return Value:
  - **Returns** a Promise that resolves to the request response data or rejects with error data.
