import mongoose from 'mongoose';

/** Cuánto se conserva el registro de una corrida (el TTL borra el documento pasado este plazo). */
export const JOB_RUN_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/** Intentos máximos de una unidad por día local: pasado este tope el dispatcher deja de reintentarla. */
export const MAX_UNIT_ATTEMPTS = 3;

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
      enum: ['claimed', 'done', 'failed', 'exhausted'],
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
    // Veces que se reclamó la unidad (el insert inicial cuenta 1); tope: MAX_UNIT_ATTEMPTS
    attempts: {
      type: Number,
      default: 1,
    },
    // Último usuario cuyo lote terminó: una retomada de la unidad continúa después de este `_id`
    cursor: {
      type: mongoose.Schema.Types.ObjectId,
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
// Reintentos del dispatcher: unidades `failed`/`claimed` de los días locales vigentes
jobRunSchema.index({ localDate: 1, status: 1 });
jobRunSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const JobRun = mongoose.model('JobRun', jobRunSchema);
export default JobRun;
