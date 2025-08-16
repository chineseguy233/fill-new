import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  FileText, 
  Folder, 
  User,
  Calendar,
  Tag,
  Filter,
  Clock
} from 'lucide-react'

interface SearchResult {
  id: string
  type: 'document' | 'folder' | 'user'
  title: string
  description?: string
  content?: string
  author?: string
  createdAt: string
  tags?: string[]
  relevance: number
}

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // 模拟搜索结果
  const mockSearchResults: SearchResult[] = [
    {
      id: '1',
      type: 'document',
      title: '项目需求文档 v2.1',
      description: '详细的项目需求说明和功能规格',
      content: '本文档包含了项目的详细需求分析...',
      author: '张三',
      createdAt: '2024-01-15',
      tags: ['项目', '需求', '规格'],
      relevance: 95
    },
    {
      id: '2',
      type: 'document',
      title: '技术架构设计',
      description: '系统技术架构和设计方案',
      content: '采用微服务架构，前后端分离...',
      author: '李四',
      createdAt: '2024-01-12',
      tags: ['技术', '架构', '设计'],
      relevance: 88
    },
    {
      id: '3',
      type: 'folder',
      title: '项目文档',
      description: '包含所有项目相关文档',
      author: '王五',
      createdAt: '2024-01-10',
      relevance: 82
    },
    {
      id: '4',
      type: 'document',
      title: '用户手册',
      description: '系统使用说明和操作指南',
      content: '本手册将指导您如何使用系统...',
      author: '赵六',
      createdAt: '2024-01-08',
      tags: ['手册', '使用', '指南'],
      relevance: 75
    }
  ]

  // 加载最近搜索
  useEffect(() => {
    const saved = localStorage.getItem('recent_searches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // 执行搜索
  const handleSearch = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    
    // 模拟搜索延迟
    setTimeout(() => {
      const filtered = mockSearchResults.filter(result =>
        result.title.toLowerCase().includes(term.toLowerCase()) ||
        result.description?.toLowerCase().includes(term.toLowerCase()) ||
        result.content?.toLowerCase().includes(term.toLowerCase()) ||
        result.tags?.some(tag => tag.toLowerCase().includes(term.toLowerCase()))
      )
      
      setSearchResults(filtered.sort((a, b) => b.relevance - a.relevance))
      setIsSearching(false)
      
      // 保存到最近搜索
      const newRecentSearches = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5)
      setRecentSearches(newRecentSearches)
      localStorage.setItem('recent_searches', JSON.stringify(newRecentSearches))
    }, 800)
  }

  // 处理搜索输入
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    
    // 实时搜索（防抖）
    const timeoutId = setTimeout(() => {
      handleSearch(value)
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }

  // 过滤结果
  const filteredResults = searchResults.filter(result => {
    if (activeTab === 'all') return true
    if (activeTab === 'documents') return result.type === 'document'
    if (activeTab === 'folders') return result.type === 'folder'
    return true
  })

  // 获取图标
  const getResultIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-5 w-5 text-blue-600" />
      case 'folder':
        return <Folder className="h-5 w-5 text-yellow-600" />
      case 'user':
        return <User className="h-5 w-5 text-green-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold">搜索</h1>
        <p className="text-gray-600 mt-1">
          搜索文档、文件夹和其他内容
        </p>
      </div>

      {/* 搜索栏 */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          placeholder="搜索文档、文件夹..."
          value={searchTerm}
          onChange={handleSearchInput}
          className="pl-12 pr-4 py-3 text-lg"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* 最近搜索 */}
      {!searchTerm && recentSearches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Clock className="h-5 w-5 mr-2" />
              最近搜索
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm(term)
                    handleSearch(term)
                  }}
                  className="text-sm"
                >
                  {term}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 搜索结果 */}
      {searchTerm && (
        <div className="space-y-4">
          {/* 结果统计和筛选 */}
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              找到 {filteredResults.length} 个结果
              {searchTerm && ` 关于 "${searchTerm}"`}
            </p>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>
          </div>

          {/* 结果分类标签 */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">
                全部 ({searchResults.length})
              </TabsTrigger>
              <TabsTrigger value="documents">
                文档 ({searchResults.filter(r => r.type === 'document').length})
              </TabsTrigger>
              <TabsTrigger value="folders">
                文件夹 ({searchResults.filter(r => r.type === 'folder').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4 mt-6">
              {filteredResults.map((result) => (
                <Card key={result.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getResultIcon(result.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-medium text-blue-600 hover:text-blue-700">
                            {result.title}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {result.relevance}% 匹配
                          </Badge>
                        </div>
                        
                        {result.description && (
                          <p className="text-gray-600 mb-2">
                            {result.description}
                          </p>
                        )}
                        
                        {result.content && (
                          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                            {result.content}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {result.author && (
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{result.author}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        {result.tags && result.tags.length > 0 && (
                          <div className="flex items-center space-x-2 mt-3">
                            <Tag className="h-3 w-3 text-gray-400" />
                            <div className="flex flex-wrap gap-1">
                              {result.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* 空状态 */}
              {filteredResults.length === 0 && !isSearching && searchTerm && (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    未找到相关结果
                  </h3>
                  <p className="text-gray-600">
                    尝试使用不同的关键词或检查拼写
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}