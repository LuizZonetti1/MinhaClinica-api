import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { prisma } from "../../database/prisma";
import { type AppointmentStatus, TransactionType } from "../../types/enums";
import { CONSULTATION_EXCLUDED_STATUSES } from "../../utils/appointmentStatusRules";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";
const MAX_RANGE_DAYS = 366;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_LIST_ROWS = 220;

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const PAGE_MARGIN_X = 36;
const PAGE_MARGIN_TOP = 24;
const PAGE_MARGIN_BOTTOM = 32;
const PAGE_CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN_X * 2;
const PAGE_HEADER_HEIGHT = 72;

const COLOR_PRIMARY: [number, number, number] = [0.137, 0.235, 0.498];
const COLOR_TEXT: [number, number, number] = [0.102, 0.129, 0.173];
const COLOR_MUTED: [number, number, number] = [0.373, 0.431, 0.51];
const COLOR_WHITE: [number, number, number] = [1, 1, 1];
const COLOR_BORDER: [number, number, number] = [0.839, 0.871, 0.91];
const COLOR_HEADER_BG: [number, number, number] = [0.922, 0.957, 1];
const COLOR_ROW_ALT: [number, number, number] = [0.973, 0.98, 0.992];
const COLOR_CARD_BG: [number, number, number] = [0.98, 0.984, 0.992];

type ReportExportAppointment = {
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  type: string;
  patientName: string;
  professionalName: string;
};

type ReportExportFinancialRecord = {
  referenceDate: Date;
  type: TransactionType;
  amount: number;
  title: string;
  category: string | null;
  paymentStatus: string;
};

type ReportExportSummary = {
  consultationsCount: number;
  cancellationsCount: number;
  totalRevenue: number;
  totalExpense: number;
  estimatedProfit: number;
};

type ReportExportData = {
  clinicName: string;
  startDate: string;
  endDate: string;
  generatedAt: Date;
  summary: ReportExportSummary;
  appointments: ReportExportAppointment[];
  financialRecords: ReportExportFinancialRecord[];
};

type PdfFont = "F1" | "F2";
type PdfAlign = "left" | "center" | "right";

type PdfPage = {
  commands: string[];
  cursorTop: number;
};

type TableColumn<T> = {
  key: keyof T;
  label: string;
  width: number;
  align?: PdfAlign;
};

const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  WAITING: "Aguardando",
  IN_PROGRESS: "Em atendimento",
  COMPLETED: "Concluida",
  COMPLETED_WITH_ADDENDUM: "Concluida com adendo",
  CANCELLED: "Cancelada",
  NO_SHOW: "Nao compareceu",
  RESCHEDULED: "Reagendada",
};

const TRANSACTION_TYPE_LABEL: Record<TransactionType, string> = {
  INCOME: "Entrada",
  EXPENSE: "Saida",
};

