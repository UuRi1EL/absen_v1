import { UserRepository } from './user.repository.js';
import { CreateUserDto } from './user.validator.js';
import { ConflictError, NotFoundError, BadRequestError } from '../../errors/app-error.js';
import bcrypt from 'bcryptjs';
import { PasswordHelper } from '../../helpers/password.helper.js';
import { prisma } from '../../config/database.config.js';

export class UserService {
  static async getAllUsers() {
    return UserRepository.findAllUsers();
  }

  static async createUser(dto: CreateUserDto) {
    const existing = await UserRepository.findByNip(dto.nip);
    if (existing) {
      throw new ConflictError(`Pengguna dengan NIP ${dto.nip} sudah terdaftar`);
    }

    // STRICT CONSTRAINT: Only 1 Admin (Nurliah) and Only 1 Principal (Mu'minang) allowed!
    if (dto.role === 'ADMIN') {
      const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      if (existingAdmin) {
        throw new ConflictError('Aplikasi hanya mengizinkan 1 Akun Operator / Admin (Nurliah).');
      }
    }

    if (dto.role === 'PRINCIPAL') {
      const existingPrincipal = await prisma.user.findFirst({ where: { role: 'PRINCIPAL' } });
      if (existingPrincipal) {
        throw new ConflictError("Aplikasi hanya mengizinkan 1 Akun Kepala Sekolah (Mu'minang).");
      }
    }

    // Get primary school record
    const school = await prisma.school.findFirst();
    if (!school) {
      throw new NotFoundError('Data sekolah belum diinisialisasi');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    return UserRepository.createUser({
      nip: dto.nip,
      fullName: dto.fullName,
      email: dto.email,
      password: hashedPassword,
      phone: dto.phone,
      role: dto.role || 'TEACHER',
      position: dto.position,
      department: dto.department,
      schoolId: school.id
    });
  }

  static async toggleActive(id: string, isActive: boolean) {
    return UserRepository.toggleUserActiveStatus(id, isActive);
  }

  static async resetPassword(id: string, newPassword?: string) {
    const trimmed = newPassword ? newPassword.trim() : '';
    if (trimmed.length > 0 && trimmed.length < 6) {
      throw new BadRequestError('Password baru harus minimal 6 karakter');
    }
    const passwordToSet = trimmed || 'password123';
    const hashedPassword = await PasswordHelper.hash(passwordToSet);
    return prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });
  }

  static async updateUserProfile(userId: string, data: {
    fullName?: string;
    email?: string;
    phone?: string;
    position?: string;
    nuptk?: string;
    ukgId?: string;
    ptkDapodikId?: string;
    employmentStatus?: string;
    belajarId?: string;
  }) {
    const userUpdate: any = {};
    if (data.fullName) userUpdate.fullName = data.fullName;
    if (data.email) userUpdate.email = data.email;
    if (data.phone !== undefined) userUpdate.phone = data.phone;

    await prisma.user.update({
      where: { id: userId },
      data: userUpdate
    });

    const profileData: any = {};
    if (data.position !== undefined) profileData.position = data.position;
    if (data.nuptk !== undefined) profileData.nuptk = data.nuptk;
    if (data.ukgId !== undefined) profileData.ukgId = data.ukgId;
    if (data.ptkDapodikId !== undefined) profileData.ptkDapodikId = data.ptkDapodikId;
    if (data.employmentStatus !== undefined) profileData.employmentStatus = data.employmentStatus;
    if (data.belajarId !== undefined) profileData.belajarId = data.belajarId;

    if (Object.keys(profileData).length > 0) {
      try {
        const school = await prisma.school.findFirst();
        await prisma.teacherProfile.upsert({
          where: { userId },
          update: profileData,
          create: {
            userId,
            schoolId: school?.id || '',
            ...profileData
          }
        });
      } catch (err: any) {
        console.warn('Fallback updating teacher profile:', err?.message);
      }
    }

    return prisma.user.findUnique({
      where: { id: userId },
      include: { teacherProfile: true }
    });
  }
}
