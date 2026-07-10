import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  iconUrl: true,
  parentId: true,
  isActive: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  parent: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} satisfies Prisma.CategorySelect;

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findPublicCategories() {
    return this.prisma.category.findMany({
      select: CATEGORY_SELECT,
      where: {
        isActive: true,
        deletedAt: null,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  findAllForAdmin() {
    return this.prisma.category.findMany({
      select: CATEGORY_SELECT,
      where: {
        deletedAt: null,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findPublicCategoryBySlug(slug: string) {
    const category = await this.prisma.category.findFirst({
      select: CATEGORY_SELECT,
      where: {
        slug,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async create(dto: CreateCategoryDto) {
    await this.ensureNameIsAvailable(dto.name);
    await this.ensureParentExists(dto.parentId);

    const slug = await this.buildUniqueCategorySlug(dto.slug ?? dto.name);

    return this.prisma.category.create({
      select: CATEGORY_SELECT,
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        iconUrl: dto.iconUrl,
        parentId: dto.parentId,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const current = await this.findCategoryOrThrow(id);

    if (dto.name && dto.name !== current.name) {
      await this.ensureNameIsAvailable(dto.name, id);
    }

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new ConflictException('Category cannot be its own parent');
      }

      await this.ensureParentExists(dto.parentId);
    }

    const slugSource = dto.slug ?? dto.name;
    const slug =
      slugSource && slugSource !== current.slug && slugSource !== current.name
        ? await this.buildUniqueCategorySlug(slugSource, id)
        : undefined;

    return this.prisma.category.update({
      select: CATEGORY_SELECT,
      where: { id },
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        iconUrl: dto.iconUrl,
        parentId: dto.parentId,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      },
    });
  }

  async remove(id: string) {
    await this.findCategoryOrThrow(id);

    return this.prisma.category.update({
      select: CATEGORY_SELECT,
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  private async findCategoryOrThrow(id: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  private async ensureParentExists(parentId?: string | null) {
    if (!parentId) {
      return;
    }

    await this.findCategoryOrThrow(parentId);
  }

  private async ensureNameIsAvailable(
    name: string,
    currentCategoryId?: string,
  ) {
    const category = await this.prisma.category.findFirst({
      where: {
        name,
        deletedAt: null,
        ...(currentCategoryId ? { id: { not: currentCategoryId } } : {}),
      },
    });

    if (category) {
      throw new ConflictException('Category name is already in use');
    }
  }

  private async buildUniqueCategorySlug(
    value: string,
    currentCategoryId?: string,
  ) {
    return this.buildUniqueSlug(value, async (slug) => {
      const category = await this.prisma.category.findFirst({
        where: {
          slug,
          ...(currentCategoryId ? { id: { not: currentCategoryId } } : {}),
        },
      });

      return Boolean(category);
    });
  }

  private async buildUniqueSlug(
    value: string,
    exists: (slug: string) => Promise<boolean>,
  ) {
    const baseSlug = this.slugify(value);
    let candidate = baseSlug;
    let suffix = 2;

    while (await exists(candidate)) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
