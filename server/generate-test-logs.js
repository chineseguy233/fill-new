const userLogModel = require('./models/userLog');

// 生成随机用户ID
function generateUserId() {
  return `user_${Math.floor(Math.random() * 10) + 1}`;
}

// 生成随机用户名
const usernames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', 'admin', 'test'];
function generateUsername() {
  return usernames[Math.floor(Math.random() * usernames.length)];
}

// 生成随机IP地址
function generateIP() {
  return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

// 生成随机操作类型
const actionTypes = ['LOGIN', 'LOGOUT', 'VIEW_FILE', 'UPLOAD_FILE', 'DOWNLOAD_FILE', 'DELETE_FILE', 'MOVE_FILE', 'CREATE_FOLDER', 'DELETE_FOLDER', 'UPDATE_FOLDER'];
function generateAction() {
  return actionTypes[Math.floor(Math.random() * actionTypes.length)];
}

// 生成随机文件名
const filenames = ['报告.docx', '财务表.xlsx', '会议记录.pdf', '项目计划.pptx', '数据分析.csv', '用户手册.pdf', '系统设计.jpg', '测试结果.txt', '源代码.zip', '视频演示.mp4'];
function generateFilename() {
  return filenames[Math.floor(Math.random() * filenames.length)];
}

// 生成随机文件夹名
const foldernames = ['文档', '图片', '视频', '音乐', '下载', '桌面', '项目', '工作', '个人', '备份'];
function generateFoldername() {
  return foldernames[Math.floor(Math.random() * foldernames.length)];
}

// 生成随机日期（最近7天内）
function generateDate() {
  const date = new Date();
  // 随机减去0-7天
  date.setDate(date.getDate() - Math.floor(Math.random() * 7));
  // 随机设置小时、分钟和秒
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  date.setSeconds(Math.floor(Math.random() * 60));
  return date.toISOString();
}

// 根据操作类型生成详情
function generateDetails(action) {
  const method = action === 'VIEW_FILE' || action === 'DOWNLOAD_FILE' ? 'GET' : 
                action === 'UPLOAD_FILE' || action === 'MOVE_FILE' || action === 'CREATE_FOLDER' ? 'POST' : 
                action === 'DELETE_FILE' || action === 'DELETE_FOLDER' ? 'DELETE' : 'GET';
  
  let path = '';
  let details = { method };
  
  switch(action) {
    case 'LOGIN':
      path = '/api/auth/login';
      details = { ...details, path, username: generateUsername() };
      break;
    case 'LOGOUT':
      path = '/api/auth/logout';
      details = { ...details, path };
      break;
    case 'VIEW_FILE':
      const filename = generateFilename();
      path = `/api/files/view/${filename}`;
      details = { ...details, path, params: { filename } };
      break;
    case 'UPLOAD_FILE':
      path = '/api/files/upload';
      details = { 
        ...details, 
        path, 
        files: [
          { originalName: generateFilename(), size: Math.floor(Math.random() * 10000000) },
          { originalName: generateFilename(), size: Math.floor(Math.random() * 10000000) }
        ]
      };
      break;
    case 'DOWNLOAD_FILE':
      const dlFilename = generateFilename();
      path = `/api/files/download/${dlFilename}`;
      details = { ...details, path, params: { filename: dlFilename } };
      break;
    case 'DELETE_FILE':
      const delFilename = generateFilename();
      path = `/api/files/delete/${delFilename}`;
      details = { ...details, path, params: { filename: delFilename } };
      break;
    case 'MOVE_FILE':
      path = '/api/files/move';
      details = { 
        ...details, 
        path, 
        filename: generateFilename(),
        targetFolder: generateFoldername()
      };
      break;
    case 'CREATE_FOLDER':
      path = '/api/folders';
      details = { ...details, path, folderName: generateFoldername() };
      break;
    case 'DELETE_FOLDER':
      const folderName = generateFoldername();
      path = `/api/folders/${folderName}`;
      details = { ...details, path, folderName };
      break;
    case 'UPDATE_FOLDER':
      path = '/api/folders';
      details = { 
        ...details, 
        path, 
        oldName: generateFoldername(),
        newName: generateFoldername()
      };
      break;
  }
  
  return details;
}

// 生成测试日志
async function generateTestLogs(count) {
  console.log(`开始生成 ${count} 条测试日志...`);
  
  for (let i = 0; i < count; i++) {
    const userId = generateUserId();
    const username = generateUsername();
    const action = generateAction();
    const timestamp = generateDate();
    const ip = generateIP();
    const details = generateDetails(action);
    
    const logData = {
      userId,
      username,
      action,
      timestamp,
      ip,
      details
    };
    
    try {
      await userLogModel.addLog(logData);
      process.stdout.write('.');
      if ((i + 1) % 50 === 0) {
        process.stdout.write(`${i + 1}\n`);
      }
    } catch (error) {
      console.error(`生成日志 #${i + 1} 失败:`, error);
    }
  }
  
  console.log(`\n成功生成 ${count} 条测试日志!`);
}

// 执行生成
const logCount = process.argv[2] ? parseInt(process.argv[2]) : 100;
generateTestLogs(logCount)
  .then(() => {
    console.log('测试日志生成完成!');
    process.exit(0);
  })
  .catch(error => {
    console.error('生成测试日志时出错:', error);
    process.exit(1);
  });