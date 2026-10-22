"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Visit = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const VisitSchema = new mongoose_1.Schema({
    visitorId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    ip: { type: String, required: true, index: true },
    country: { type: String, default: 'Unknown', index: true },
    countryCode: { type: String, default: 'XX' },
    region: { type: String, default: 'Unknown' },
    city: { type: String, default: 'Unknown', index: true },
    postalCode: { type: String, default: '' },
    latitude: { type: Number },
    longitude: { type: Number },
    timezone: { type: String, default: 'UTC' },
    isp: { type: String, default: 'Unknown' },
    org: { type: String, default: 'Unknown' },
    page: { type: String, required: true, index: true },
    fullUrl: { type: String, default: '' },
    referrer: { type: String, default: 'Direct' },
    browser: { type: String, default: 'Unknown' },
    os: { type: String, default: 'Unknown' },
    deviceType: { type: String, default: 'Desktop', index: true },
    screenResolution: { type: String, default: 'Unknown' },
    language: { type: String, default: 'en' },
    durationSeconds: { type: Number, default: 0 },
    isFirstVisit: { type: Boolean, default: true },
}, {
    timestamps: true,
});
// Compound indexes for analytics speed
VisitSchema.index({ createdAt: -1 });
VisitSchema.index({ country: 1, city: 1 });
VisitSchema.index({ page: 1, createdAt: -1 });
exports.Visit = mongoose_1.default.model('Visit', VisitSchema);
