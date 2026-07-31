import path from "node:path";
import fs from "node:fs";
import ExcelJS from "exceljs";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

type ArchiveRow = {
  date: string;
  category: string;
  topic: string;
  linkedinPost: string;
  imagePath: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

class AsyncLock {
  private queue: Promise<void> = Promise.resolve();

  async run<T>(fn: () => Promise<T>): Promise<T> {
    const previous = this.queue;
    let release!: () => void;
    this.queue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;

    try {
      return await fn();
    } finally {
      release();
    }
  }
}

export class ExcelManagerService {
  private readonly lock = new AsyncLock();

  private get absoluteFilePath(): string {
    return path.resolve(env.EXCEL_FILE_PATH);
  }

  private async ensureWorkbook() {
    const filePath = this.absoluteFilePath;
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const workbook = new ExcelJS.Workbook();
    if (fs.existsSync(filePath)) {
      await workbook.xlsx.readFile(filePath);
    }

    let sheet = workbook.getWorksheet("Archive");
    if (!sheet) {
      sheet = workbook.addWorksheet("Archive");
      sheet.columns = [
        { header: "Date", key: "date", width: 18 },
        { header: "Category", key: "category", width: 24 },
        { header: "Topic", key: "topic", width: 60 },
        { header: "LinkedIn Post", key: "linkedinPost", width: 100 },
        { header: "Image Path", key: "imagePath", width: 40 },
        { header: "Status", key: "status", width: 20 },
        { header: "CreatedAt", key: "createdAt", width: 28 },
        { header: "UpdatedAt", key: "updatedAt", width: 28 }
      ];
    }

    return { workbook, sheet, filePath };
  }

  async upsertRow(row: ArchiveRow): Promise<void> {
    await this.lock.run(async () => {
      const { workbook, sheet, filePath } = await this.ensureWorkbook();
      let targetRow = -1;

      sheet.eachRow((r, rowNumber) => {
        if (rowNumber === 1) {
          return;
        }
        if (`${r.getCell(1).value ?? ""}` === row.date) {
          targetRow = rowNumber;
        }
      });

      const values = [
        row.date,
        row.category,
        row.topic,
        row.linkedinPost,
        row.imagePath,
        row.status,
        row.createdAt,
        row.updatedAt
      ];

      if (targetRow > 0) {
        sheet.getRow(targetRow).values = values;
      } else {
        sheet.addRow(values);
      }

      await workbook.xlsx.writeFile(filePath);
      logger.info("Excel archive upserted", { date: row.date, status: row.status });
    });
  }
}

export const excelManagerService = new ExcelManagerService();
