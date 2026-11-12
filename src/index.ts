import { app } from './app';
import { env } from './lib/env';

app.listen(env.PORT, () => {
  console.log(`🦊 Personal API server running at http://localhost:${env.PORT}`);
  console.log(`📚 OpenAPI / Swagger documentation: http://localhost:${env.PORT}/docs`);
  console.log(`🩺 Health check endpoint: http://localhost:${env.PORT}${env.API_PREFIX}/health`);
});

export { app };
