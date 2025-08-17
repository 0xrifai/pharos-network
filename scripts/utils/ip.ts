import "dotenv/config"

interface FetchResponse {
  status: number
  headers: Record<string, string>
  body: string
}

async function fetchWithAxios(
    url: string, 
    config: any = {},
    headers: Record<string, string> = {},
    method: string = "GET"
): Promise<FetchResponse> {
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: config.body || null,
      signal: AbortSignal.timeout(10000)
    })
    
    const body = await response.text()
    
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body
    }
  } catch (error) {
    throw new Error(`Failed to fetch: ${error}`)
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS"
interface FetchOption {
  url:string,
  method?: HttpMethod,
  headers?: Record<string, string>,
  body?: string | Buffer | null,
  proxyUrl?: string
}

async function fetchExternalAPI({
  url,
  method = "GET",
  headers = {},
  body = null,
  proxyUrl = ""
}: FetchOption): Promise<FetchResponse> {
  try {
    const fetchOptions: any = {
      method,
      headers,
      body: body as string | null,
      signal: AbortSignal.timeout(30000) // Increased timeout to 30 seconds
    }

    // Add proxy support if proxyUrl is provided
    if (proxyUrl) {
      try {
        const { HttpsProxyAgent } = require('https-proxy-agent')
        fetchOptions.agent = new HttpsProxyAgent(proxyUrl)
      } catch (error) {
        console.warn('Proxy agent not available, proceeding without proxy')
      }
    }

    const response = await fetch(url, fetchOptions)
    
    const responseBody = await response.text()
    
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseBody,
    }
  } catch (error) {
    throw new Error(`Failed to fetch: ${error}`)
  }
}

async function fetchWithUndici({
  url,
  method = "GET",
  headers = {},
  body = null
}:FetchOption): Promise<FetchResponse> {
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body as string | null,
      signal: AbortSignal.timeout(60000) // Increased timeout to 60 seconds like original
    })
    
    const responseBody = await response.text()
    
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseBody,
    }

  } catch (error) {
    throw new Error(`Failed to fetch: ${error}`)
  }
}

export {
    fetchWithAxios,
    fetchWithUndici,
    fetchExternalAPI
}