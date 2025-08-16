// 数据库服务统一导出
export { databaseAuthService } from './authService'
export { databaseDocumentService } from './documentService'
export { databaseFolderService } from './folderService'

// 类型导出
export type { LoginCredentials, RegisterCredentials } from './authService'
export type { User, NewUser } from '../schema'
export type { UploadDocumentData } from './documentService'
export type { CreateFolderData } from './folderService'