const APPOINTMENT_TYPE_LABEL: Record<string, string> = {
  CONSULTATION: "Consulta",
  FIRST_CONSULTATION: "Primeira consulta",
  RETURN: "Retorno",
  ROUTINE: "Rotina",
  EXAM: "Exame",
  EMERGENCY: "Urgencia",
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

export class ReportExportValidationError extends Error {}

const normalizeAscii = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?");

const escapePdfText = (value: string): string =>
  normalizeAscii(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const formatDateLabel = (value: Date): string =>
  dayjs(value).tz(DEFAULT_TIMEZONE).format("DD/MM/YYYY");

const formatDateTimeLabel = (value: Date): string =>
  dayjs(value).tz(DEFAULT_TIMEZONE).format("DD/MM/YYYY HH:mm:ss");

const formatCurrency = (value: number): string => {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}R$ ${abs.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const buildPdfBufferFromPages = (pages: PdfPage[]): Buffer => {
  const pageCount = pages.length;
  const fontRegularObjectId = 3 + pageCount * 2;
  const fontBoldObjectId = fontRegularObjectId + 1;

  const objects: Array<{ id: number; body: string }> = [];

  objects.push({
    id: 1,
    body: "<< /Type /Catalog /Pages 2 0 R >>",
  });

  const pageRefs = Array.from({ length: pageCount }, (_, index) => `${3 + index * 2} 0 R`).join(
    " ",
  );
  objects.push({
    id: 2,
    body: `<< /Type /Pages /Kids [${pageRefs}] /Count ${pageCount} >>`,
  });

  for (let index = 0; index < pageCount; index += 1) {
    const pageId = 3 + index * 2;
    const contentId = pageId + 1;
    const stream = pages[index].commands.join("\n");
    const length = Buffer.byteLength(stream, "ascii");

    objects.push({
      id: pageId,
      body: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegularObjectId} 0 R /F2 ${fontBoldObjectId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    });

    objects.push({
      id: contentId,
      body: `<< /Length ${length} >>\nstream\n${stream}\nendstream`,
    });
  }

  objects.push({
    id: fontRegularObjectId,
    body: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  });

  objects.push({
    id: fontBoldObjectId,
    body: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  });

  objects.sort((left, right) => left.id - right.id);

  let pdf = "%PDF-1.4\n";
  const offsets: Record<number, number> = {};

  for (const object of objects) {
    offsets[object.id] = Buffer.byteLength(pdf, "ascii");
    pdf += `${object.id} 0 obj\n${object.body}\nendobj\n`;
  }

  const maxObjectId = objects[objects.length - 1]?.id ?? 0;
  const startXref = Buffer.byteLength(pdf, "ascii");

  pdf += `xref\n0 ${maxObjectId + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let id = 1; id <= maxObjectId; id += 1) {
    const offset = offsets[id] ?? 0;
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${maxObjectId + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;

  return Buffer.from(pdf, "ascii");
};

class ProfessionalPdfBuilder {
  private readonly pages: PdfPage[] = [];
  private readonly reportTitle: string;
  private readonly reportSubtitle: string;

  constructor(reportTitle: string, reportSubtitle: string) {
    this.reportTitle = reportTitle;
    this.reportSubtitle = reportSubtitle;
    this.addPage();
  }

  private get currentPage(): PdfPage {
    return this.pages[this.pages.length - 1];
  }

  private toPdfY(top: number, fontSize = 0): number {
    return PAGE_HEIGHT - top - fontSize;
  }

  private command(page: PdfPage, value: string): void {
    page.commands.push(value);
  }

  private addPage(): void {
    const page: PdfPage = {
      commands: [],
      cursorTop: PAGE_MARGIN_TOP,
    };

    this.pages.push(page);
    this.drawPageHeader(page);
  }

  private ensureSpace(height: number): void {
    const availableBottom = PAGE_HEIGHT - PAGE_MARGIN_BOTTOM;
    if (this.currentPage.cursorTop + height > availableBottom) {
      this.addPage();
    }
  }

  private drawRect(
    page: PdfPage,
    x: number,
    top: number,
    width: number,
    height: number,
    options?: {
      fill?: [number, number, number];
      stroke?: [number, number, number];
      lineWidth?: number;
    },
  ): void {
    const y = this.toPdfY(top, height);
    const hasFill = Boolean(options?.fill);
    const hasStroke = Boolean(options?.stroke);

    this.command(page, "q");

    if (options?.lineWidth) {
      this.command(page, `${options.lineWidth} w`);
    }

    if (options?.fill) {
      this.command(page, `${options.fill[0]} ${options.fill[1]} ${options.fill[2]} rg`);
    }

    if (options?.stroke) {
      this.command(page, `${options.stroke[0]} ${options.stroke[1]} ${options.stroke[2]} RG`);
    }

    this.command(page, `${x} ${y} ${width} ${height} re`);

    if (hasFill && hasStroke) {
      this.command(page, "B");
    } else if (hasFill) {
      this.command(page, "f");
    } else if (hasStroke) {
      this.command(page, "S");
    }

    this.command(page, "Q");
  }

  private drawLine(
    page: PdfPage,
    x1: number,
    top1: number,
    x2: number,
    top2: number,
    color: [number, number, number],
    width = 1,
  ): void {
    const y1 = this.toPdfY(top1);
    const y2 = this.toPdfY(top2);

    this.command(page, "q");
    this.command(page, `${width} w`);
    this.command(page, `${color[0]} ${color[1]} ${color[2]} RG`);
    this.command(page, `${x1} ${y1} m`);
    this.command(page, `${x2} ${y2} l`);
    this.command(page, "S");
    this.command(page, "Q");
  }

  private estimateTextWidth(text: string, fontSize: number, font: PdfFont): number {
    const factor = font === "F2" ? 0.56 : 0.52;
    return normalizeAscii(text).length * fontSize * factor;
  }

  private truncateToWidth(text: string, width: number, fontSize: number, font: PdfFont): string {
    const normalized = normalizeAscii(text);
    if (!normalized) return "";

    const maxChars = Math.max(1, Math.floor(width / (fontSize * (font === "F2" ? 0.56 : 0.52))));
    if (normalized.length <= maxChars) return normalized;
    if (maxChars <= 3) return normalized.slice(0, maxChars);
    return `${normalized.slice(0, maxChars - 3)}...`;
  }

  private drawText(
    page: PdfPage,
    text: string,
    x: number,
    top: number,
    options?: {
      font?: PdfFont;
      size?: number;
      color?: [number, number, number];
      width?: number;
      align?: PdfAlign;
    },
  ): void {
    const font = options?.font ?? "F1";
    const size = options?.size ?? 10;
    const color = options?.color ?? COLOR_TEXT;
    const align = options?.align ?? "left";
    const bounded = options?.width
      ? this.truncateToWidth(text, options.width, size, font)
      : normalizeAscii(text);

    let drawX = x;
    if (options?.width) {
      const textWidth = this.estimateTextWidth(bounded, size, font);
      if (align === "center") {
        drawX = x + Math.max(0, (options.width - textWidth) / 2);
      } else if (align === "right") {
        drawX = x + Math.max(0, options.width - textWidth);
      }
    }

    const drawY = this.toPdfY(top, size);

    this.command(page, "q");
    this.command(page, `${color[0]} ${color[1]} ${color[2]} rg`);
    this.command(page, "BT");
    this.command(page, `/${font} ${size} Tf`);
    this.command(page, `1 0 0 1 ${drawX} ${drawY} Tm`);
    this.command(page, `(${escapePdfText(bounded)}) Tj`);
    this.command(page, "ET");
    this.command(page, "Q");
  }

  private drawPageHeader(page: PdfPage): void {
    this.drawRect(page, PAGE_MARGIN_X, PAGE_MARGIN_TOP, PAGE_CONTENT_WIDTH, PAGE_HEADER_HEIGHT, {
      fill: COLOR_PRIMARY,
      stroke: COLOR_PRIMARY,
      lineWidth: 1,
    });

    this.drawText(page, this.reportTitle, PAGE_MARGIN_X + 16, PAGE_MARGIN_TOP + 16, {
      font: "F2",
      size: 16,
      color: COLOR_WHITE,
    });

    this.drawText(page, this.reportSubtitle, PAGE_MARGIN_X + 16, PAGE_MARGIN_TOP + 40, {
      font: "F1",
      size: 10,
      color: COLOR_WHITE,
      width: PAGE_CONTENT_WIDTH - 32,
    });

    page.cursorTop = PAGE_MARGIN_TOP + PAGE_HEADER_HEIGHT + 14;
  }

  drawMetadata(periodLabel: string, generatedAtLabel: string): void {
    this.ensureSpace(50);

    const page = this.currentPage;
    const boxHeight = 42;

    this.drawRect(page, PAGE_MARGIN_X, page.cursorTop, PAGE_CONTENT_WIDTH, boxHeight, {
      fill: COLOR_CARD_BG,
      stroke: COLOR_BORDER,
      lineWidth: 1,
    });

    this.drawText(
      page,
      `Periodo analisado: ${periodLabel}`,
      PAGE_MARGIN_X + 12,
      page.cursorTop + 12,
      {
        font: "F2",
        size: 10,
        color: COLOR_TEXT,
        width: PAGE_CONTENT_WIDTH - 24,
      },
    );

    this.drawText(
      page,
      `Emitido em: ${generatedAtLabel}`,
      PAGE_MARGIN_X + 12,
      page.cursorTop + 26,
      {
        font: "F1",
        size: 9,
        color: COLOR_MUTED,
        width: PAGE_CONTENT_WIDTH - 24,
      },
    );

    page.cursorTop += boxHeight + 14;
  }

  drawSummaryCards(summary: ReportExportSummary): void {
    this.ensureSpace(150);

    const page = this.currentPage;

    this.drawText(page, "Resumo executivo", PAGE_MARGIN_X, page.cursorTop, {
      font: "F2",
      size: 13,
      color: COLOR_TEXT,
    });

    page.cursorTop += 18;

    const cardGap = 10;
    const cardWidth = (PAGE_CONTENT_WIDTH - cardGap) / 2;
    const cardHeight = 56;

    const cards = [
      { label: "Consultas no periodo", value: String(summary.consultationsCount) },
      { label: "Cancelamentos", value: String(summary.cancellationsCount) },
      { label: "Receita total", value: formatCurrency(summary.totalRevenue) },
      { label: "Lucro estimado", value: formatCurrency(summary.estimatedProfit) },
    ];

    for (let index = 0; index < cards.length; index += 1) {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = PAGE_MARGIN_X + col * (cardWidth + cardGap);
      const y = page.cursorTop + row * (cardHeight + cardGap);

      this.drawRect(page, x, y, cardWidth, cardHeight, {
        fill: COLOR_CARD_BG,
        stroke: COLOR_BORDER,
        lineWidth: 1,
      });

      this.drawText(page, cards[index].label, x + 10, y + 10, {
        font: "F1",
        size: 9,
        color: COLOR_MUTED,
        width: cardWidth - 20,
      });

      this.drawText(page, cards[index].value, x + 10, y + 28, {
        font: "F2",
        size: 13,
        color: COLOR_TEXT,
        width: cardWidth - 20,
      });
    }

    page.cursorTop += cardHeight * 2 + cardGap + 16;
  }

  private drawSectionTitle(title: string): void {
    this.ensureSpace(28);

    const page = this.currentPage;
    this.drawText(page, title, PAGE_MARGIN_X, page.cursorTop, {
      font: "F2",
      size: 12,
      color: COLOR_TEXT,
    });

    this.drawLine(
      page,
      PAGE_MARGIN_X,
      page.cursorTop + 16,
      PAGE_MARGIN_X + PAGE_CONTENT_WIDTH,
      page.cursorTop + 16,
      COLOR_BORDER,
      1,
    );

    page.cursorTop += 24;
  }

  private drawTable<T extends Record<string, string>>(
    sectionTitle: string,
    columns: Array<TableColumn<T>>,
    rows: T[],
    emptyMessage: string,
  ): void {
    this.drawSectionTitle(sectionTitle);

    if (rows.length === 0) {
      this.ensureSpace(36);
      const page = this.currentPage;
      this.drawRect(page, PAGE_MARGIN_X, page.cursorTop, PAGE_CONTENT_WIDTH, 30, {
        fill: COLOR_CARD_BG,
        stroke: COLOR_BORDER,
        lineWidth: 1,
      });
      this.drawText(page, emptyMessage, PAGE_MARGIN_X + 10, page.cursorTop + 10, {
        font: "F1",
        size: 9,
        color: COLOR_MUTED,
        width: PAGE_CONTENT_WIDTH - 20,
      });
      page.cursorTop += 44;
      return;
    }

    const headerHeight = 22;
    const rowHeight = 20;

    const drawHeaderRow = () => {
      this.ensureSpace(headerHeight + rowHeight);
      const page = this.currentPage;

      this.drawRect(page, PAGE_MARGIN_X, page.cursorTop, PAGE_CONTENT_WIDTH, headerHeight, {
        fill: COLOR_HEADER_BG,
        stroke: COLOR_BORDER,
        lineWidth: 1,
      });

      let offsetX = PAGE_MARGIN_X;
      for (const column of columns) {
        this.drawText(page, column.label, offsetX + 6, page.cursorTop + 7, {
          font: "F2",
          size: 8,
          color: COLOR_TEXT,
          width: column.width - 12,
          align: column.align ?? "left",
        });

        offsetX += column.width;
      }

      page.cursorTop += headerHeight;
    };

    drawHeaderRow();

    rows.forEach((row, index) => {
      if (this.currentPage.cursorTop + rowHeight > PAGE_HEIGHT - PAGE_MARGIN_BOTTOM - 10) {
        this.addPage();
        this.drawSectionTitle(`${sectionTitle} (contin.)`);
        drawHeaderRow();
      }

      const page = this.currentPage;
      const isAlternate = index % 2 === 1;

      this.drawRect(page, PAGE_MARGIN_X, page.cursorTop, PAGE_CONTENT_WIDTH, rowHeight, {
        fill: isAlternate ? COLOR_ROW_ALT : COLOR_WHITE,
        stroke: COLOR_BORDER,
        lineWidth: 1,
      });

      let offsetX = PAGE_MARGIN_X;
      for (const column of columns) {
        const value = row[column.key] ?? "-";
        this.drawText(page, value, offsetX + 6, page.cursorTop + 6, {
          font: "F1",
          size: 8,
          color: COLOR_TEXT,
          width: column.width - 12,
          align: column.align ?? "left",
        });
        offsetX += column.width;
      }

      page.cursorTop += rowHeight;
    });

    this.currentPage.cursorTop += 16;
  }

  drawAppointments(rows: Array<Record<string, string>>): void {
    this.drawTable(
      `Consultas (${rows.length})`,
      [
        { key: "date", label: "DATA", width: 64 },
        { key: "time", label: "HORARIO", width: 62 },
        { key: "patient", label: "PACIENTE", width: 122 },
        { key: "professional", label: "PROFISSIONAL", width: 122 },
        { key: "status", label: "STATUS", width: 90 },
        { key: "type", label: "TIPO", width: 63 },
      ],
      rows,
      "Nenhuma consulta encontrada no periodo.",
    );
  }

  drawFinancial(rows: Array<Record<string, string>>): void {
    this.drawTable(
      `Lancamentos financeiros (${rows.length})`,
      [
        { key: "date", label: "DATA", width: 64 },
        { key: "type", label: "TIPO", width: 64 },
        { key: "title", label: "TITULO", width: 150 },
        { key: "category", label: "CATEGORIA", width: 86 },
        { key: "paymentStatus", label: "PGTO", width: 66 },
        { key: "amount", label: "VALOR", width: 93, align: "right" },
      ],
      rows,
      "Nenhum lancamento financeiro encontrado no periodo.",
    );
  }

  private appendFooters(): void {
    const totalPages = this.pages.length;

    this.pages.forEach((page, index) => {
      this.drawLine(
        page,
        PAGE_MARGIN_X,
        PAGE_HEIGHT - PAGE_MARGIN_BOTTOM,
        PAGE_MARGIN_X + PAGE_CONTENT_WIDTH,
        PAGE_HEIGHT - PAGE_MARGIN_BOTTOM,
        COLOR_BORDER,
        1,
      );

      this.drawText(
        page,
        `Pagina ${index + 1} de ${totalPages}`,
        PAGE_MARGIN_X,
        PAGE_HEIGHT - PAGE_MARGIN_BOTTOM + 10,
        {
          font: "F1",
          size: 8,
          color: COLOR_MUTED,
          width: PAGE_CONTENT_WIDTH,
          align: "right",
        },
      );
    });
  }

  build(): Buffer {
    this.appendFooters();
    return buildPdfBufferFromPages(this.pages);
  }
}

export class ReportExportService {
  private parseDateRange(startDate: string, endDate: string): { start: Date; end: Date } {
    if (!DATE_PATTERN.test(startDate) || !DATE_PATTERN.test(endDate)) {
      throw new ReportExportValidationError("Datas invalidas. Use o formato YYYY-MM-DD.");
    }

    const start = dayjs.tz(`${startDate}T00:00:00`, DEFAULT_TIMEZONE);
    const end = dayjs.tz(`${endDate}T23:59:59.999`, DEFAULT_TIMEZONE);

    if (!start.isValid() || !end.isValid()) {
      throw new ReportExportValidationError("Nao foi possivel interpretar as datas informadas.");
    }

    if (end.isBefore(start)) {
      throw new ReportExportValidationError("A data inicial nao pode ser maior que a data final.");
    }

    const rangeInDays = end.startOf("day").diff(start.startOf("day"), "day");
    if (rangeInDays > MAX_RANGE_DAYS) {
      throw new ReportExportValidationError("O periodo maximo para exportacao e de 366 dias.");
    }

    return {
      start: start.toDate(),
      end: end.toDate(),
    };
  }

  async getExportData(
    clinicId: string,
    startDate: string,
    endDate: string,
  ): Promise<ReportExportData> {
    const { start, end } = this.parseDateRange(startDate, endDate);

    const [clinic, appointments, financialRecords] = await Promise.all([
      prisma.clinic.findUnique({
        where: { id: clinicId },
        select: {
          tradeName: true,
          legalName: true,
        },
      }),
      prisma.appointment.findMany({
        where: {
          clinicId,
          appointmentDate: {
            gte: start,
            lte: end,
          },
        },
        orderBy: [{ appointmentDate: "asc" }, { startTime: "asc" }],
        select: {
          appointmentDate: true,
          startTime: true,
          endTime: true,
          status: true,
          type: true,
          patient: {
            select: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          professional: {
            select: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.financialRecord.findMany({
        where: {
          clinicId,
          referenceDate: {
            gte: start,
            lte: end,
          },
        },
        orderBy: [{ referenceDate: "asc" }, { createdAt: "asc" }],
        select: {
          referenceDate: true,
          type: true,
          amount: true,
          description: true,
          category: true,
          paymentStatus: true,
        },
      }),
    ]);

    const cancelledStatuses = new Set<AppointmentStatus>([...CONSULTATION_EXCLUDED_STATUSES]);

    const consultationsCount = appointments.filter(
      (item) => !cancelledStatuses.has(item.status as AppointmentStatus),
    ).length;

    const cancellationsCount = appointments.filter((item) =>
      cancelledStatuses.has(item.status as AppointmentStatus),
    ).length;

    const totalRevenue = financialRecords
      .filter((record) => record.type === TransactionType.INCOME)
      .reduce((sum, record) => sum + Number(record.amount), 0);

    const totalExpense = financialRecords
      .filter((record) => record.type === TransactionType.EXPENSE)
      .reduce((sum, record) => sum + Number(record.amount), 0);

    return {
      clinicName: clinic?.tradeName ?? clinic?.legalName ?? "Minha Clinica",
      startDate,
      endDate,
      generatedAt: new Date(),
      summary: {
        consultationsCount,
        cancellationsCount,
        totalRevenue,
        totalExpense,
        estimatedProfit: totalRevenue - totalExpense,
      },
      appointments: appointments.map((item) => ({
        appointmentDate: item.appointmentDate,
        startTime: item.startTime,
        endTime: item.endTime,
        status: item.status as AppointmentStatus,
        type: item.type,
        patientName: item.patient.user.name,
        professionalName: item.professional.user.name,
      })),
      financialRecords: financialRecords.map((record) => ({
        referenceDate: record.referenceDate,
        type: record.type as TransactionType,
        amount: Number(record.amount),
        title: record.description,
        category: record.category,
        paymentStatus: record.paymentStatus,
      })),
    };
  }

  async generatePdf(
    clinicId: string,
    startDate: string,
    endDate: string,
  ): Promise<{
    fileName: string;
    buffer: Buffer;
  }> {
    const data = await this.getExportData(clinicId, startDate, endDate);

    const periodLabel = `${formatDateLabel(new Date(`${data.startDate}T12:00:00`))} ate ${formatDateLabel(new Date(`${data.endDate}T12:00:00`))}`;
    const generatedAtLabel = formatDateTimeLabel(data.generatedAt);

    const appointmentRows = data.appointments.slice(0, MAX_LIST_ROWS).map((item) => ({
      date: formatDateLabel(item.appointmentDate),
      time: `${item.startTime}-${item.endTime}`,
      patient: item.patientName,
      professional: item.professionalName,
      status: APPOINTMENT_STATUS_LABEL[item.status] ?? item.status,
      type: APPOINTMENT_TYPE_LABEL[item.type?.toUpperCase()] ?? item.type,
    }));

    const financialRows = data.financialRecords.slice(0, MAX_LIST_ROWS).map((item) => {
      const signedAmount =
        item.type === TransactionType.EXPENSE ? -Math.abs(item.amount) : Math.abs(item.amount);
      return {
        date: formatDateLabel(item.referenceDate),
        type: TRANSACTION_TYPE_LABEL[item.type],
        title: item.title,
        category: item.category ?? "-",
        paymentStatus: PAYMENT_STATUS_LABEL[item.paymentStatus] ?? item.paymentStatus,
        amount: formatCurrency(signedAmount),
      };
    });

    const builder = new ProfessionalPdfBuilder(
      `Relatorio Gerencial - ${data.clinicName}`,
      "Panorama consolidado de consultas e financeiro",
    );

    builder.drawMetadata(periodLabel, generatedAtLabel);
    builder.drawSummaryCards(data.summary);
    builder.drawAppointments(appointmentRows);
    builder.drawFinancial(financialRows);

    const buffer = builder.build();
    const fileName = `relatorio-${startDate}-a-${endDate}.pdf`;

    return {
      fileName,
      buffer,
    };
  }
}
