require('dotenv').config();
const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType
} = require('discord.js');

const db = require('./database');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const express = require('express');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_DISCORD_ID;

// ===== دالة التحقق من الأدمن =====
function isAdmin(userId) {
  if (!ADMIN_ID) {
    console.error('❌ ADMIN_ID غير موجود في .env!');
    return false;
  }
  return userId === ADMIN_ID;
}

// ===== دالة التحقق من صحة الإيميل =====
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ===== توليد subdomain عشوائي =====
function generateRandomSubdomain() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

console.log('\n╔══════════════════════════════════════╗');
console.log('║   🤖 R2 Store - Discord Bot          ║');
console.log('╚══════════════════════════════════════╝\n');
console.log(`🔐 ADMIN_ID: ${ADMIN_ID || '❌ غير موجود'}`);

// ===== عند تشغيل البوت =====
client.once('clientReady', () => {
  console.log(`✅ البوت متصل: ${client.user.tag}`);
  console.log('\n📝 الأوامر المتاحة:');
  console.log('   !shop       - لوحة العملاء');
  console.log('   !admin      - لوحة الأدمن (محمي)');
  console.log('   !mystore    - معلومات متجرك');
  console.log('   !tickets    - نظام التذاكر (للأدمن)');
  console.log('   !tickets-list - عرض التذاكر (للأدمن)');
  console.log('\n🔍 فحص الاشتراكات مفعل (كل ساعة)\n');
  
  if (!ADMIN_ID) {
    console.error('⚠️  تحذير: ADMIN_ID غير مضبوط في .env!');
    console.error('⚠️  جميع أوامر الأدمن لن تعمل!');
  }
  
  setInterval(checkSubscriptions, 3600000);
});

