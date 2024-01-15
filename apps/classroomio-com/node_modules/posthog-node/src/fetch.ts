import axios from 'axios'
import { PostHogFetchOptions, PostHogFetchResponse } from 'posthog-core/src'

// NOTE: We use axios as a reliable, well supported request library but follow the Fetch API (roughly)
// So that alternative implementations can be used if desired
export const fetch = async (url: string, options: PostHogFetchOptions): Promise<PostHogFetchResponse> => {
  const res = await axios.request({
    url,
    headers: options.headers,
    method: options.method.toLowerCase(),
    data: options.body,
    signal: options.signal,
    // fetch only throws on network errors, not on HTTP errors
    validateStatus: () => true,
  })

  return {
    status: res.status,
    text: async () => res.data,
    json: async () => res.data,
  }
}
