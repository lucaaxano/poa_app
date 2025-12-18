import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedFile {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private minioClient: Minio.Client;
  private bucketName: string;
  private endpoint: string;
  private port: number;
  private useSSL: boolean;

  constructor(private configService: ConfigService) {
    // Parse endpoint URL
    const endpointUrl = this.configService.get<string>('STORAGE_ENDPOINT') || 'http://storage:9000';
    const url = new URL(endpointUrl);

    this.endpoint = url.hostname;
    this.port = parseInt(url.port) || (url.protocol === 'https:' ? 443 : 9000);
    this.useSSL = url.protocol === 'https:';
    this.bucketName = this.configService.get<string>('STORAGE_BUCKET') || 'poa-uploads';

    this.minioClient = new Minio.Client({
      endPoint: this.endpoint,
      port: this.port,
      useSSL: this.useSSL,
      accessKey: this.configService.get<string>('STORAGE_ACCESS_KEY') || 'minioadmin',
      secretKey: this.configService.get<string>('STORAGE_SECRET_KEY') || 'minioadmin',
    });
  }

  async onModuleInit() {
    // Ensure bucket exists
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName);
        console.log(`Bucket ${this.bucketName} created successfully`);
      }
    } catch (error) {
      console.error('Error checking/creating bucket:', error);
    }
  }

  /**
   * Upload a file to MinIO storage
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'attachments',
  ): Promise<UploadedFile> {
    const fileExtension = file.originalname.split('.').pop() || '';
    const uniqueFileName = `${folder}/${uuidv4()}.${fileExtension}`;

    await this.minioClient.putObject(
      this.bucketName,
      uniqueFileName,
      file.buffer,
      file.size,
      {
        'Content-Type': file.mimetype,
        'x-amz-acl': 'public-read',
      },
    );

    // Build public URL
    const publicUrl = this.getPublicUrl(uniqueFileName);

    return {
      url: publicUrl,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    };
  }

  /**
   * Delete a file from MinIO storage
   */
  async deleteFile(fileUrl: string): Promise<void> {
    // Extract object name from URL
    const objectName = this.extractObjectName(fileUrl);
    if (objectName) {
      await this.minioClient.removeObject(this.bucketName, objectName);
    }
  }

  /**
   * Get a presigned URL for temporary access
   */
  async getPresignedUrl(objectName: string, expirySeconds: number = 3600): Promise<string> {
    return this.minioClient.presignedGetObject(this.bucketName, objectName, expirySeconds);
  }

  /**
   * Build public URL for an object
   */
  private getPublicUrl(objectName: string): string {
    // For local development, use localhost:9000
    // In production, this should be configured via environment variable
    const publicEndpoint = this.configService.get<string>('STORAGE_PUBLIC_URL')
      || `http://localhost:9000`;
    return `${publicEndpoint}/${this.bucketName}/${objectName}`;
  }

  /**
   * Extract object name from a full URL
   */
  private extractObjectName(fileUrl: string): string | null {
    try {
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/');
      // Remove bucket name from path and join the rest
      if (pathParts.length >= 3) {
        return pathParts.slice(2).join('/');
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Determine file type from MIME type
   */
  getFileType(mimeType: string): 'IMAGE' | 'VIDEO' | 'PDF' | 'OTHER' {
    if (mimeType.startsWith('image/')) {
      return 'IMAGE';
    }
    if (mimeType.startsWith('video/')) {
      return 'VIDEO';
    }
    if (mimeType === 'application/pdf') {
      return 'PDF';
    }
    return 'OTHER';
  }
}