// ===== الأوامر =====
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  const command = message.content.toLowerCase().trim();
  
  // ===== أمر !shop =====
  if (command === '!shop' || command === '!start') {
    try {
      const embed = new EmbedBuilder()
        .setTitle('🏪 **R2 STORE 2025 | E-Commerce Platform**')
        .setDescription(`
**منصة المتاجر الإلكترونية**
**E-Commerce Platform**

Start your online store in minutes!
**ابدأ متجرك الإلكتروني في دقائق!**

**🎯 Available Plans | الباقات المتاحة:**

📦 **Basic** - 50 ريال/شهر
   • 50 Products | 50 منتج
   • Full Control Panel | لوحة تحكم كاملة
   • Custom Design | تصميم مخصص

🥈 **Pro** - 100 ريال/شهر ⭐ **MOST POPULAR**
   • Unlimited Products | منتجات غير محدودة
   • Custom Domain | دومين خاص
   • Priority Support | دعم مميز
   • Advanced Analytics | إحصائيات متقدمة

🥇 **Business** - 250 ريال/شهر
   • All Features | كل الميزات
   • VIP Support | دعم VIP
   • Custom Branding | هوية بصرية كاملة
   • API Access | وصول للـ API

**🎨 كل متجر فريد!**
• رفع لوجو خاص
• ألوان مخصصة
• تصميم احترافي
        `)
        .setColor('#667eea')
        .setImage('https://i.imgur.com/YOUR_SHOP_LOGO.png')
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
          { name: '💳 Payment', value: 'Secure payment gateway', inline: true },
          { name: '🔒 Security', value: 'SSL encryption', inline: true },
          { name: '📞 Support', value: '24/7 available', inline: true }
        )
        .setFooter({ text: 'R2 Store © 2025 | Start Your Journey Today!' })
        .setTimestamp();

      const menu = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('main_menu')
            .setPlaceholder('🛒 Select an option | اختر من القائمة')
            .addOptions([
              { 
                label: '🛒 Purchase Store', 
                description: 'Buy a new store subscription',
                value: 'buy_store', 
                emoji: '🛒' 
              },
              { 
                label: '🏪 My Store', 
                description: 'View your store information',
                value: 'my_store', 
                emoji: '🏪' 
              }
            ])
        );

      await message.channel.send({
        embeds: [embed],
        components: [menu]
      });

      await message.delete().catch(() => {});
      
    } catch (error) {
      console.error('❌ خطأ في !shop:', error.message);
    }
  }

  // ===== أمر !admin =====
  else if (command === '!admin') {
    if (!isAdmin(message.author.id)) {
      console.log(`⚠️ محاولة دخول غير مصرحة من: ${message.author.tag} (${message.author.id})`);
      return message.reply({
        content: '❌ **هذا الأمر للأدمن فقط!**',
        ephemeral: true
      }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
    }

    try {
      db.get('SELECT COUNT(*) as total FROM stores', (err, totalStores) => {
        db.get('SELECT COUNT(*) as total FROM stores WHERE status = "active"', (err, activeStores) => {
          db.get('SELECT COUNT(*) as total FROM support_tickets WHERE status = "open"', (err, openTickets) => {
            
            const embed = new EmbedBuilder()
              .setTitle('⚙️ **R2 STORE - Admin Control Panel**')
              .setDescription(`
**لوحة تحكم الإدارة الرئيسية**
**Main Admin Control Panel**

Welcome back, Admin! 👋
أهلاً بك في لوحة التحكم!

**📊 Quick Stats | إحصائيات سريعة:**
• **Total Stores:** ${totalStores?.total || 0} | إجمالي المتاجر
• **Active Stores:** ${activeStores?.total || 0} | المتاجر النشطة
• **Open Tickets:** ${openTickets?.total || 0} | التذاكر المفتوحة

**Select an option from the menu below:**
**اختر من القائمة في الأسفل:**
              `)
              .setColor('#ff9800')
              .setImage('https://i.imgur.com/YOUR_ADMIN_LOGO.png')
              .setThumbnail(client.user.displayAvatarURL())
              .addFields(
                { name: '📊 الإحصائيات', value: 'عرض إحصائيات المنصة', inline: true },
                { name: '📋 المتاجر', value: 'إدارة جميع المتاجر', inline: true },
                { name: '💰 التقارير', value: 'التقارير المالية', inline: true },
                { name: '⏸️ الموقفة', value: 'المتاجر الموقفة', inline: true },
                { name: '🎫 التذاكر', value: 'نظام الدعم', inline: true },
                { name: '➕ إضافة متجر', value: 'إضافة متجر يدوياً', inline: true },
                { name: '➖ إزالة متجر', value: 'إزالة متجر يدوياً', inline: true }
              )
              .setFooter({ text: 'R2 Store Admin Panel © 2025' })
              .setTimestamp();

            const menu = new ActionRowBuilder()
              .addComponents(
                new StringSelectMenuBuilder()
                  .setCustomId('admin_menu')
                  .setPlaceholder('📋 Admin Control Panel | لوحة تحكم الأدمن')
                  .addOptions([
                    {
                      label: '📊 الإحصائيات',
                      description: 'عرض إحصائيات المنصة الشاملة',
                      value: 'stats',
                      emoji: '📊'
                    },
                    {
                      label: '📋 كل المتاجر',
                      description: 'عرض وإدارة جميع المتاجر',
                      value: 'all_stores',
                      emoji: '📋'
                    },
                    {
                      label: '💰 التقارير المالية',
                      description: 'عرض التقارير والإيرادات',
                      value: 'reports',
                      emoji: '💰'
                    },
                    {
                      label: '⏸️ المتاجر الموقفة',
                      description: 'عرض المتاجر الموقفة',
                      value: 'suspended',
                      emoji: '⏸️'
                    },
                    {
                      label: '🎫 التذاكر',
                      description: 'إحصائيات التذاكر',
                      value: 'tickets',
                      emoji: '🎫'
                    },
                    {
                      label: '➕ إضافة متجر',
                      description: 'إضافة متجر يدوياً بدون دفع',
                      value: 'add_store_manual',
                      emoji: '➕'
                    },
                    {
                      label: '➖ إزالة متجر',
                      description: 'إزالة متجر يدوياً',
                      value: 'remove_store_manual',
                      emoji: '➖'
                    }
                  ])
              );

            message.channel.send({
              embeds: [embed],
              components: [menu]
            }).then(() => {
              message.delete().catch(() => {});
            }).catch(err => {
              console.error('❌ خطأ في إرسال لوحة الأدمن:', err);
            });
          });
        });
      });
      
    } catch (error) {
      console.error('❌ خطأ في !admin:', error.message);
    }
  }

  // ===== أمر !mystore =====
  else if (command === '!mystore') {
    db.get(
      'SELECT * FROM stores WHERE owner_discord_id = ?',
      [message.author.id],
      (err, store) => {
        if (!store) {
          return message.reply({
            content: '❌ **ما عندك متجر نشط.**\n\nاكتب `!shop` للبدء!',
            ephemeral: true
          }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000));
        }
        
        const daysLeft = Math.ceil(
          (new Date(store.subscription_end) - new Date()) / (1000 * 60 * 60 * 24)
        );
        
        const embed = new EmbedBuilder()
          .setTitle('🏪 معلومات متجرك')
          .setDescription(`
**الاسم:** ${store.store_name}
**الرابط:** https://${store.subdomain}.r2store.com
**لوحة التحكم:** https://${store.subdomain}.r2store.com/admin
**الباقة:** ${store.plan}
**المتبقي:** ${daysLeft} يوم
**الحالة:** ${store.status === 'active' ? '✅ نشط' : '⏸️ متوقف'}
          `)
          .setColor(store.status === 'active' ? '#4caf50' : '#ff9800');
        
        message.reply({ embeds: [embed], ephemeral: true });
      }
    );
  }

  // ===== أمر !tickets =====
  else if (command === '!tickets' || command === '!support') {
    if (!isAdmin(message.author.id)) {
      console.log(`⚠️ محاولة وصول غير مصرح للتذاكر من: ${message.author.tag}`);
      return message.reply({
        content: '❌ **هذا الأمر للأدمن فقط!**',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎫 **R2 STORE 2025 | Support System**')
      .setDescription(`
**Ticket Support | نظام التذاكر**

Please select the appropriate category from the menu below to open a ticket.
يرجى اختيار القسم المناسب من القائمة أدناه لفتح تذكرة.

**📋 Categories | الأقسام:**
• 💰 Payment Issues | مشاكل الدفع
• 🔧 Technical Support | الدعم الفني
• 📦 Store Setup | إعداد المتجر
• ❓ General Questions | أسئلة عامة
• 🚨 Report Abuse | الإبلاغ عن إساءة
      `)
      .setColor('#667eea')
      .setImage('https://i.imgur.com/YOUR_SUPPORT_LOGO.png')
      .setFooter({ text: 'R2 Store Support System © 2025' })
      .setTimestamp();

    const categorySelect = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('ticket_category')
          .setPlaceholder('🎫 Select a category | اختر قسماً لفتح تذكرة')
          .addOptions([
            {
              label: '💰 Payment Issues',
              description: 'مشاكل الدفع والاسترداد',
              value: 'payment',
              emoji: '💰'
            },
            {
              label: '🔧 Technical Support',
              description: 'الدعم الفني والمشاكل التقنية',
              value: 'technical',
              emoji: '🔧'
            },
            {
              label: '📦 Store Setup',
              description: 'مساعدة في إعداد المتجر',
              value: 'setup',
              emoji: '📦'
            },
            {
              label: '❓ General Questions',
              description: 'أسئلة واستفسارات عامة',
              value: 'general',
              emoji: '❓'
            },
            {
              label: '🚨 Report Abuse',
              description: 'الإبلاغ عن إساءة استخدام',
              value: 'report',
              emoji: '🚨'
            }
          ])
      );

    await message.channel.send({
      embeds: [embed],
      components: [categorySelect]
    });

    await message.delete().catch(() => {});
  }

  // ===== أمر !tickets-list =====
  else if (command === '!tickets-list') {
    if (!isAdmin(message.author.id)) {
      return message.reply({ content: '❌ **للأدمن فقط!**', ephemeral: true });
    }

    db.all(
      'SELECT * FROM support_tickets WHERE status = "open" ORDER BY created_at DESC',
      [],
      (err, tickets) => {
        const embed = new EmbedBuilder()
          .setTitle('🎫 Open Tickets | التذاكر المفتوحة')
          .setDescription(tickets.length > 0 ? tickets.map((t, i) => 
            `${i+1}. **${t.ticket_id}**\n` +
            `   • المستخدم: <@${t.user_id}>\n` +
            `   • القسم: ${t.category}\n` +
            `   • القناة: <#${t.channel_id}>\n` +
            `   • منذ: <t:${Math.floor(new Date(t.created_at) / 1000)}:R>`
          ).join('\n\n') : '✅ No open tickets | لا توجد تذاكر مفتوحة')
          .setColor('#667eea')
          .setFooter({ text: `Total: ${tickets.length}` });

        message.reply({ embeds: [embed], ephemeral: true });
      }
    );
  }
});

