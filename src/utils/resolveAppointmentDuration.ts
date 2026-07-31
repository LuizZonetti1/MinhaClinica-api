interface ResolveAppointmentDurationParams {
  professionalDefaultDuration: number;
  procedureDefaultDuration?: number | null;
  customDuration?: number | null;
}

/**
 * Prioridade: ProfessionalProcedure.customDuration > Procedure.defaultDuration >
 * Professional.defaultAppointmentDuration. Sem procedimento, o comportamento é
 * idêntico ao anterior (usa só a duração padrão do profissional).
 */
export const resolveAppointmentDuration = ({
  professionalDefaultDuration,
  procedureDefaultDuration,
  customDuration,
}: ResolveAppointmentDurationParams): number => {
  if (customDuration != null) return customDuration;
  if (procedureDefaultDuration != null) return procedureDefaultDuration;
  return professionalDefaultDuration;
};
