import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe.js';

describe('ZodValidationPipe', () => {
  const schema = z.object({ name: z.string().min(2) });
  const pipe = new ZodValidationPipe(schema);

  it('returns the parsed value for valid input', () => {
    expect(pipe.transform({ name: 'Ok' })).toEqual({ name: 'Ok' });
  });

  it('throws BadRequestException for invalid input', () => {
    expect(() => pipe.transform({ name: 'x' })).toThrow(BadRequestException);
  });
});
