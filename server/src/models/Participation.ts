import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IParticipation extends Document {
  contestId: Types.ObjectId;
  studentId: Types.ObjectId;
  currentScore: number;
  bestScore: number;
  attemptsCount: number;
  latestSubmissionId?: Types.ObjectId;
  participationStatus: 'registered' | 'in_progress' | 'submitted' | 'disqualified';
  registeredAt: Date;
  lastUpdatedAt: Date;
}

const ParticipationSchema = new Schema<IParticipation>(
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
    currentScore: {
      type: Number,
      required: true,
      default: 0,
    },
    bestScore: {
      type: Number,
      required: true,
      default: 0,
    },
    attemptsCount: {
      type: Number,
      required: true,
      default: 0,
    },
    latestSubmissionId: {
      type: Schema.Types.ObjectId,
      ref: 'Submission',
    },
    participationStatus: {
      type: String,
      enum: ['registered', 'in_progress', 'submitted', 'disqualified'],
      default: 'registered',
      index: true,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index: One participation record per student per contest
ParticipationSchema.index({ contestId: 1, studentId: 1 }, { unique: true });
ParticipationSchema.index({ contestId: 1, currentScore: -1 });

export const Participation: Model<IParticipation> =
  mongoose.models.Participation || mongoose.model<IParticipation>('Participation', ParticipationSchema);
