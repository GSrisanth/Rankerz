import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type ContestStatus = 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';
export type ContestType = 'exam' | 'coding_contest';
export type ScoringRule = 'latest_attempt' | 'best_attempt';
export type TieBreakingRule = 'earlier_submission' | 'fewest_attempts';

export interface IContest extends Document {
  title: string;
  description: string;
  contestType: ContestType;
  createdBy: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  status: ContestStatus;
  maxParticipants: number;
  maxScore: number;
  scorePrecision: number;
  scoringRule: ScoringRule;
  tieBreakingRule: TieBreakingRule;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContestSchema = new Schema<IContest>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      default: '',
    },
    contestType: {
      type: String,
      enum: ['exam', 'coding_contest'],
      default: 'coding_contest',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 60,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'live', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    maxParticipants: {
      type: Number,
      default: 500,
    },
    maxScore: {
      type: Number,
      required: true,
      default: 100,
    },
    scorePrecision: {
      type: Number,
      default: 0,
    },
    scoringRule: {
      type: String,
      enum: ['latest_attempt', 'best_attempt'],
      default: 'latest_attempt',
    },
    tieBreakingRule: {
      type: String,
      enum: ['earlier_submission', 'fewest_attempts'],
      default: 'earlier_submission',
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

ContestSchema.index({ status: 1, startTime: 1 });

export const Contest: Model<IContest> = mongoose.models.Contest || mongoose.model<IContest>('Contest', ContestSchema);
