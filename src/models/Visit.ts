import mongoose, { Schema, Document } from 'mongoose';

export interface IVisit extends Document {
  visitorId: string;
  sessionId: string;
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  page: string;
  fullUrl?: string;
  referrer?: string;
  browser?: string;
  os?: string;
  deviceType?: string;
  screenResolution?: string;
  language?: string;
  durationSeconds?: number;
  isFirstVisit?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VisitSchema: Schema = new Schema(
  {
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
  },
  {
    timestamps: true,
  }
);

// Compound indexes for analytics speed
VisitSchema.index({ createdAt: -1 });
VisitSchema.index({ country: 1, city: 1 });
VisitSchema.index({ page: 1, createdAt: -1 });

export const Visit = mongoose.model<IVisit>('Visit', VisitSchema);
