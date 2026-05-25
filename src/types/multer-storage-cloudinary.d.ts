declare module "multer-storage-cloudinary" {
  import type { StorageEngine } from "multer";
  import type { ConfigOptions, UploadApiOptions } from "cloudinary";

  type ParamValue<T> = T | ((req: Express.Request, file: Express.Multer.File) => T | Promise<T>);

  interface CloudinaryStorageOptions {
    cloudinary: object;
    params?: {
      folder?: ParamValue<string>;
      public_id?: (req: Express.Request, file: Express.Multer.File) => string | Promise<string>;
      format?: ParamValue<string>;
      resource_type?: ParamValue<string>;
      transformation?: ParamValue<object | object[]>;
      [key: string]: unknown;
    };
  }

  export class CloudinaryStorage implements StorageEngine {
    constructor(options: CloudinaryStorageOptions);
    _handleFile(
      req: Express.Request,
      file: Express.Multer.File,
      callback: (error?: Error | null, info?: Partial<Express.Multer.File>) => void,
    ): void;
    _removeFile(
      req: Express.Request,
      file: Express.Multer.File,
      callback: (error: Error | null) => void,
    ): void;
  }
}
