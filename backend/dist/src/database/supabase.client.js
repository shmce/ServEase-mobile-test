"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationClient = exports.trustClient = exports.paymentClient = exports.bookingClient = exports.providerClient = exports.identityClient = void 0;
exports.createServiceClient = createServiceClient;
const supabase_js_1 = require("@supabase/supabase-js");
const resilience_utils_1 = require("../common/utils/resilience.utils");
function createServiceClient(schema) {
    const client = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { db: { schema } });
    return new Proxy(client, {
        get(target, prop) {
            const original = target[prop];
            if (prop === 'from') {
                return (...args) => {
                    const query = original.apply(target, args);
                    return new Proxy(query, {
                        get(qTarget, qProp) {
                            const qOriginal = qTarget[qProp];
                            if (typeof qOriginal === 'function') {
                                return (...qArgs) => (0, resilience_utils_1.withResilience)(schema, () => qOriginal.apply(qTarget, qArgs));
                            }
                            return qOriginal;
                        },
                    });
                };
            }
            return original;
        },
    });
}
exports.identityClient = createServiceClient('identity_svc');
exports.providerClient = createServiceClient('provider_catalog_svc');
exports.bookingClient = createServiceClient('booking_svc');
exports.paymentClient = createServiceClient('payment_svc');
exports.trustClient = createServiceClient('trust_svc');
exports.notificationClient = createServiceClient('notification_svc');
//# sourceMappingURL=supabase.client.js.map