// ===== التفاعلات =====
client.on('interactionCreate', async (interaction) => {
  
  if (!interaction) return;
  
  // ===== القوائم المنسدلة =====
  if (interaction.isStringSelectMenu()) {
    
    // القائمة الرئيسية
    if (interaction.customId === 'main_menu') {
      const value = interaction.values[0];
      
      if (value === 'buy_store') {
        const embed = new EmbedBuilder()
          .setTitle('🛒 اختيار الباقة')
          .setDescription(`
**📦 Basic - 50 ريال/شهر**
   • 50 منتج
   • تصميم مخصص

**🥈 Pro - 100 ريال/شهر**
   • منتجات غير محدودة
   • دومين خاص
   • إحصائيات متقدمة

**🥇 Business - 250 ريال/شهر**
   • كل الميزات
   • دعم VIP
   • API Access
          `)
          .setColor('#667eea');
        
        const select = new ActionRowBuilder()
          .addComponents(
            new StringSelectMenuBuilder()
              .setCustomId('plan_selector')
              .setPlaceholder('👇 اختر الباقة')
              .addOptions([
                { label: 'Basic - 50 ريال', value: 'basic', emoji: '📦' },
                { label: 'Pro - 100 ريال', value: 'pro', emoji: '🥈' },
                { label: 'Business - 250 ريال', value: 'business', emoji: '🥇' }
              ])
          );
        
        await interaction.reply({ embeds: [embed], components: [select], ephemeral: true });
      }
      
      else if (value === 'my_store') {
        db.get(
          'SELECT * FROM stores WHERE owner_discord_id = ?',
          [interaction.user.id],
          (err, store) => {
            if (!store) {
              return interaction.reply({
                content: '❌ **ما عندك متجر نشط.**\n\nاكتب `!shop` للبدء!',
                ephemeral: true
              });
            }
            
            const daysLeft = Math.ceil(
              (new Date(store.subscription_end) - new Date()) / (1000 * 60 * 60 * 24)
            );
            
            const embed = new EmbedBuilder()
              .setTitle('🏪 معلومات متجرك')
              .setDescription(`
**الاسم:** ${store.store_name}
**الرابط:** https://${store.subdomain}.r2store.com
**الباقة:** ${store.plan}
**المتبقي:** ${daysLeft} يوم
**الحالة:** ${store.status === 'active' ? '✅ نشط' : '⏸️ متوقف'}
              `)
              .setColor(store.status === 'active' ? '#4caf50' : '#ff9800');
            
            interaction.reply({ embeds: [embed], ephemeral: true });
          }
        );
      }
    }
    
    // اختيار الباقة
    else if (interaction.customId === 'plan_selector') {
      const plan = interaction.values[0];
      
      const modal = new ModalBuilder()
        .setCustomId(`email_modal_${plan}`)
        .setTitle('📧 أدخل بريدك الإلكتروني');
      
      const emailInput = new TextInputBuilder()
        .setCustomId('email')
        .setLabel('البريد الإلكتروني')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('example@email.com')
        .setRequired(true)
        .setMinLength(5)
        .setMaxLength(100);
      
      modal.addComponents(new ActionRowBuilder().addComponents(emailInput));
      await interaction.showModal(modal);
    }
    
    // قائمة الأدمن (محمية)
    else if (interaction.customId === 'admin_menu') {
      if (!isAdmin(interaction.user.id)) {
        console.log(`⚠️ محاولة استخدام قائمة الأدمن من: ${interaction.user.tag}`);
        return interaction.reply({
          content: '❌ **ما عندك صلاحية!**',
          ephemeral: true
        });
      }

      const value = interaction.values[0];
      
      if (value === 'stats') {
        db.get('SELECT COUNT(*) as total FROM stores', (err, stores) => {
          db.get('SELECT COUNT(*) as total FROM stores WHERE status = "active"', (err, active) => {
            db.get('SELECT COUNT(*) as total FROM stores WHERE status = "suspended"', (err, suspended) => {
              db.get('SELECT SUM(price) as total FROM subscriptions WHERE status = "active"', (err, revenue) => {
                const embed = new EmbedBuilder()
                  .setTitle('📊 إحصائيات المنصة')
                  .setDescription(`
**إجمالي المتاجر:** ${stores?.total || 0}
**المتاجر النشطة:** ${active?.total || 0} ✅
**المتاجر الموقفة:** ${suspended?.total || 0} ⏸️
**الدخل الشهري:** ${revenue?.total || 0} ريال 💰
                  `)
                  .setColor('#4caf50');
                
                interaction.reply({ embeds: [embed], ephemeral: true });
              });
            });
          });
        });
      }
      
      else if (value === 'all_stores') {
        db.all('SELECT * FROM stores ORDER BY created_at DESC LIMIT 10', [], (err, stores) => {
          const embed = new EmbedBuilder()
            .setTitle('📋 آخر 10 متاجر')
            .setDescription(stores.length > 0 ? stores.map((s, i) => 
              `${i+1}. **${s.store_name}**\n` +
              `   • المالك: <@${s.owner_discord_id}>\n` +
              `   • الرابط: ${s.subdomain}.r2store.com\n` +
              `   • الحالة: ${s.status === 'active' ? '✅' : '⏸️'}`
            ).join('\n\n') : 'لا توجد متاجر')
            .setColor('#667eea');
          
          const buttons = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('refresh_stores')
                .setLabel('🔄 تحديث')
                .setStyle(ButtonStyle.Primary)
            );
          
          interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });
        });
      }
      
      else if (value === 'reports') {
        db.get('SELECT SUM(price) as total FROM subscriptions WHERE status = "active"', (err, row) => {
          const embed = new EmbedBuilder()
            .setTitle('💰 التقارير المالية')
            .setDescription(`**الدخل الشهري:** ${row?.total || 0} ريال`)
            .setColor('#f1c40f');
          
          interaction.reply({ embeds: [embed], ephemeral: true });
        });
      }
      
      else if (value === 'suspended') {
        db.all('SELECT * FROM stores WHERE status = "suspended"', [], (err, stores) => {
          const embed = new EmbedBuilder()
            .setTitle('⏸️ المتاجر الموقفة')
            .setDescription(stores.length > 0 ? stores.map((s, i) => 
              `${i+1}. **${s.store_name}**\n` +
              `   • المالك: <@${s.owner_discord_id}>\n` +
              `   • انتهى: ${new Date(s.subscription_end).toLocaleDateString('ar-SA')}`
            ).join('\n\n') : 'لا توجد متاجر موقفة')
            .setColor('#ff9800');
          
          interaction.reply({ embeds: [embed], ephemeral: true });
        });
      }
      
      else if (value === 'tickets') {
        db.get('SELECT COUNT(*) as total FROM support_tickets WHERE status = "open"', (err, open) => {
          db.get('SELECT COUNT(*) as total FROM support_tickets WHERE status = "closed"', (err, closed) => {
            const embed = new EmbedBuilder()
              .setTitle('🎫 إحصائيات التذاكر')
              .setDescription(`
**التذاكر المفتوحة:** ${open?.total || 0}
**التذاكر المغلقة:** ${closed?.total || 0}
**الإجمالي:** ${(open?.total || 0) + (closed?.total || 0)}
              `)
              .setColor('#667eea');
            
            interaction.reply({ embeds: [embed], ephemeral: true });
          });
        });
      }
      
      // =====➕ إضافة متجر يدوياً =====
      else if (value === 'add_store_manual') {
        console.log('📝 فتح نموذج إضافة متجر...');
        
        try {
          const modal = new ModalBuilder()
            .setCustomId('add_store_manual_modal')
            .setTitle('➕ إضافة متجر يدوياً');

          const discordIdInput = new TextInputBuilder()
            .setCustomId('discord_id')
            .setLabel('آيدي ديسكورد للعميل')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('123456789012345678')
            .setRequired(true)
            .setMinLength(17)
            .setMaxLength(20);

          const emailInput = new TextInputBuilder()
            .setCustomId('email')
            .setLabel('البريد الإلكتروني')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('client@email.com')
            .setRequired(true);

          const subdomainInput = new TextInputBuilder()
            .setCustomId('subdomain')
            .setLabel('اسم المتجر (subdomain)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('client-store')
            .setRequired(true)
            .setMinLength(3)
            .setMaxLength(50);

          const storeNameInput = new TextInputBuilder()
            .setCustomId('store_name')
            .setLabel('عنوان المتجر')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('متجر العميل')
            .setRequired(true);

          const planInput = new TextInputBuilder()
            .setCustomId('plan')
            .setLabel('الباقة (basic/pro/business)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('pro')
            .setRequired(true);

          modal.addComponents(
            new ActionRowBuilder().addComponents(discordIdInput),
            new ActionRowBuilder().addComponents(emailInput),
            new ActionRowBuilder().addComponents(subdomainInput),
            new ActionRowBuilder().addComponents(storeNameInput),
            new ActionRowBuilder().addComponents(planInput)
          );

          await interaction.showModal(modal);
          console.log('✅ تم فتح نموذج إضافة متجر بنجاح');
        } catch (error) {
          console.error('❌ خطأ في فتح نموذج إضافة متجر:', error);
          await interaction.reply({
            content: '❌ حدث خطأ في فتح النموذج. حاول مرة أخرى.',
            ephemeral: true
          });
        }
      }
      
      // =====➖ إزالة متجر يدوياً =====
      else if (value === 'remove_store_manual') {
        console.log('🗑️ فتح نموذج إزالة متجر...');
        
        try {
          const modal = new ModalBuilder()
            .setCustomId('remove_store_manual_modal')
            .setTitle('➖ إزالة متجر يدوياً');

          const subdomainInput = new TextInputBuilder()
            .setCustomId('subdomain')
            .setLabel('اسم المتجر (subdomain)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('client-store')
            .setRequired(true)
            .setMinLength(3)
            .setMaxLength(50);

          const reasonInput = new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('سبب الإزالة (اختياري)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('مثال: انتهاك الشروط، طلب من العميل...')
            .setRequired(false);

          modal.addComponents(
            new ActionRowBuilder().addComponents(subdomainInput),
            new ActionRowBuilder().addComponents(reasonInput)
          );

          await interaction.showModal(modal);
          console.log('✅ تم فتح نموذج إزالة متجر بنجاح');
        } catch (error) {
          console.error('❌ خطأ في فتح نموذج إزالة متجر:', error);
          await interaction.reply({
            content: '❌ حدث خطأ في فتح النموذج. حاول مرة أخرى.',
            ephemeral: true
          });
        }
      }
    }
    
    // نظام التذاكر
    else if (interaction.customId === 'ticket_category') {
      const category = interaction.values[0];
      const categories = {
        payment: { name: '💰 Payment Issues', color: '#f1c40f' },
        technical: { name: '🔧 Technical Support', color: '#e74c3c' },
        setup: { name: '📦 Store Setup', color: '#3498db' },
        general: { name: '❓ General Questions', color: '#95a5a6' },
        report: { name: '🚨 Report Abuse', color: '#c0392b' }
      };

      const ticketId = 'TICKET-' + Date.now().toString().slice(-8);
      const userId = interaction.user.id;
      const guild = interaction.guild;
      const channelName = `ticket-${userId}`;
      
      try {
        const existingChannel = guild.channels.cache.find(c => c.name === channelName);
        if (existingChannel) {
          return interaction.reply({
            content: `❌ **You already have an open ticket: ${existingChannel}**\nلديك تذكرة مفتوحة بالفعل: ${existingChannel}`,
            ephemeral: true
          });
        }

        const channel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: guild.id,
              deny: [PermissionFlagsBits.ViewChannel]
            },
            {
              id: userId,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
            },
            {
              id: client.user.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels]
            }
          ],
          topic: `Ticket ID: ${ticketId} | User: ${interaction.user.tag} | Category: ${category}`
        });

        db.run(
          `INSERT INTO support_tickets (ticket_id, user_id, channel_id, category, status, created_at)
           VALUES (?, ?, ?, ?, 'open', ?)`,
          [ticketId, userId, channel.id, category, new Date()],
          (err) => {
            if (err) {
              console.error('❌ خطأ في حفظ التذكرة:', err);
              return interaction.reply({
                content: '❌ حدث خطأ في إنشاء التذكرة',
                ephemeral: true
              });
            }

            const embed = new EmbedBuilder()
              .setTitle(`🎫 Ticket Created | تم إنشاء التذكرة`)
              .setDescription(`
**Ticket ID:** ${ticketId}
**Category:** ${categories[category].name}
**Created:** <t:${Math.floor(Date.now() / 1000)}:R>

**How can we help you?**
**كيف يمكننا مساعدتك؟**

Please describe your issue in detail below.
يرجى وصف مشكلتك بالتفصيل أدناه.
              `)
              .setColor(categories[category].color)
              .setFooter({ text: `User: ${interaction.user.tag}` })
              .setTimestamp();

            const closeButton = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('close_ticket')
                  .setLabel('🔒 Close Ticket | إغلاق التذكرة')
                  .setStyle(ButtonStyle.Danger)
              );

            channel.send({
              content: `<@${userId}>`,
              embeds: [embed],
              components: [closeButton]
            });

            interaction.reply({
              content: `✅ **Ticket created successfully!**\n📂 Channel: ${channel}`,
              ephemeral: true
            });
          }
        );

      } catch (error) {
        console.error('❌ خطأ في إنشاء القناة:', error);
        interaction.reply({
          content: '❌ حدث خطأ في إنشاء التذكرة',
          ephemeral: true
        });
      }
    }
  }
  
  // ===== النوافذ المنبثقة =====
  else if (interaction.isModalSubmit()) {
    
    // شراء متجر
    if (interaction.customId.startsWith('email_modal_')) {
      const plan = interaction.customId.replace('email_modal_', '');
      const email = interaction.fields.getTextInputValue('email').trim();
      
      if (!isValidEmail(email)) {
        return interaction.reply({
          content: '❌ **البريد الإلكتروني غير صالح!**\n\nيرجى إدخال بريد إلكتروني صحيح.\nمثال: `example@email.com`',
          ephemeral: true
        });
      }
      
      const prices = { basic: 50, pro: 100, business: 250 };
      const paymentId = crypto.randomBytes(16).toString('hex');
      
      const embed = new EmbedBuilder()
        .setTitle(`🛒 تأكيد شراء باقة ${plan.toUpperCase()}`)
        .setDescription(`
**البريد:** ${email}
**الباقة:** ${plan}
**السعر:** ${prices[plan]} ريال/شهر
**المدة:** 30 يوم

**بعد الدفع:**
1. رح ينخلق متجرك تلقائياً
2. رح تستلم رابط المتجر ولوحة التحكم
3. كلمة المرور على بريدك
4. رح تقدر تخصص المتجر (لوجو، ألوان، تصميم)
        `)
        .setColor('#667eea');
      
      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`confirm_buy_${plan}_${email}`)
            .setLabel('✅ تأكيد الشراء')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('❌ إلغاء')
            .setStyle(ButtonStyle.Danger)
        );
      
      await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });
    }
    
    // =====➕ إضافة متجر يدوياً =====
    else if (interaction.customId === 'add_store_manual_modal') {
      if (!isAdmin(interaction.user.id)) {
        return interaction.reply({
          content: '❌ **ما عندك صلاحية!**',
          ephemeral: true
        });
      }

      const discordId = interaction.fields.getTextInputValue('discord_id');
      const email = interaction.fields.getTextInputValue('email').trim();
      const subdomain = interaction.fields.getTextInputValue('subdomain').toLowerCase().trim();
      const storeName = interaction.fields.getTextInputValue('store_name');
      const plan = interaction.fields.getTextInputValue('plan').toLowerCase();

      if (!isValidEmail(email)) {
        return interaction.reply({
          content: '❌ **البريد الإلكتروني غير صالح!**',
          ephemeral: true
        });
      }

      // التحقق من أن subdomain غير موجود
      db.get(
        'SELECT id FROM stores WHERE subdomain = ?',
        [subdomain],
        (err, existing) => {
          if (existing) {
            return interaction.reply({
              content: `❌ **اسم المتجر موجود بالفعل!**\n\nالرابط \`${subdomain}.r2store.com\` مستخدم من قبل.\n\nيرجى اختيار اسم مختلف.`,
              ephemeral: true
            });
          }

          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 30);
          const planPrices = { basic: 50, pro: 100, business: 250 };
          const tempPassword = crypto.randomBytes(8).toString('base64').slice(0, 12);
          
          // ألوان عشوائية
          const colors = [
            { primary: '#6366f1', secondary: '#8b5cf6' },
            { primary: '#ec4899', secondary: '#f43f5e' },
            { primary: '#10b981', secondary: '#34d399' }
          ];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];

          bcrypt.hash(tempPassword, 10, (err, hashedPassword) => {
            db.serialize(() => {
              db.run(
                `INSERT INTO stores (subdomain, store_name, owner_discord_id, owner_email, owner_password, plan, status, subscription_end)
                 VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
                [subdomain, storeName, discordId, email, hashedPassword, plan, endDate],
                function(err) {
                  if (err) {
                    return interaction.reply({
                      content: `❌ فشل إنشاء المتجر: ${err.message}`,
                      ephemeral: true
                    });
                  }
                  const storeId = this.lastID;

                  db.run(
                    `INSERT INTO subscriptions (store_id, plan, price, status, start_date, end_date)
                     VALUES (?, ?, ?, 'active', ?, ?)`,
                    [storeId, plan, planPrices[plan], startDate, endDate]
                  );
                  
                  // إضافة تخصيصات المتجر
                  db.run(
                    `INSERT INTO store_customizations (store_id, primary_color, secondary_color)
                     VALUES (?, ?, ?)`,
                    [storeId, randomColor.primary, randomColor.secondary]
                  );

                  const embed = new EmbedBuilder()
                    .setTitle('✅ تم إنشاء المتجر يدوياً!')
                    .setDescription(`
**اسم المتجر:** ${storeName}
**الرابط:** https://${subdomain}.r2store.com
**الباقة:** ${plan}
**المالك:** <@${discordId}>
**كلمة المرور:** ${tempPassword}

⚠️ **أرسل كلمة المرور للعميل!**
                    `)
                    .setColor(randomColor.primary);

                  interaction.reply({ embeds: [embed], ephemeral: true });

                  client.users.fetch(discordId).then(async (user) => {
                    await user.send({
                      content: `
🎉 **تم إنشاء متجرك بواسطة الإدارة!**

🏪 **اسم المتجر:** ${storeName}
🔗 **الرابط:** https://${subdomain}.r2store.com
🔐 **لوحة التحكم:** https://${subdomain}.r2store.com/admin
📧 **البريد:** ${email}
🔑 **كلمة المرور:** ${tempPassword}

🎨 **يمكنك الآن:**
• رفع اللوجو الخاص بك
• تغيير الألوان والتصميم
• إضافة المنتجات

⚠️ **غيّر كلمة المرور من أول دخول!**
                      `
                    });
                  }).catch(() => {});
                }
              );
            });
          });
        }
      );
    }
    
    // =====➖ إزالة متجر يدوياً =====
    else if (interaction.customId === 'remove_store_manual_modal') {
      if (!isAdmin(interaction.user.id)) {
        return interaction.reply({
          content: '❌ **ما عندك صلاحية!**',
          ephemeral: true
        });
      }

      const subdomain = interaction.fields.getTextInputValue('subdomain');
      const reason = interaction.fields.getTextInputValue('reason') || 'بدون سبب';

      db.get(
        'SELECT * FROM stores WHERE subdomain = ?',
        [subdomain],
        (err, store) => {
          if (!store) {
            return interaction.reply({
              content: `❌ **المتجر غير موجود!**\n\nلم يتم العثور على متجر بالاسم: \`${subdomain}\``,
              ephemeral: true
            });
          }

          const confirmEmbed = new EmbedBuilder()
            .setTitle('⚠️ تأكيد إزالة المتجر')
            .setDescription(`
**هل أنت متأكد من إزالة هذا المتجر؟**

**📋 معلومات المتجر:**
• **الاسم:** ${store.store_name}
• **الرابط:** ${store.subdomain}.r2store.com
• **المالك:** <@${store.owner_discord_id}>
• **البريد:** ${store.owner_email}
• **الباقة:** ${store.plan}

**سبب الإزالة:** ${reason}

⚠️ **هذا الإجراء لا يمكن التراجع عنه!**
            `)
            .setColor('#ff9800')
            .setTimestamp();

          const buttons = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId(`confirm_delete_${store.id}`)
                .setLabel('🗑️ تأكيد الحذف')
                .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                .setCustomId('cancel_delete')
                .setLabel('❌ إلغاء')
                .setStyle(ButtonStyle.Secondary)
            );

          interaction.reply({ 
            embeds: [confirmEmbed], 
            components: [buttons], 
            ephemeral: true 
          });
        }
      );
    }
  }
  
  // ===== الأزرار =====
  else if (interaction.isButton()) {
    
    if (interaction.customId.startsWith('confirm_buy_')) {
      const parts = interaction.customId.replace('confirm_buy_', '').split('_');
      const plan = parts[0];
      const email = parts.slice(1).join('_');
      const prices = { basic: 50, pro: 100, business: 250 };
      const paymentId = crypto.randomBytes(16).toString('hex');
      
      db.run(
        `INSERT INTO payment_requests (discord_id, email, plan, amount, payment_id, status, type, created_at)
         VALUES (?, ?, ?, ?, ?, 'pending', 'new', ?)`,
        [interaction.user.id, email, plan, prices[plan], paymentId, new Date()],
        async (err) => {
          if (err) {
            return interaction.reply({
              content: '❌ حدث خطأ، حاول مرة أخرى',
              ephemeral: true
            });
          }
          
          const embed = new EmbedBuilder()
            .setTitle('💳 رابط الدفع')
            .setDescription(`
**الباقة:** ${plan}
**المبلغ:** ${prices[plan]} ريال
**الرابط:** https://payment.r2store.com/pay?id=${paymentId}

⏰ **الرابط صالح لمدة 15 دقيقة**

بعد الدفع، سيتم:
1. إنشاء متجرك الخاص فوراً
2. إرسال رابط المتجر ولوحة التحكم
3. تخصيص المتجر (لوجو، ألوان، تصميم)
            `)
            .setColor('#4caf50');
          
          await interaction.reply({ embeds: [embed], ephemeral: true });
        }
      );
    }
    
    else if (interaction.customId === 'close_ticket') {
      const ticketChannel = interaction.channel;
      
      db.get(
        'SELECT * FROM support_tickets WHERE channel_id = ?',
        [ticketChannel.id],
        (err, ticket) => {
          if (!ticket) {
            return interaction.reply({
              content: '❌ تذكرة غير موجودة',
              ephemeral: true
            });
          }

          const embed = new EmbedBuilder()
            .setTitle('🔒 Ticket Closed | تم إغلاق التذكرة')
            .setDescription(`
**Ticket ID:** ${ticket.ticket_id}
**Closed by:** ${interaction.user.tag}
**Duration:** <t:${Math.floor(new Date(ticket.created_at) / 1000)}:R>

Thank you for contacting support!
شكراً لتواصلك مع الدعم!
            `)
            .setColor('#e74c3c')
            .setTimestamp();

          interaction.reply({
            content: '🔒 **Closing ticket in 5 seconds...**',
            ephemeral: true
          });

          db.run(
            'UPDATE support_tickets SET status = "closed", closed_at = ?, closed_by = ? WHERE id = ?',
            [new Date(), interaction.user.id, ticket.id]
          );

          setTimeout(async () => {
            await ticketChannel.send({ embeds: [embed] });
            await ticketChannel.delete();
          }, 5000);
        }
      );
    }
    
    else if (interaction.customId === 'cancel') {
      await interaction.reply({
        content: '❌ تم الإلغاء',
        ephemeral: true
      });
    }
    
    else if (interaction.customId === 'cancel_delete') {
      await interaction.reply({
        content: '❌ **تم إلغاء عملية الحذف**',
        ephemeral: true
      });
    }
    
    else if (interaction.customId.startsWith('confirm_delete_')) {
      if (!isAdmin(interaction.user.id)) {
        return interaction.reply({ content: '❌ للأدمن فقط!', ephemeral: true });
      }

      const storeId = interaction.customId.replace('confirm_delete_', '');

      db.get(
        'SELECT * FROM stores WHERE id = ?',
        [storeId],
        (err, store) => {
          if (!store) {
            return interaction.reply({
              content: '❌ **المتجر غير موجود!**',
              ephemeral: true
            });
          }

          db.run(
            'DELETE FROM stores WHERE id = ?',
            [storeId],
            (err) => {
              if (err) {
                return interaction.reply({
                  content: `❌ **فشل حذف المتجر:** ${err.message}`,
                  ephemeral: true
                });
              }

              const embed = new EmbedBuilder()
                .setTitle('✅ تم حذف المتجر بنجاح!')
                .setDescription(`
**🗑️ معلومات المتجر المحذوف:**
• **الاسم:** ${store.store_name}
• **الرابط:** ${store.subdomain}.r2store.com
• **المالك:** <@${store.owner_discord_id}>
• **البريد:** ${store.owner_email}
                `)
                .setColor('#4caf50')
                .setTimestamp();

              interaction.reply({ embeds: [embed], ephemeral: true });

              client.users.fetch(store.owner_discord_id).then(async (user) => {
                await user.send({
                  content: `
⚠️ **تم حذف متجرك من قبل الإدارة**

🏪 **اسم المتجر:** ${store.store_name}
🔗 **الرابط:** ${store.subdomain}.r2store.com

إذا كان لديك أي استفسار، يرجى التواصل مع الدعم.
                  `
                });
              }).catch(() => {});
            }
          );
        }
      );
    }

    else if (interaction.customId === 'refresh_stores') {
      if (!isAdmin(interaction.user.id)) {
        return interaction.reply({ content: '❌ للأدمن فقط!', ephemeral: true });
      }

      db.all('SELECT * FROM stores ORDER BY created_at DESC LIMIT 10', [], (err, stores) => {
        const embed = new EmbedBuilder()
          .setTitle('📋 آخر 10 متاجر')
          .setDescription(stores.length > 0 ? stores.map((s, i) => 
            `${i+1}. **${s.store_name}**\n` +
            `   • المالك: <@${s.owner_discord_id}>\n` +
            `   • الرابط: ${s.subdomain}.r2store.com\n` +
            `   • الحالة: ${s.status === 'active' ? '✅' : '⏸️'}`
          ).join('\n\n') : 'لا توجد متاجر')
          .setColor('#667eea');

        interaction.update({ embeds: [embed] });
      });
    }
  }
});

