import mongoose, { Schema, Document } from 'mongoose';

export interface IInquiry extends Document {
  inquiryId: string;
  name: string;
  email: string;
  company?: string;
  projectType: string;
  budget: string;
  timeline: string;
  description: string;
  status: 'New' | 'Reviewed' | 'Contacted' | 'Archived';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InquirySchema: Schema = new Schema(
  {
    inquiryId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, index: true },
    company: { type: String, default: '' },
    projectType: { type: String, required: true, index: true },
    budget: { type: String, default: 'Not specified' },
    timeline: { type: String, default: 'Flexible' },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['New', 'Reviewed', 'Contacted', 'Archived'],
      default: 'New',
      index: true,
    },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

InquirySchema.index({ createdAt: -1 });

export const Inquiry = mongoose.model<IInquiry>('Inquiry', InquirySchema);
