import { prisma } from '../../config/database.config.js';

export class ScheduleRepository {
  private static isTableEnsured = false;

  private static async ensureTable() {
    if (this.isTableEnsured) return;
    try {
      try {
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN
            CREATE TYPE "WorkShift" AS ENUM ('SHIFT_1', 'SHIFT_2');
          EXCEPTION
            WHEN duplicate_object THEN null;
            WHEN OTHERS THEN null;
          END $$;
        `);
      } catch (e) {}

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "teacher_shift_schedules" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "year" INTEGER NOT NULL DEFAULT 2026,
          "month" INTEGER NOT NULL DEFAULT 8,
          "week" INTEGER NOT NULL DEFAULT 1,
          "dayOfWeek" INTEGER NOT NULL,
          "shift" VARCHAR(20) NOT NULL DEFAULT 'SHIFT_1',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      try {
        await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "teacher_shift_schedules_userId_dayOfWeek_key";`);
        await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "teacher_shift_schedules_userId_dayofweek_key";`);
      } catch (e) {}

      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "teacher_shift_schedules_userId_year_month_week_dayOfWeek_key" 
        ON "teacher_shift_schedules" ("userId", "year", "month", "week", "dayOfWeek");
      `);
      this.isTableEnsured = true;
    } catch (e) {
      console.warn('Notice rendering teacher_shift_schedules table:', e);
    }
  }

  static async getAllSchedules(year?: number, month?: number, week?: number) {
    await this.ensureTable();
    const y = year || new Date().getFullYear();
    const m = month || new Date().getMonth() + 1;

    let teachers: any[] = [];
    try {
      teachers = await prisma.user.findMany({
        where: { role: 'TEACHER', isActive: true },
        select: {
          id: true,
          nip: true,
          fullName: true,
          teacherProfile: {
            select: {
              position: true,
              department: true
            }
          },
          attendances: {
            select: {
              date: true,
              checkInTime: true
            }
          }
        },
        orderBy: { fullName: 'asc' }
      });
    } catch (err) {
      console.warn('Prisma findMany teachers fallback:', err);
      teachers = await prisma.user.findMany({
        where: { role: 'TEACHER', isActive: true },
        select: {
          id: true,
          nip: true,
          fullName: true
        },
        orderBy: { fullName: 'asc' }
      });
    }

    try {
      const rawSchedules: any = await prisma.$queryRawUnsafe(
        `SELECT DISTINCT ON ("userId", "dayOfWeek") "userId" AS "userId", "dayOfWeek" AS "dayOfWeek", "shift" AS "shift", "year" AS "year", "month" AS "month", "week" AS "week" 
         FROM "teacher_shift_schedules" 
         WHERE "year" = $1 AND "month" = $2
         ORDER BY "userId" ASC, "dayOfWeek" ASC, "updatedAt" DESC`,
        y,
        m
      );

      const scheduleMap: Record<string, any[]> = {};
      if (Array.isArray(rawSchedules)) {
        rawSchedules.forEach((s: any) => {
          const uId = s.userId || s.userid;
          const day = s.dayOfWeek !== undefined ? s.dayOfWeek : s.dayofweek;
          const shiftVal = String(s.shift);

          if (uId && uId !== 'my' && uId !== 'me') {
            if (!scheduleMap[uId]) scheduleMap[uId] = [];
            scheduleMap[uId].push({
              userId: uId,
              dayOfWeek: Number(day),
              shift: shiftVal,
              year: Number(s.year),
              month: Number(s.month),
              week: Number(s.week)
            });
          }
        });
      }

      return teachers.map((t: any) => ({
        ...t,
        shiftSchedules: scheduleMap[t.id] || []
      }));
    } catch (err) {
      console.warn('getAllSchedules raw query notice:', err);
      return teachers.map((t: any) => ({ ...t, shiftSchedules: [] }));
    }
  }

  static async getUserSchedules(userId: string, year?: number, month?: number, week?: number) {
    await this.ensureTable();
    const y = year || new Date().getFullYear();
    const m = month || new Date().getMonth() + 1;

    try {
      const rawRes: any = await prisma.$queryRawUnsafe(
        `SELECT DISTINCT ON ("dayOfWeek") "dayOfWeek" AS "dayOfWeek", "shift" AS "shift", "year" AS "year", "month" AS "month", "week" AS "week" 
         FROM "teacher_shift_schedules" 
         WHERE "userId" = $1 AND "year" = $2 AND "month" = $3
         ORDER BY "dayOfWeek" ASC, "updatedAt" DESC`,
        userId,
        y,
        m
      );

      if (Array.isArray(rawRes) && rawRes.length > 0) {
        return rawRes.map((s: any) => ({
          dayOfWeek: Number(s.dayOfWeek !== undefined ? s.dayOfWeek : s.dayofweek),
          shift: String(s.shift),
          year: Number(s.year),
          month: Number(s.month),
          week: Number(s.week)
        }));
      }

      const fallbackRes: any = await prisma.$queryRawUnsafe(
        `SELECT DISTINCT ON ("dayOfWeek") "dayOfWeek" AS "dayOfWeek", "shift" AS "shift"
         FROM "teacher_shift_schedules"
         WHERE "userId" = $1
         ORDER BY "dayOfWeek" ASC, "updatedAt" DESC`,
        userId
      );

      if (Array.isArray(fallbackRes) && fallbackRes.length > 0) {
        return fallbackRes.map((s: any) => ({
          dayOfWeek: Number(s.dayOfWeek !== undefined ? s.dayOfWeek : s.dayofweek),
          shift: String(s.shift),
          year: y,
          month: m,
          week: week || 1
        }));
      }

      return [];
    } catch (rawErr) {
      console.warn('getUserSchedules query warning:', rawErr);
      return [];
    }
  }

  static async saveBatchSchedules(
    schedules: Array<{ userId: string; year?: number; month?: number; week?: number; dayOfWeek: number; shift: 'SHIFT_1' | 'SHIFT_2' }>,
    batchYear?: number,
    batchMonth?: number,
    batchWeek?: number
  ) {
    await this.ensureTable();

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return { success: true, count: 0 };
    }

    const defaultYear = batchYear || new Date().getFullYear();
    const defaultMonth = batchMonth || new Date().getMonth() + 1;
    const defaultWeek = batchWeek || 1;

    // Filter valid items
    const validItems = schedules.filter(
      (s) => s && s.userId && s.userId !== 'my' && s.userId !== 'me' && s.dayOfWeek && s.shift
    );

    if (validItems.length === 0) {
      return { success: true, count: 0 };
    }

    // Prepare rows to upsert across weeks 1..5 for the selected month
    const weeksToSave = [1, 2, 3, 4, 5];
    const rowsToUpsert: Array<{
      id: string;
      userId: string;
      year: number;
      month: number;
      week: number;
      dayOfWeek: number;
      shift: 'SHIFT_1' | 'SHIFT_2';
    }> = [];

    for (const item of validItems) {
      const y = item.year || defaultYear;
      const m = item.month || defaultMonth;

      for (const w of weeksToSave) {
        rowsToUpsert.push({
          id: `tss_${item.userId}_${y}_${m}_${w}_${item.dayOfWeek}`,
          userId: item.userId,
          year: y,
          month: m,
          week: w,
          dayOfWeek: Number(item.dayOfWeek),
          shift: item.shift
        });
      }
    }

    // Execute in fast chunks of 200 rows using single parameterized SQL bulk upsert with enum cast
    const chunkSize = 200;
    for (let i = 0; i < rowsToUpsert.length; i += chunkSize) {
      const chunk = rowsToUpsert.slice(i, i + chunkSize);
      const valuePlaceholders: string[] = [];
      const params: any[] = [];

      chunk.forEach((row, idx) => {
        const offset = idx * 7;
        valuePlaceholders.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}::"WorkShift", NOW(), NOW())`
        );
        params.push(row.id, row.userId, row.year, row.month, row.week, row.dayOfWeek, row.shift);
      });

      const query = `
        INSERT INTO "teacher_shift_schedules" ("id", "userId", "year", "month", "week", "dayOfWeek", "shift", "createdAt", "updatedAt")
        VALUES ${valuePlaceholders.join(',\n')}
        ON CONFLICT ("userId", "year", "month", "week", "dayOfWeek")
        DO UPDATE SET 
          "shift" = EXCLUDED."shift",
          "updatedAt" = NOW()
      `;

      await prisma.$executeRawUnsafe(query, ...params);
    }

    // Synchronize default profile work shifts
    try {
      const userShiftMap = new Map<string, 'SHIFT_1' | 'SHIFT_2'>();
      for (const item of validItems) {
        if (!userShiftMap.has(item.userId)) {
          userShiftMap.set(item.userId, item.shift);
        }
      }

      const shift1Users: string[] = [];
      const shift2Users: string[] = [];

      userShiftMap.forEach((shift, uId) => {
        if (shift === 'SHIFT_2') {
          shift2Users.push(uId);
        } else {
          shift1Users.push(uId);
        }
      });

      if (shift1Users.length > 0) {
        await prisma.teacherProfile.updateMany({
          where: { userId: { in: shift1Users } },
          data: { workShiftStart: '07:30', workShiftEnd: '15:00', defaultShift: 'SHIFT_1' }
        });
      }

      if (shift2Users.length > 0) {
        await prisma.teacherProfile.updateMany({
          where: { userId: { in: shift2Users } },
          data: { workShiftStart: '10:00', workShiftEnd: '17:00', defaultShift: 'SHIFT_2' }
        });
      }
    } catch (profErr) {
      console.warn('Notice updating teacher profile work shift defaults:', profErr);
    }

    return { success: true, count: rowsToUpsert.length };
  }

  static async upsertShiftSchedule(
    userId: string,
    year: number,
    month: number,
    week: number,
    dayOfWeek: number,
    shift: 'SHIFT_1' | 'SHIFT_2'
  ) {
    if (!userId || userId === 'my' || userId === 'me') return null;

    await this.ensureTable();
    try {
      const weeksToSave = [1, 2, 3, 4, 5];
      for (const w of weeksToSave) {
        const id = `tss_${userId}_${year}_${month}_${w}_${dayOfWeek}`;
        await prisma.$executeRawUnsafe(
          `INSERT INTO "teacher_shift_schedules" ("id", "userId", "year", "month", "week", "dayOfWeek", "shift", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7::"WorkShift", NOW(), NOW())
           ON CONFLICT ("userId", "year", "month", "week", "dayOfWeek")
           DO UPDATE SET "shift" = EXCLUDED."shift", "updatedAt" = NOW()`,
          id,
          userId,
          year,
          month,
          w,
          dayOfWeek,
          shift
        );
      }

      const start = shift === 'SHIFT_1' ? '07:30' : '10:00';
      const end = shift === 'SHIFT_1' ? '15:00' : '17:00';
      await prisma.teacherProfile.updateMany({
        where: { userId },
        data: { workShiftStart: start, workShiftEnd: end, defaultShift: shift }
      });

      return true;
    } catch (rawErr) {
      console.error('SQL upsertShiftSchedule failed:', rawErr);
      return null;
    }
  }
}
