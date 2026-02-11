import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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
  private readonly logger = new Logger(StorageService.name);
  private minioClient: Minio.Client;
  private bucketName: string;
  private endpoint: string;
  private port: number;
  private useSSL: boolean;
  private bucketReady = false;

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
    const maxRetries = 5;
    const retryDelay = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.initBucket();
        this.logger.log(`Storage ready: bucket "${this.bucketName}" with public-read policy`);
        return;
      } catch (error) {
        if (attempt < maxRetries) {
          this.logger.warn(
            `Storage init attempt ${attempt}/${maxRetries} failed, retrying in ${retryDelay}ms...`,
            error instanceof Error ? error.message : error,
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } else {
          this.logger.error(
            `Storage init failed after ${maxRetries} attempts. Will retry on first upload.`,
            error instanceof Error ? error.stack : error,
          );
        }
      }
    }
  }

  private async initBucket(): Promise<void> {
    const exists = await this.minioClient.bucketExists(this.bucketName);
    if (!exists) {
      await this.minioClient.makeBucket(this.bucketName);
      this.logger.log(`Bucket "${this.bucketName}" created`);
    }

    // Set public-read policy so uploaded files are accessible via browser
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucketName}/*`],
        },
      ],
    });
    await this.minioClient.setBucketPolicy(this.bucketName, policy);

    this.bucketReady = true;
  }

  private async ensureBucket(): Promise<void> {
    if (this.bucketReady) return;
    await this.initBucket();
    this.logger.log(`Storage ready (lazy init): bucket "${this.bucketName}" with public-read policy`);
  }

  /**
   * Upload a file to MinIO storage
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'attachments',
  ): Promise<UploadedFile> {
    await this.ensureBucket();

    const fileExtension = file.originalname.split('.').pop() || '';
    const uniqueFileName = `${folder}/${uuidv4()}.${fileExtension}`;

    try {
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
    } catch (error) {
      // Single retry on transient error
      this.logger.warn('Upload failed, retrying once...', error instanceof Error ? error.message : error);
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
    }

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
   * Download a file from MinIO storage as Buffer
   */
  async downloadFile(fileUrl: string): Promise<Buffer> {
    const objectName = this.extractObjectName(fileUrl);
    if (!objectName) {
      throw new Error('Invalid file URL');
    }

    const chunks: Buffer[] = [];
    const stream = await this.minioClient.getObject(this.bucketName, objectName);

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  /**
   * Health check for storage connectivity
   */
  async healthCheck(): Promise<{ status: string; bucket: string }> {
    try {
      await this.minioClient.bucketExists(this.bucketName);
      return { status: 'connected', bucket: this.bucketName };
    } catch {
      return { status: 'error', bucket: this.bucketName };
    }
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
