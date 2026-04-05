"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
    const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
    if (missingEnvVars.length > 0) {
        console.error('❌ ERROR: Missing required environment variables:', missingEnvVars.join(', '));
        console.error('   Create backend/.env with these values');
        process.exit(1);
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: process.env.NODE_ENV === 'production'
            ? ['https://yourdomain.com']
            : ['http://localhost:3000', 'http://localhost:19000', 'http://localhost:19001', 'http://127.0.0.1:19000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`
╔════════════════════════════════════════╗
║   ServEase API Running Successfully   ║
╚════════════════════════════════════════╝
  
  🚀 Server: http://localhost:${port}
  🏥 Health: http://localhost:${port}/health
  🗄️  Database: ${process.env.SUPABASE_URL}
  📊 Environment: ${process.env.NODE_ENV || 'development'}

  Ready to accept requests!
  `);
}
bootstrap().catch((error) => {
    console.error('❌ Bootstrap failed:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map