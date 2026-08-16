import * as yup from "yup";
import { DocumentType } from "../types/enums";

const req = (label: string) =>
  yup
    .string()
    .trim()
    .min(1, `${label} é obrigatório`)
    .required(`${label} é obrigatório`);

const hasValidMedication = (items: unknown): boolean =>
  Array.isArray(items) &&
  items.some(
    (m) =>
      typeof m === "object" &&
      m !== null &&
      typeof (m as { name?: unknown }).name === "string" &&
      (m as { name: string }).name.trim() !== "" &&
      typeof (m as { dosage?: unknown }).dosage === "string" &&
      (m as { dosage: string }).dosage.trim() !== "",
  );

const medicationsSchema = yup
  .array()
  .test(
    "has-valid-medication",
    "Adicione ao menos um medicamento com nome e dosagem",
    hasValidMedication,
  );

const CONTROLLED_MEDICATION_REQUIRED_FIELDS = [
  "name",
  "dosage",
  "frequency",
  "duration",
  "quantity",
] as const;

/**
 * A UI (MedicationItemFields) sempre marcou frequency/duration/quantity com
 * asterisco de obrigatório para Receita Controlada, mas a validação real
 * (aqui e no espelho do frontend) só exigia name+dosage — só 4 dos "7 campos
 * ANVISA" eram de fato barrados. Exige todos os medicamentos completos (não
 * basta um, diferente de medicationsSchema) por ser o único tipo de
 * documento com bloqueio duro de finalização.
 */
const hasCompleteControlledMedication = (items: unknown): boolean =>
  Array.isArray(items) &&
  items.length > 0 &&
  items.every(
    (m) =>
      typeof m === "object" &&
      m !== null &&
      CONTROLLED_MEDICATION_REQUIRED_FIELDS.every(
        (field) =>
          typeof (m as Record<string, unknown>)[field] === "string" &&
          ((m as Record<string, unknown>)[field] as string).trim() !== "",
      ),
  );

const controlledMedicationsSchema = yup
  .array()
  .test(
    "has-complete-controlled-medication",
    "Preencha nome, dosagem, frequência, duração e quantidade de todos os medicamentos",
    hasCompleteControlledMedication,
  );

const clinicalReportSchema = yup
  .object()
  .test(
    "anamnesis-or-diagnosis",
    "Preencha a queixa principal ou a hipótese diagnóstica",
    (value) =>
      Boolean((value as { anamnesis?: string })?.anamnesis?.trim()) ||
      Boolean((value as { diagnosis?: string })?.diagnosis?.trim()),
  );

const certificateSchema = yup.object({
  daysOfRest: yup
    .number()
    .nullable()
    .min(1, "Dias de afastamento deve ser ao menos 1")
    .required("Dias de afastamento é obrigatório"),
  startDate: req("Data de início"),
});

const attendanceDeclarationSchema = yup.object({
  declarationType: req("Tipo de declaração"),
  attendanceDate: req("Data do atendimento"),
});

const prescriptionSchema = yup.object({
  medications: medicationsSchema,
});

const controlledPrescriptionSchema = yup.object({
  medications: controlledMedicationsSchema,
  notificationNumber: req("Número de notificação"),
  patientAddress: req("Endereço do paciente"),
});

const examRequestSchema = yup.object({
  exams: yup
    .array()
    .test(
      "has-valid-exam",
      "Adicione ao menos um exame com nome",
      (items) =>
        Array.isArray(items) &&
        items.some(
          (e) =>
            typeof e === "object" &&
            e !== null &&
            typeof (e as { name?: unknown }).name === "string" &&
            (e as { name: string }).name.trim() !== "",
        ),
    ),
});

const referralSchema = yup.object({
  referredTo: req("Especialidade de destino"),
  reason: req("Motivo do encaminhamento"),
});

const medicalReportSchema = yup.object({
  findings: req("Histórico e achados clínicos"),
  conclusion: req("Conclusão"),
});

const treatmentPlanSchema = yup.object({
  diagnosis: req("Diagnóstico"),
  interventions: yup
    .array()
    .test(
      "has-valid-intervention",
      "Adicione ao menos uma intervenção com descrição",
      (items) =>
        Array.isArray(items) &&
        items.some(
          (i) =>
            typeof i === "object" &&
            i !== null &&
            typeof (i as { description?: unknown }).description === "string" &&
            (i as { description: string }).description.trim() !== "",
        ),
    ),
});

const consentFormSchema = yup.object({
  patientAcknowledged: yup
    .boolean()
    .oneOf([true], "Confirme a ciência do paciente")
    .required("Confirme a ciência do paciente"),
  procedureName: req("Nome do procedimento"),
});

const budgetSchema = yup.object({
  patientAcknowledged: yup
    .boolean()
    .oneOf([true], "Confirme a ciência do paciente")
    .required("Confirme a ciência do paciente"),
  items: yup
    .array()
    .test(
      "has-valid-item",
      "Adicione ao menos um item com descrição",
      (items) =>
        Array.isArray(items) &&
        items.some(
          (i) =>
            typeof i === "object" &&
            i !== null &&
            typeof (i as { description?: unknown }).description === "string" &&
            (i as { description: string }).description.trim() !== "",
        ),
    ),
});

export const DOCUMENT_CONTENT_SCHEMAS: Partial<Record<DocumentType, yup.AnySchema>> = {
  [DocumentType.CLINICAL_REPORT]: clinicalReportSchema,
  [DocumentType.CERTIFICATE]: certificateSchema,
  [DocumentType.ATTENDANCE_DECLARATION]: attendanceDeclarationSchema,
  [DocumentType.PRESCRIPTION]: prescriptionSchema,
  [DocumentType.CONTROLLED_PRESCRIPTION]: controlledPrescriptionSchema,
  [DocumentType.EXAM_REQUEST]: examRequestSchema,
  [DocumentType.REFERRAL]: referralSchema,
  [DocumentType.MEDICAL_REPORT]: medicalReportSchema,
  [DocumentType.TREATMENT_PLAN]: treatmentPlanSchema,
  [DocumentType.CONSENT_FORM]: consentFormSchema,
  [DocumentType.BUDGET]: budgetSchema,
};

/** Tipos que NÃO aceitam finalização incompleta, nem com confirmação. */
export const NO_OVERRIDE_TYPES: DocumentType[] = [DocumentType.CONTROLLED_PRESCRIPTION];
