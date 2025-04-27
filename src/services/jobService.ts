import prisma from '../db/db';

export class JobService {
  static async getJobsPaginated(
    lastPageMarker: string | undefined,
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
      whereClause.title = { contains: filters.title };  // Partial match for title
    }
    if (filters.company) {
      whereClause.company = { equals: filters.company };  // Exact match for company
    }
    if (filters.location) {
      whereClause.location = { contains: filters.location };  // Partial match for location
    }
    if (filters.experienceLevel) {
      whereClause.experienceLevel = { equals: filters.experienceLevel };  // Exact match for experience level
    }
    if (filters.employmentType) {
      whereClause.employmentType = { equals: filters.employmentType };  // Exact match for employment type
    }
    if (filters.domain) {
      whereClause.domain = { equals: filters.domain };  // Exact match for domain
    }
    if (filters.workplaceType) {
      whereClause.workplaceType = { equals: filters.workplaceType };  // Exact match for workplace type
    }

    // Query the database with filters and pagination
    const jobs = await prisma.job.findMany({
      where: {
        ...whereClause,
        ...(lastPageMarker ? { id: { gt: lastPageMarker } } : {}),  // Add condition to fetch jobs after lastPageMarker
      },
      take: pageSize,
      orderBy: { id: 'asc' },  // Ensure consistent ordering by job id
    });

    // Determine the next page marker based on the last job's id
    const nextPageMarker = jobs.length > 0 ? jobs[jobs.length - 1].id : null;

    return {
      jobs,
      nextPageMarker,
    };
  }
}
