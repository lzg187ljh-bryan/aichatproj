/**
 * 清空数据库脚本
 * 使用 Supabase Service Role Key 删除所有数据
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nlllalplgxewnrbbabaf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('Usage: SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/clear-database.mjs');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function clearDatabase() {
  console.log('🗑️  Clearing database...');
  
  try {
    // 先获取数量
    const { count: msgCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });
    
    const { count: convCount } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Current data: ${msgCount} messages, ${convCount} conversations`);
    
    // 删除 messages（先删，因为有外键依赖）
    const { error: msgError } = await supabase
      .from('messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 删除所有
    
    if (msgError) {
      console.error('❌ Error deleting messages:', msgError);
    } else {
      console.log('✅ Messages deleted');
    }
    
    // 删除 conversations
    const { error: convError } = await supabase
      .from('conversations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 删除所有
    
    if (convError) {
      console.error('❌ Error deleting conversations:', convError);
    } else {
      console.log('✅ Conversations deleted');
    }
    
    // 验证
    const { count: msgCountAfter } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });
    
    const { count: convCountAfter } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 After cleanup: ${msgCountAfter} messages, ${convCountAfter} conversations`);
    console.log('✅ Database cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearDatabase();
