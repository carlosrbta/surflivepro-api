import { BadRequestException, type PipeTransform } from '@nestjs/common';
import { z } from 'zod';

export class ZodValidationPipe<
  T extends z.ZodTypeAny,
> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.infer<T> {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }

    return result.data;
  }
}
