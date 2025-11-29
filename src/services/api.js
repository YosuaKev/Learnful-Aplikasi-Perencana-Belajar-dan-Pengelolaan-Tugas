const API_BASE_URL = (import.meta && import.meta.env && import.meta.env.VITE_API_URL) || ''

class ApiService {
  constructor() {
    this.token = localStorage.getItem('auth_token')
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body)
    }

    const response = await fetch(url, config)

    // Guard: only attempt to parse JSON if server returned JSON.
    const contentType = response.headers.get('content-type') || ''
    let result
    if (contentType.includes('application/json')) {
      result = await response.json()
    } else {
      // If the server returned HTML or plain text (common when API_BASE_URL is unset
      // and the dev server returns index.html), surface a clearer error instead
      const text = await response.text()
      throw new Error(`Non-JSON response from ${url}: ${text.slice(0, 200)}`)
    }

    if (!response.ok || (typeof result === 'object' && result.success === false)) {
      throw new Error(result.message || 'Request failed')
    }

    return result
  }

  // Task methods
  async getTasks(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString()
    return this.request(`/api/tasks?${queryParams}`)
  }

  async getTaskById(id) {
    return this.request(`/api/tasks/${id}`)
  }

  async createTask(taskData) {
    return this.request('/api/tasks', {
      method: 'POST',
      body: taskData
    })
  }

  async updateTask(id, taskData) {
    return this.request(`/api/tasks/${id}`, {
      method: 'PUT',
      body: taskData
    })
  }

  async deleteTask(id) {
    return this.request(`/api/tasks/${id}`, {
      method: 'DELETE'
    })
  }

  async updateTaskStatus(id, status) {
    return this.request(`/api/tasks/${id}/status`, {
      method: 'PATCH',
      body: { status }
    })
  }

  // Category methods
  async getCategories() {
    return this.request('/api/categories') 
  }
}

export const apiService = new ApiService()