import Helpers from './helpers';
import Caching from './caching';
import { Logger } from '@nestjs/common';

const Api = {
  seed: 'RYmh4iDdmY',
  baseUrl:
    'http://ec2-18-135-13-146.eu-west-2.compute.amazonaws.com:3000/api/parsing/',
  request(method: 'post' | 'get', path: string, data: Record<string, any>) {
    data = { ...data, seed: this.seed };

    const objectSig = Helpers.getObjectSig({ path, data });
    const cachedValue = Caching.get(objectSig);

    if (cachedValue) {
      Logger.log(`Returning cached value with key ${objectSig}`);
      return cachedValue;
    }

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: method,
      contentType: 'application/json',
    };
    let url = this.baseUrl + path;

    if (method === 'get') {
      url += '?' + Helpers.querystring(data);
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

    const responseData = JSON.parse(content);

    Caching.put(objectSig, responseData);

    return responseData;
  },
};

export default Api;
