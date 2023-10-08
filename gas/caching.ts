const Caching = {
  cache: CacheService.getDocumentCache(),

  get(key: string) {
    const objString = this.cache.get(key);
    return JSON.parse(objString);
  },

  put(key: string, obj: Record<any, any>) {
    const objString = JSON.stringify(obj);
    return this.cache.put(key, objString, 60 * 60 * 4); // = 4 hours
  },

  remove(key: string) {
    return this.cache.remove(key);
  },
};

export default Caching;
