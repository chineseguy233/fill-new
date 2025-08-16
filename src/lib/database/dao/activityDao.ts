import { eq, desc, and, gte, lte } from 'drizzle-orm'
import { getDatabase } from '../connection'
import { userActivities, type UserActivity, type NewUserActivity } from '../schema'

export class ActivityDao {
  private db = getDatabase()

  // 记录用户活动
  async create(activityData: NewUserActivity): Promise<UserActivity> {
    const result = await this.db.insert(userActivities).values(activityData).returning()
    return result[0]
  }

  // 根据ID获取活动
  async findById(id: string): Promise<UserActivity | null> {
    const result = await this.db.select().from(userActivities).where(eq(userActivities.id, id)).limit(1)
    return result[0] || null
  }

  // 获取用户的所有活动
  async findByUserId(userId: string, limit: number = 100): Promise<UserActivity[]> {
    return await this.db.select().from(userActivities)
      .where(eq(userActivities.userId, userId))
      .orderBy(desc(userActivities.createdAt))
      .limit(limit)
  }

  // 获取最近的活动
  async findRecent(limit: number = 50): Promise<UserActivity[]> {
    return await this.db.select().from(userActivities)
      .orderBy(desc(userActivities.createdAt))
      .limit(limit)
  }

  // 按操作类型获取活动
  async findByAction(action: string, limit: number = 100): Promise<UserActivity[]> {
    return await this.db.select().from(userActivities)
      .where(eq(userActivities.action, action))
      .orderBy(desc(userActivities.createdAt))
      .limit(limit)
  }

  // 按目标类型获取活动
  async findByTargetType(targetType: 'document' | 'folder' | 'user', limit: number = 100): Promise<UserActivity[]> {
    return await this.db.select().from(userActivities)
      .where(eq(userActivities.targetType, targetType))
      .orderBy(desc(userActivities.createdAt))
      .limit(limit)
  }

  // 获取特定目标的活动
  async findByTarget(targetType: 'document' | 'folder' | 'user', targetId: string): Promise<UserActivity[]> {
    return await this.db.select().from(userActivities)
      .where(and(
        eq(userActivities.targetType, targetType),
        eq(userActivities.targetId, targetId)
      ))
      .orderBy(desc(userActivities.createdAt))
  }

  // 获取时间范围内的活动
  async findByDateRange(startDate: string, endDate: string, userId?: string): Promise<UserActivity[]> {
    let query = this.db.select().from(userActivities)
      .where(and(
        gte(userActivities.createdAt, startDate),
        lte(userActivities.createdAt, endDate)
      ))

    if (userId) {
      return await this.db.select().from(userActivities)
        .where(and(
          gte(userActivities.createdAt, startDate),
          lte(userActivities.createdAt, endDate),
          eq(userActivities.userId, userId)
        ))
        .orderBy(desc(userActivities.createdAt))
    }

    return await query.orderBy(desc(userActivities.createdAt))
  }

  // 获取用户活动统计
  async getUserActivityStats(userId: string, days: number = 30): Promise<{
    totalActivities: number
    actionStats: { action: string; count: number }[]
    dailyStats: { date: string; count: number }[]
  }> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const activities = await this.findByDateRange(
      startDate.toISOString(),
      new Date().toISOString(),
      userId
    )

    const totalActivities = activities.length

    // 统计各种操作的数量
    const actionCounts = new Map<string, number>()
    activities.forEach(activity => {
      const count = actionCounts.get(activity.action) || 0
      actionCounts.set(activity.action, count + 1)
    })

    const actionStats = Array.from(actionCounts.entries()).map(([action, count]) => ({
      action,
      count
    }))

    // 统计每日活动数量
    const dailyCounts = new Map<string, number>()
    activities.forEach(activity => {
      const date = activity.createdAt.split('T')[0] // 获取日期部分
      const count = dailyCounts.get(date) || 0
      dailyCounts.set(date, count + 1)
    })

