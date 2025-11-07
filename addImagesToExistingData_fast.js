// ✅ addImagesToExistingData_fast.js (Puppeteer 최신 버전 완전 호환)
require('dotenv').config();
const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const Trip = require('./models/tripSchema');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => {
    console.error('❌ MongoDB 연결 실패:', err);
    process.exit(1);
  });

(async () => {
  try {
    console.log('🧹 기존 image_url 필드 초기화 중...\n');
    // ⚠️ 기존 이미지 URL 전부 비우기 (staticmap 포함)
    await Trip.updateMany({}, { $set: { image_url: '' } });
    console.log('✅ 기존 이미지 URL 모두 초기화 완료!\n');

    console.log('🔍 전체 Trip 데이터 불러오는 중...');
    const trips = await Trip.find({ url: { $exists: true, $ne: '' } });
    console.log(`📦 처리할 데이터: ${trips.length}개\n`);

    if (trips.length === 0) {
      console.log('⚠️ 처리할 데이터가 없습니다.');
      process.exit(0);
    }

    // ✅ Puppeteer 한 번만 실행 (브라우저 재사용)
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    let successCount = 0;
    let failCount = 0;
    const total = trips.length;

    // ✅ 순차 실행 (봇 차단 방지용)
    for (let i = 0; i < total; i++) {
      const trip = trips[i];
      const index = i + 1;

      if (!trip.url) {
        console.log(`  [${index}] ⏭️ ${trip.name} - URL 없음`);
        continue;
      }

      console.log(`  [${index}] 🖼️ ${trip.name}`);

      try {
        await page.goto(trip.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        // ✅ 최신 Puppeteer 호환 대기 방식
        await new Promise(r => setTimeout(r, 1500));

        const imageUrl = await page.evaluate(() => {
          const selectors = [
            '.link_photo img',
            '.photo_area img',
            '.place_thumb img',
            '.img_place',
            'meta[property="og:image"]'
          ];
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el) return el.src || el.content;
          }
          return null;
        });

        if (imageUrl && !imageUrl.includes('staticmap')) {
          trip.image_url = imageUrl.startsWith('http') ? imageUrl : 'https:' + imageUrl;
          await trip.save();
          console.log(`  [${index}] ✅ ${trip.name.substring(0, 25)}... 완료`);
          successCount++;
        } else {
          console.log(`  [${index}] ❌ ${trip.name.substring(0, 25)}... 이미지 없음`);
          failCount++;
        }
      } catch (err) {
        console.log(`  [${index}] ⚠️ ${trip.name} - 오류: ${err.message}`);
        failCount++;
      }

      // ✅ 카카오 측 차단 방지용 (약간의 대기)
      await new Promise(r => setTimeout(r, 400));

      const progress = ((index / total) * 100).toFixed(1);
      process.stdout.write(`📊 진행률: ${progress}% | ✅ ${successCount} | ❌ ${failCount}\r`);
    }

    console.log('\n\n🎉 이미지 업데이트 완료!');
    console.log(`✅ 성공: ${successCount}`);
    console.log(`❌ 실패: ${failCount}`);
    console.log(`📊 성공률: ${(successCount / total * 100).toFixed(1)}%`);

    await browser.close();
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 전체 오류 발생:', error);
    process.exit(1);
  }
})();
