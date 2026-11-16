import { t, type Static } from 'elysia';

export const registerBodySchema = t.Object({
  username: t.String({
    minLength: 2,
    maxLength: 50,
    error: 'Username must be between 2 and 50 characters',
  }),
  email: t.String({
    format: 'email',
    error: 'Valid email address is required',
  }),
  password: t.String({
    minLength: 6,
    maxLength: 100,
    error: 'Password must be at least 6 characters long',
  }),
});

export const loginBodySchema = t.Object({
  email: t.String({
    format: 'email',
    error: 'Valid email address is required',
  }),
  password: t.String({
    minLength: 1,
    error: 'Password is required',
  }),
});

export type RegisterInput = Static<typeof registerBodySchema>;
export type LoginInput = Static<typeof loginBodySchema>;
