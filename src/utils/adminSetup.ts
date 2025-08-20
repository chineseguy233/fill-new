// 临时管理员设置工具
export const setCurrentUserAsAdmin = () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
    
    if (!currentUser.id) {
      console.error('没有找到当前用户')
      return false
    }
    
    // 设置为管理员角色和权限
    const adminUser = {
      ...currentUser,
      role: 'admin',
      permissions: {
        canUpload: true,
        canDownload: true,
        canView: true,
        canDelete: true,
        canManageUsers: true
      }
    }
    
    localStorage.setItem('currentUser', JSON.stringify(adminUser))
    console.log('用户已设置为管理员:', adminUser.username)
    
    // 触发存储事件，让其他组件知道用户信息已更新
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'currentUser',
      newValue: JSON.stringify(adminUser),
      oldValue: JSON.stringify(currentUser)
    }))
    
    return true
  } catch (error) {
    console.error('设置管理员失败:', error)
    return false
  }
}

// 检查当前用户权限
export const checkCurrentUserPermissions = () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
    console.log('当前用户信息:', currentUser)
    return currentUser
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null
  }
}