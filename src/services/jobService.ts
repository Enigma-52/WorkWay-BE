import prisma from '../db/db';

export class JobService {
  static async getJobsPaginated(
    lastPageMarker: string | undefined, // should be a JSON string: { updatedAt: string, id: string }
    pageSize: number,
    filters: {
      title?: string;
      company?: string;
      location?: string;
      experienceLevel?: string;
      employmentType?: string;
      domain?: string;
      workplaceType?: string;
    }
  ) {
    const whereClause: any = {};

    // Add filters to the where clause
    if (filters.title) {
      whereClause.title = { contains: filters.title , mode: 'insensitive'  };
    }
    if (filters.company) {
      whereClause.company = { equals: filters.company };
    }
    if (filters.location) {
      whereClause.location = { contains: filters.location , mode: 'insensitive'  };
    }
    if (filters.experienceLevel) {
      whereClause.experienceLevel = { equals: filters.experienceLevel };
    }
    if (filters.employmentType) {
      whereClause.employmentType = { equals: filters.employmentType };
    }
    if (filters.domain) {
      whereClause.domain = { equals: filters.domain };
    }
    if (filters.workplaceType) {
      whereClause.workplaceType = { equals: filters.workplaceType };
    }

    // Handle pagination
    let cursorFilter = {};
    if (lastPageMarker) {
      const { updatedAt, id } = JSON.parse(lastPageMarker);
      cursorFilter = {
        OR: [
          { updatedAt: { lt: new Date(updatedAt) } },
          {
            updatedAt: new Date(updatedAt),
            id: { lt: id },
          },
        ],
      };
    }

    const jobs = await prisma.job.findMany({
      where: {
        ...whereClause,
        ...cursorFilter,
      },
      take: pageSize,
      orderBy: [
        { updatedAt: 'desc' },
        { id: 'desc' },
      ],
    });

    const nextPageMarker =
      jobs.length > 0
        ? JSON.stringify({
            updatedAt: jobs[jobs.length - 1].updatedAt,
            id: jobs[jobs.length - 1].id,
          })
        : null;

    return {
      jobs,
      nextPageMarker,
    };
  }
}
