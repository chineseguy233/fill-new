// 用户类型定义
export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  role: 'admin' | 'user';
  permissions: {
    canUpload: boolean;
    canDownload: boolean;
    canView: boolean;
    canDelete: boolean;
    canManageUsers: boolean;
  };
  createdAt: string;
}

export interface LoginResult {
  success: boolean;
  message: string;
  user?: User;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

export interface RegisterResult {
  success: boolean;
  message: string;
  user?: User;
}

// API基础URL
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:3001/api`;

// 验证邮箱格式
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 验证手机号格式
function isValidPhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

// 用户登录
export const login = async (identifier: string, password: string): Promise<LoginResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || '登录失败'
      };
    }

    if (data.success && data.data.user) {
      // 保存用户信息到localStorage
      localStorage.setItem('currentUser', JSON.stringify(data.data.user));
      localStorage.setItem('isAuthenticated', 'true');

      return {
        success: true,
        message: data.message,
        user: data.data.user
      };
    }

    return {
      success: false,
      message: data.message || '登录失败'
    };
  } catch (error) {
    console.error('登录失败:', error);
    return {
      success: false,
      message: '网络连接失败，请检查后端服务是否正常运行'
    };
  }
};

// 用户注册
export const register = async (userData: RegisterData): Promise<RegisterResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || '注册失败'
      };
    }

    if (data.success && data.data.user) {
      // 自动登录
      localStorage.setItem('currentUser', JSON.stringify(data.data.user));
      localStorage.setItem('isAuthenticated', 'true');

      return {
        success: true,
        message: data.message,
        user: data.data.user
      };
    }

    return {
      success: false,
      message: data.message || '注册失败'
    };
  } catch (error) {
    console.error('注册失败:', error);
    return {
      success: false,
      message: '网络连接失败，请检查后端服务是否正常运行'
    };
  }
};

// 用户登出
export const logout = (): void => {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('isAuthenticated');
};

// 获取当前用户
export const getCurrentUser = (): User | null => {
  try {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  } catch (error) {
    console.error('获取当前用户失败:', error);
    return null;
  }
};

// 检查是否已认证
export const isAuthenticated = (): boolean => {
  const authStatus = localStorage.getItem('isAuthenticated');
  const currentUser = getCurrentUser();
  return authStatus === 'true' && currentUser !== null;
};

// 检查用户权限
export const hasPermission = (permission: keyof User['permissions']): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  return user.permissions[permission] || false;
};

// 检查是否为管理员
export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'admin' || false;
};

// 更新用户信息
export const updateUser = async (userId: string, updates: Partial<User>): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || '更新失败'
      };
    }

    if (data.success && data.data.user) {
      // 如果更新的是当前用户，更新localStorage
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        localStorage.setItem('currentUser', JSON.stringify(data.data.user));
      }

      return {
        success: true,
        message: data.message,
        user: data.data.user
      };
    }

    return {
      success: false,
      message: data.message || '更新失败'
    };
  } catch (error) {
    console.error('更新用户信息失败:', error);
    return {
      success: false,
      message: '网络连接失败，请检查后端服务是否正常运行'
    };
  }
};

// 修改密码
export const changePassword = async (userId: string, oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || '修改密码失败'
      };
    }

    return {
      success: data.success,
      message: data.message
    };
  } catch (error) {
    console.error('修改密码失败:', error);
    return {
      success: false,
      message: '网络连接失败，请检查后端服务是否正常运行'
    };
  }
};

// 获取用户信息（从后端）
export const getUserById = async (userId: string): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || '获取用户信息失败'
      };
    }

    return {
      success: data.success,
      message: data.message || '获取成功',
      user: data.data.user
    };
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return {
      success: false,
      message: '网络连接失败，请检查后端服务是否正常运行'
    };
  }
};

// 获取所有用户（管理员专用）
export const getAllUsers = async (): Promise<{ success: boolean; message: string; users?: User[] }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || '获取用户列表失败'
      };
    }

    return {
      success: data.success,
      message: data.message || '获取成功',
      users: data.data.users
    };
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return {
      success: false,
      message: '网络连接失败，请检查后端服务是否正常运行'
    };
  }
};

// 删除用户（管理员专用）
export const deleteUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || '删除用户失败'
      };
    }

    return {
      success: data.success,
      message: data.message
    };
  } catch (error) {
    console.error('删除用户失败:', error);
    return {
      success: false,
      message: '网络连接失败，请检查后端服务是否正常运行'
    };
  }
};