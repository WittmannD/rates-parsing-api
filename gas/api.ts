const Api = {
  baseUrl: 'http://localhost:5000/api/',
  request(method: 'post' | 'get', path: string, data: Record<string, any>) {
    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: method,
      contentType: 'application/json',
    };
    let url = new URL(path, this.baseUrl).href;

    if (method === 'get') {
      url += '?' + new URLSearchParams(data);
    }

    if (method === 'post') {
      options.payload = data;
    }

    const response = UrlFetchApp.fetch(url, options);
    const status = response.getResponseCode();
    const content = response.getContentText('utf-8');

    if (status >= 400 || !content) {
      Logger.log(
        `Http request returns status ${status}.\n Input data: ${JSON.stringify(
          data,
          null,
          4,
        )}\n Response: ${response.getContentText('utf-8')}`,
      );
      throw `Request error. Status ${status}`;
    }

    return JSON.parse(content);
  },
};

export default Api;
