import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { QueryListingDto } from './dto/query-listing.dto';

export interface ListingEntity {
  id: string;
  seller_id?: string;
  seller_wallet: string;
  title: string;
  description?: string;
  price_vnd: string;
  price_sol?: string;
  category: string;
  condition: string;
  images: string[];
  location_name?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  distance_km?: number;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class ListingsService {
  private readonly logger = new Logger(ListingsService.name);

  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateListingDto): Promise<ListingEntity> {
    const query = `
      INSERT INTO listings (
        seller_wallet,
        title,
        description,
        price_vnd,
        price_sol,
        category,
        condition,
        images,
        location_name,
        latitude,
        longitude,
        status,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'AVAILABLE', NOW(), NOW())
      RETURNING *;
    `;

    const values = [
      dto.sellerWallet,
      dto.title,
      dto.description || null,
      dto.priceVnd,
      dto.priceSol || null,
      dto.category,
      dto.condition || 'USED',
      dto.images || [],
      dto.locationName || null,
      dto.latitude || null,
      dto.longitude || null,
    ];

    const res = await this.db.query<ListingEntity>(query, values);
    return res.rows[0];
  }

  async findAll(
    query: QueryListingDto,
  ): Promise<{ total: number; data: ListingEntity[] }> {
    const conditions: string[] = ["status = 'AVAILABLE'"];
    const params: any[] = [];
    let idx = 1;

    if (query.category) {
      conditions.push(`category = $${idx++}`);
      params.push(query.category);
    }

    if (query.minPrice !== undefined) {
      conditions.push(`price_vnd >= $${idx++}`);
      params.push(query.minPrice);
    }

    if (query.maxPrice !== undefined) {
      conditions.push(`price_vnd <= $${idx++}`);
      params.push(query.maxPrice);
    }

    if (query.sellerWallet) {
      conditions.push(`seller_wallet = $${idx++}`);
      params.push(query.sellerWallet);
    }

    if (query.search) {
      conditions.push(`(title ILIKE $${idx} OR description ILIKE $${idx})`);
      params.push(`%${query.search}%`);
      idx++;
    }

    let selectDistance = '';
    if (
      query.latitude !== undefined &&
      query.longitude !== undefined &&
      query.radiusKm
    ) {
      // Haversine formula calculation in kilometers (Earth radius ~ 6371 km)
      selectDistance = `, (6371 * acos(
        least(1.0, greatest(-1.0,
          cos(radians($${idx})) * cos(radians(latitude)) * cos(radians(longitude) - radians($${idx + 1})) +
          sin(radians($${idx})) * sin(radians(latitude))
        ))
      )) AS distance_km`;
      params.push(query.latitude, query.longitude);
      idx += 2;

      conditions.push(`latitude IS NOT NULL AND longitude IS NOT NULL`);
      conditions.push(`(6371 * acos(
        least(1.0, greatest(-1.0,
          cos(radians($${idx - 2})) * cos(radians(latitude)) * cos(radians(longitude) - radians($${idx - 1})) +
          sin(radians($${idx - 2})) * sin(radians(latitude))
        ))
      )) <= $${idx++}`);
      params.push(query.radiusKm);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countRes = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM listings ${whereClause};`,
      params,
    );
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    const limit = Math.min(query.limit || 20, 50);
    const offset = query.offset || 0;

    const sql = `
      SELECT * ${selectDistance}
      FROM listings
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${idx++} OFFSET $${idx++};
    `;
    params.push(limit, offset);

    const res = await this.db.query<ListingEntity>(sql, params);
    return { total, data: res.rows };
  }

  async findOne(id: string): Promise<ListingEntity> {
    const res = await this.db.query<ListingEntity>(
      'SELECT * FROM listings WHERE id = $1 LIMIT 1;',
      [id],
    );
    if (!res.rows[0]) {
      throw new NotFoundException(`Listing #${id} not found`);
    }
    return res.rows[0];
  }

  async updateStatus(id: string, status: string): Promise<ListingEntity> {
    const res = await this.db.query<ListingEntity>(
      'UPDATE listings SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *;',
      [id, status],
    );
    if (!res.rows[0]) {
      throw new NotFoundException(`Listing #${id} not found`);
    }
    return res.rows[0];
  }
}

