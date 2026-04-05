"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvidersService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
let ProvidersService = class ProvidersService {
    constructor(db) {
        this.db = db;
    }
    async getAllProviders() {
        try {
            const client = this.db.getClient();
            const { data, error } = await client
                .from('provider_profiles')
                .select(`
          id,
          user_id,
          rating,
          total_reviews,
          service_areas,
          user_profiles(id, full_name, bio, avatar_url)
        `)
                .order('rating', { ascending: false });
            if (error) {
                throw error;
            }
            return {
                success: true,
                data: data || [],
                count: data?.length || 0,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                data: [],
            };
        }
    }
    async getProviderById(providerId) {
        try {
            const client = this.db.getClient();
            const { data, error } = await client
                .from('provider_profiles')
                .select(`
          *,
          user_profiles(*),
          services(*)
        `)
                .eq('id', providerId)
                .single();
            if (error) {
                throw error;
            }
            return {
                success: true,
                data,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async getProvidersByCategory(category) {
        try {
            const client = this.db.getClient();
            const { data, error } = await client
                .from('services')
                .select(`
          *,
          provider_profiles(
            id,
            rating,
            total_reviews,
            user_profiles(full_name, bio)
          )
        `)
                .eq('category', category)
                .order('provider_profiles(rating)', { ascending: false });
            if (error) {
                throw error;
            }
            return {
                success: true,
                data: data || [],
                count: data?.length || 0,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                data: [],
            };
        }
    }
};
exports.ProvidersService = ProvidersService;
exports.ProvidersService = ProvidersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], ProvidersService);
//# sourceMappingURL=providers.service.js.map