import { CachingService } from './caching.service';
import { getArgumentsSig } from '../common/helpers';

export const TTLCache = (ttl?: number): MethodDecorator => {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function () {
      const cachingService: CachingService = this.cachingService;

      // eslint-disable-next-line prefer-rest-params
      const key = getArgumentsSig(arguments);

      if (await cachingService.has(key)) {
        return await cachingService.get(key);
      }

      // eslint-disable-next-line prefer-rest-params
      return originalMethod.apply(this, arguments).then((result: any) => {
        if (result !== undefined) cachingService.put(key, result, ttl);
        return result;
      });
    };

    return descriptor;
  };
};
