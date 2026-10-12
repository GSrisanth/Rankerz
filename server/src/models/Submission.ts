import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface ISubmission extends Document {
  contestId: Types.ObjectId;
  studentId: Types.ObjectId;
  score: number;
  maximumScore: number;
  percentage: number;
  correctAnswers?: number;
  incorrectAnswers?: number;
  completionTimeMs: number;
  attemptNumber: number;
  status: 'evaluated' | 'pending' | 'flagged';
  idempotencyKey?: string;
  evaluatedBy?: Types.ObjectId;
  metadata?: Record<string, any>;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    contestId: {
      type: Schema.Types.ObjectId,
      ref: 'Contest',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    maximumScore: {
      type: Number,
      required: true,
      min: 1,
      default: 100,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    incorrectAnswers: {
      type: Number,
      default: 0,
    },
    completionTimeMs: {
      type: Number,
      default: 0,
    },
    attemptNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    status: {
      type: String,
      enum: ['evaluated', 'pending', 'flagged'],
      default: 'evaluated',
      index: true,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    evaluatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for analytical queries and student history
SubmissionSchema.index({ contestId: 1, studentId: 1, submittedAt: -1 });
SubmissionSchema.index({ contestId: 1, score: -1 });

export const Submission: Model<ISubmission> =
  mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);
