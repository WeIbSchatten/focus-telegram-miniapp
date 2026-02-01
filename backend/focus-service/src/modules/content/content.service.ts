import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content } from './entities/content.entity';

export const LICENSE_KEY = 'license_agreement';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
  ) {}

  async getLicense(): Promise<string> {
    const row = await this.contentRepository.findOne({ where: { key: LICENSE_KEY } });
    return row?.value ?? '';
  }

  async setLicense(content: string): Promise<string> {
    let row = await this.contentRepository.findOne({ where: { key: LICENSE_KEY } });
    if (!row) {
      row = this.contentRepository.create({ key: LICENSE_KEY, value: content });
      await this.contentRepository.save(row);
    } else {
      row.value = content;
      await this.contentRepository.save(row);
    }
    return row.value;
  }
}