// ===== Webhook للدفع =====
const app = express();
app.use(express.json());

app.post('/api/payment-webhook', async (req, res) => {
  try {
    const { payment_id, status, discord_id, email, plan, type, store_id } = req.body;
    
    if (status !== 'completed') {
      return res.json({ success: true });
    }
    
    db.get(
      'SELECT * FROM payment_requests WHERE payment_id = ? AND status = "pending"',
      [payment_id],
      async (err, payment) => {
        if (!payment) return res.json({ success: true });
        
        db.run(
          'UPDATE payment_requests SET status = "completed", completed_at = ? WHERE id = ?',
          [new Date(), payment.id]
        );
        
        if (type === 'renewal' && store_id) {
          db.get('SELECT * FROM stores WHERE id = ?', [store_id], (err, store) => {
            if (!store) return;
            
            const newEndDate = new Date(store.subscription_end || new Date());
            newEndDate.setDate(newEndDate.getDate() + 30);
            
            db.run(
              'UPDATE stores SET status = "active", subscription_end = ? WHERE id = ?',
              [newEndDate, store.id]
            );
            
            client.users.fetch(store.owner_discord_id).then(async (user) => {
              await user.send({
                content: `✅ **تم تجديد متجرك!**\n📅 الانتهاء: ${newEndDate.toLocaleDateString('ar-SA')}`
              });
            }).catch(() => {});
          });
        } else {
          // ===== إنشاء متجر جديد مخصص برابط عشوائي =====
          let subdomain = generateRandomSubdomain();
          
          // التحقق من أن الـ subdomain غير مستخدم
          const checkSubdomain = () => {
            return new Promise((resolve, reject) => {
              db.get('SELECT id FROM stores WHERE subdomain = ?', [subdomain], (err, row) => {
                if (row) {
                  subdomain = generateRandomSubdomain();
                  checkSubdomain().then(resolve).catch(reject);
                } else {
                  resolve();
                }
              });
            });
          };
          
          await checkSubdomain();
          
          const storeName = `متجر ${subdomain}`;
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 30);
          const planPrices = { basic: 50, pro: 100, business: 250 };
          const tempPassword = crypto.randomBytes(8).toString('base64').slice(0, 12);
          
          // ألوان عشوائية للمتجر
          const colors = [
            { primary: '#6366f1', secondary: '#8b5cf6' },
            { primary: '#ec4899', secondary: '#f43f5e' },
            { primary: '#10b981', secondary: '#34d399' },
            { primary: '#f59e0b', secondary: '#fbbf24' },
            { primary: '#3b82f6', secondary: '#60a5fa' }
          ];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          
          bcrypt.hash(tempPassword, 10, (err, hashedPassword) => {
            db.serialize(() => {
              db.run(
                `INSERT INTO stores (subdomain, store_name, owner_discord_id, owner_email, owner_password, plan, status, subscription_end)
                 VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
                [subdomain, storeName, discord_id, email, hashedPassword, plan, endDate],
                function(err) {
                  if (err) return console.error('❌ خطأ:', err);
                  const storeId = this.lastID;
                  
                  db.run(
                    `INSERT INTO subscriptions (store_id, plan, price, status, start_date, end_date)
                     VALUES (?, ?, ?, 'active', ?, ?)`,
                    [storeId, plan, planPrices[plan], startDate, endDate]
                  );
                  
                  // إضافة تخصيصات المتجر
                  db.run(
                    `INSERT INTO store_customizations (store_id, primary_color, secondary_color)
                     VALUES (?, ?, ?)`,
                    [storeId, randomColor.primary, randomColor.secondary]
                  );
                  
                  console.log(`✅ تم إنشاء المتجر: ${subdomain}.r2store.com`);
                  
                  if (discord_id) {
                    client.users.fetch(discord_id).then(async (user) => {
                      const storeEmbed = new EmbedBuilder()
                        .setTitle('🎉 **تم إنشاء متجرك بنجاح!**')
                        .setDescription(`
**🏪 اسم المتجر:** ${storeName}
**🔗 رابط المتجر:** https://${subdomain}.r2store.com
**🔐 لوحة التحكم:** https://${subdomain}.r2store.com/admin
**📧 البريد:** ${email}
**🔑 كلمة المرور:** ${tempPassword}

**🎨 متجرك جاهز للتخصيص!**
يمكنك الآن:
• رفع اللوجو الخاص بك
• تغيير الألوان والتصميم
• إضافة المنتجات
• إدارة الطلبات

**⚠️ غيّر كلمة المرور من أول دخول!**
                        `)
                        .setColor(randomColor.primary)
                        .setImage('https://i.imgur.com/YOUR_WELCOME_IMAGE.png')
                        .setTimestamp();
                      
                      const controlPanel = new ActionRowBuilder()
                        .addComponents(
                          new ButtonBuilder()
                            .setLabel('🏪 زيارة المتجر')
                            .setURL(`https://${subdomain}.r2store.com`)
                            .setStyle(ButtonStyle.Link),
                          new ButtonBuilder()
                            .setLabel('⚙️ لوحة التحكم')
                            .setURL(`https://${subdomain}.r2store.com/admin`)
                            .setStyle(ButtonStyle.Link)
                        );
                      
                      await user.send({
                        embeds: [storeEmbed],
                        components: [controlPanel]
                      });
                    }).catch(() => {});
                  }
                }
              );
            });
          });
        }
        
        res.json({ success: true });
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

