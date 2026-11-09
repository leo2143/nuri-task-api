import mongoose from 'mongoose';

/** Cuánto se conserva el registro de una corrida (el TTL borra el documento pasado este plazo). */
export const JOB_RUN_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Registro de corridas del dispatcher: una unidad de trabajo = (job, zona, día local).
 * El índice único es lo que impide que dos invocaciones procesen la misma unidad a la vez.
 * `timezone` guarda la clave canónica de la zona, o `'global'` para los jobs que no dependen de una zona.
 */
const jobRunSchema = new mongoose.Schema(
  {
    job: {
      type: String,
      required: true,
    },
    timezone: {
      type: String,
      required: true,
    },
    localDate: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['claimed', 'done', 'failed'],
    },
    claimedAt: {
      type: Date,
      required: true,
    },
    finishedAt: {
      type: Date,
      default: null,
    },
    durationMs: {
      type: Number,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

jobRunSchema.index({ job: 1, timezone: 1, localDate: 1 }, { unique: true });
jobRunSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const JobRun = mongoose.model('JobRun', jobRunSchema);
export default JobRun;
