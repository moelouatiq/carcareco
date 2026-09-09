const basePath = '/api/backend'

const dataPage = ({
  resourceName,
  searchText,
  whenReady,
  onFailure,
}: {
  resourceName: string
  searchText: string
  whenReady: IOnQuerySuccess
  onFailure: IOnQueryFailure
}) => {
  const url =
    resourceName +
    '/page?' +
    new URLSearchParams({
      orderby: 'id',
      searchText,
      limit: '20',
      offset: '0',
    })
  query({
    url,
    method: 'GET',
    onSuccess: (result) => {
      whenReady(result.items ?? [])
    },
    onFailure,
  })
}

export interface IOnQuerySuccess {
  (json: any): void // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface IOnQueryFailure {
  ({
    url,
    status,
    text,
  }: {
    url: string
    status?: number | undefined
    text: string
  }): void
}

const query = ({
  url,
  method,
  body,
  onSuccess,
  onFailure,
}: {
  url: string
  method: string
  body?: any | null // eslint-disable-line @typescript-eslint/no-explicit-any
  onSuccess: IOnQuerySuccess
  onFailure: IOnQueryFailure
}) => {
  const safePath = url.split('?', 1)[0]
  const requestBody = body ? JSON.stringify(body) : undefined

  fetch(`${basePath}/${url}`, {
    method,
    body: requestBody,
    headers: { 'Content-Type': 'application/json' },
  })
    .then(async (response) => {
      if (response.ok) {
        onSuccess(await response.json())
        return
      }

      onFailure({
        url: safePath,
        status: response.status,
        text: 'API request failed',
      })
    })
    .catch(() => {
      onFailure({
        url: safePath,
        text: 'API request failed',
      })
    })
}

export { dataPage, query }
