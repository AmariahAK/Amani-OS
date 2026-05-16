export interface MessageAttachment {
  fileName: string;
  mimeType: string;
  base64: string;
  byteSize?: number;
}

export type SessionAttachments = Record<string, MessageAttachment>;
