import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Country } from '../country';

@ValidatorConstraint({ name: 'isUserAlreadyExist', async: true })
@Injectable()
export class IsAcceptableCountry implements ValidatorConstraintInterface {
  constructor(protected readonly configService: ConfigService) {}

  async validate(value: any) {
    const acceptableCountries = this.configService
      .get<string[]>('main.acceptableCountries')
      .map((name) => name.toLowerCase());

    return (
      value instanceof Country &&
      acceptableCountries.includes(value.code.toLowerCase())
    );
  }
}
