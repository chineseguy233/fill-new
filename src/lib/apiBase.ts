// 动态 API 基址，支持局域网访问
export const API_ORIGIN = `${window.location.protocol}//${window.location.hostname}:3001`;

// 各模块前缀
export const API_FILES = `${API_ORIGIN}/api/files`;
export const API_FOLDERS = `${API_ORIGIN}/api/folders`;
export const API_USERS = `${API_ORIGIN}/api/users`;
export const API_USER_LOGS = `${API_ORIGIN}/api/user-logs`;