const WEBHOOK_PORT = process.env.WEBHOOK_PORT || 3001;
app.listen(WEBHOOK_PORT, () => {
  console.log(`🔗 Webhook server on port ${WEBHOOK_PORT}`);
});

// ===== فحص الاشتراكات =====
async function checkSubscriptions() {
  console.log('\n🔍 جاري فحص الاشتراكات...');
  
  const now = new Date();
  
  db.all('SELECT * FROM stores WHERE status = "active"', [], async (err, stores) => {
    if (err) return console.error('❌ خطأ:', err);
    
    for (const store of stores) {
      const endDate = new Date(store.subscription_end);
      const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      
      if (daysLeft === 3) {
        try {
          const user = await client.users.fetch(store.owner_discord_id);
          await user.send({
            content: `⚠️ **متجرك ينتهي بعد 3 أيام!**\n🏪 ${store.store_name}\n📅 ${endDate.toLocaleDateString('ar-SA')}`
          });
          console.log(`✅ تنبيه لـ ${store.store_name}`);
        } catch (e) {}
      }
      
      if (endDate < now) {
        db.run('UPDATE stores SET status = "suspended" WHERE id = ?', [store.id]);
        try {
          const user = await client.users.fetch(store.owner_discord_id);
          await user.send({
            content: `❌ **تم إيقاف متجرك!**\n🏪 ${store.store_name}\n\nجدّد الآن ليعمل فوراً:\nhttps://${store.subdomain}.r2store.com/admin/renew`
          });
          console.log(`⏸️ تم إيقاف ${store.store_name}`);
        } catch (e) {}
      }
    }
    
    console.log('✅ انتهى الفحص\n');
  });
}

// ===== تشغيل البوت =====
client.login(TOKEN);