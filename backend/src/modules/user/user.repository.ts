import { prisma } from '../../config/database.config.js';
import { User, Role } from '@prisma/client';

export class UserRepository {
  static async findAllUsers(): Promise<User[]> {
    const users = await prisma.user.findMany({
      include: {
        teacherProfile: {
          include: {
            school: true
          }
        }
      },
      orderBy: { fullName: 'asc' }
    });

    // Custom Hierarchy Ordering: PRINCIPAL first, ADMIN second, then TEACHERs
    return users.sort((a, b) => {
      const roleOrder: Record<string, number> = {
        PRINCIPAL: 1,
        ADMIN: 2,
        TEACHER: 3
      };
      const orderA = roleOrder[a.role] || 99;
      const orderB = roleOrder[b.role] || 99;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.fullName.localeCompare(b.fullName);
    });
  }

  static async findByNip(nip: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { nip }
    });
  }

  static async createUser(data: {
    nip: string;
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    role: Role;
    position: string;
    department: string;
    schoolId: string;
    employmentStatus?: string;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        nip: data.nip,
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        role: data.role,
        teacherProfile: {
          create: {
            schoolId: data.schoolId,
            position: data.position,
            department: data.department,
            employmentStatus: data.employmentStatus || 'Guru Honorer Sekolah'
          }
        }
      },
      include: {
        teacherProfile: true
      }
    });
  }

  static async toggleUserActiveStatus(id: string, isActive: boolean): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { isActive }
    });
  }
}