    const dailyStats = Array.from(dailyCounts.entries()).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => a.date.localeCompare(b.date))

    return { totalActivities, actionStats, dailyStats }
  }

  // 获取系统活动统计
  async getSystemActivityStats(days: number = 30): Promise<{
    totalActivities: number
    activeUsers: number
    actionStats: { action: string; count: number }[]
    targetTypeStats: { targetType: string; count: number }[]
    dailyStats: { date: string; count: number }[]
  }> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const activities = await this.findByDateRange(
      startDate.toISOString(),
      new Date().toISOString()
    )

    const totalActivities = activities.length
    const activeUsers = new Set(activities.map(a => a.userId)).size

    // 统计各种操作的数量
    const actionCounts = new Map<string, number>()
    activities.forEach(activity => {
      const count = actionCounts.get(activity.action) || 0
      actionCounts.set(activity.action, count + 1)
    })

    const actionStats = Array.from(actionCounts.entries()).map(([action, count]) => ({
      action,
      count
    }))

    // 统计目标类型的数量
    const targetTypeCounts = new Map<string, number>()
    activities.forEach(activity => {
      const count = targetTypeCounts.get(activity.targetType) || 0
      targetTypeCounts.set(activity.targetType, count + 1)
    })

    const targetTypeStats = Array.from(targetTypeCounts.entries()).map(([targetType, count]) => ({
      targetType,
      count
    }))

    // 统计每日活动数量
    const dailyCounts = new Map<string, number>()
    activities.forEach(activity => {
      const date = activity.createdAt.split('T')[0]
      const count = dailyCounts.get(date) || 0
      dailyCounts.set(date, count + 1)
    })

    const dailyStats = Array.from(dailyCounts.entries()).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => a.date.localeCompare(b.date))

    return { totalActivities, activeUsers, actionStats, targetTypeStats, dailyStats }
  }

  // 删除旧的活动记录（数据清理）
  async deleteOldActivities(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    
    const result = await this.db.delete(userActivities)
      .where(lte(userActivities.createdAt, cutoffDate.toISOString()))
    
    return result.changes
  }

  // 记录常用操作的便捷方法
  async logUpload(userId: string, documentId: string, fileName: string, ipAddress?: string, userAgent?: string): Promise<UserActivity> {
    return await this.create({
      id: 'activity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      userId,
      action: 'upload',
      targetType: 'document',
      targetId: documentId,
      details: { fileName },
      ipAddress,
      userAgent
    })
  }

  async logDownload(userId: string, documentId: string, fileName: string, ipAddress?: string, userAgent?: string): Promise<UserActivity> {
    return await this.create({
      id: 'activity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      userId,
      action: 'download',
      targetType: 'document',
      targetId: documentId,
      details: { fileName },
      ipAddress,
      userAgent
    })
  }

  async logView(userId: string, documentId: string, fileName: string, ipAddress?: string, userAgent?: string): Promise<UserActivity> {
    return await this.create({
      id: 'activity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      userId,
      action: 'view',
      targetType: 'document',
      targetId: documentId,
      details: { fileName },
      ipAddress,
      userAgent
    })
  }

  async logDelete(userId: string, targetType: 'document' | 'folder' | 'user', targetId: string, targetName: string, ipAddress?: string, userAgent?: string): Promise<UserActivity> {
    return await this.create({
      id: 'activity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      userId,
      action: 'delete',
      targetType,
      targetId,
      details: { targetName },
      ipAddress,
      userAgent
    })
  }

  async logCreateFolder(userId: string, folderId: string, folderName: string, ipAddress?: string, userAgent?: string): Promise<UserActivity> {
    return await this.create({
      id: 'activity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      userId,
      action: 'create_folder',
      targetType: 'folder',
      targetId: folderId,
      details: { folderName },
      ipAddress,
      userAgent
    })
  }

  async logLogin(userId: string, ipAddress?: string, userAgent?: string): Promise<UserActivity> {
    return await this.create({
      id: 'activity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      userId,
      action: 'login',
      targetType: 'user',
      targetId: userId,
      details: {},
      ipAddress,
      userAgent
    })
  }

  async logCreate(userId: string, resourceType: string, resourceId: string, resourceName: string, ipAddress?: string, userAgent?: string): Promise<UserActivity> {
    return await this.create({
      id: 'activity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      userId,
      action: 'create',
      targetType: resourceType as 'document' | 'folder' | 'user',
      targetId: resourceId,
      details: { resourceName },
      ipAddress,
      userAgent
    })
  }

  async logLogout(userId: string, ipAddress?: string, userAgent?: string): Promise<UserActivity> {
    return await this.create({
      id: 'activity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      userId,
      action: 'logout',
      targetType: 'user',
      targetId: userId,
      details: {},
      ipAddress,
      userAgent
    })
  }
}

export const activityDao = new ActivityDao()
